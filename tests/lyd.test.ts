// @vitest-environment node
import { spawnSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renTekst } from '../src/content';
import kapitel1 from '../src/content/kapitler/kapitel1.json';
import { lydNoegle } from '../src/content/lydnoegle.mjs';
import stemmer from '../src/content/stemmer.json';
import { alleLydtekster } from '../scripts/lydtekster.mjs';

const poster = alleLydtekster();
const harFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

describe('lydklip', () => {
  it('har stemme og stil til alle figurer', () => {
    for (const [figur, f] of Object.entries(stemmer.figurer)) {
      expect(f.stemme, figur).toMatch(/^[A-Z][a-z]+$/);
      expect(f.stil.length, figur).toBeGreaterThan(20);
    }
  });

  it('dækker alle replikker i kapitel 1 med den rigtige figur', () => {
    for (const trin of kapitel1.trin) {
      const replikker = (trin as { replikker?: { taler: string; tekst: string }[] }).replikker ?? [];
      for (const r of replikker) {
        const p = poster.find((x) => x.figur === r.taler && x.tekst === renTekst(r.tekst));
        expect(p, `${trin.id}: ${r.tekst}`).toBeDefined();
      }
    }
  });

  it('bruger samme tekst og nøgle i spillet og i scriptet', () => {
    for (const p of poster) {
      expect(renTekst(p.raa).trim()).toBe(p.tekst);
      expect(lydNoegle(p.tekst, p.figur, stemmer)).toBe(p.noegle);
    }
  });

  it('skifter nøgle, når stemme, stil eller tekst skifter', () => {
    const a = lydNoegle('Hej', 'fortaeller', stemmer);
    const andenStemme = { ...stemmer, figurer: { ...stemmer.figurer, fortaeller: { ...stemmer.figurer.fortaeller, stemme: 'Kore' } } };
    const andenStil = { ...stemmer, figurer: { ...stemmer.figurer, fortaeller: { ...stemmer.figurer.fortaeller, stil: 'Whisper.' } } };
    expect(a).toMatch(/^[0-9a-f]{14}$/);
    expect(lydNoegle('Hej', 'fortaeller', andenStemme)).not.toBe(a);
    expect(lydNoegle('Hej', 'fortaeller', andenStil)).not.toBe(a);
    expect(lydNoegle('Hej!', 'fortaeller', stemmer)).not.toBe(a);
    expect(lydNoegle('Hej', 'ukendt', stemmer)).toBeNull();
  });

  it('har en fil til hver post i manifestet og ingen løse filer', () => {
    const mappe = 'public/lyd';
    if (!existsSync(join(mappe, 'manifest.json'))) return;
    const m = JSON.parse(readFileSync(join(mappe, 'manifest.json'), 'utf8')) as { filer: Record<string, { fil: string }> };
    const filer = new Set(readdirSync(mappe).filter((f) => f.endsWith('.ogg')));
    for (const f of Object.values(m.filer)) expect(filer.has(f.fil), f.fil).toBe(true);
    expect(filer.size).toBe(Object.keys(m.filer).length);
  });

  it.skipIf(!harFfmpeg)('laver klip med en falsk Gemini-server og stopper pænt, når kvoten er brugt', { timeout: 60_000 }, async () => {
    const wav = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.6', '-ar', '24000', '-ac', '1', '-c:a', 'pcm_s16le', '-f', 'wav', 'pipe:1']).stdout;
    const modtaget: { voice: string; style: string; text: string; model: string; key: string }[] = [];
    let kald = 0;
    const server = createServer((req, res) => {
      let krop = '';
      req.on('data', (d) => (krop += d));
      req.on('end', () => {
        kald++;
        const j = JSON.parse(krop);
        modtaget.push({
          model: j.model,
          voice: j.generation_config.speech_config[0].voice,
          style: j.input[0].content[0].annotations[0].style,
          text: j.input[0].content[0].text,
          key: String(req.headers['x-goog-api-key']),
        });
        if (kald > 2) {
          res.writeHead(429, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Quota exceeded for metric: requests per day' } }));
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ steps: [{ type: 'model_output', content: [{ type: 'audio', mime_type: 'audio/wav', data: wav.toString('base64') }] }] }));
      });
    });
    await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
    const port = (server.address() as AddressInfo).port;
    const mappe = mkdtempSync(join(tmpdir(), 'pennedal-lyd-'));
    try {
      const kode = await new Promise<number>((ok) => {
        const p = spawn(process.execPath, ['scripts/lav-lyd.mjs'], {
          env: {
            ...process.env,
            GEMINI_API_KEY: 'test-noegle',
            GEMINI_BASE: `http://127.0.0.1:${port}`,
            LYD_MAPPE: mappe,
            LYD_STATUS_FIL: join(mappe, 'status.md'),
            LYD_MAKS: '5',
            LYD_PAUSE_MS: '0',
            GITHUB_STEP_SUMMARY: '',
          },
          stdio: 'ignore',
        });
        p.on('close', (k) => ok(k ?? 1));
      });
      expect(kode).toBe(0);
      const m = JSON.parse(readFileSync(join(mappe, 'manifest.json'), 'utf8'));
      expect(Object.keys(m.filer)).toHaveLength(2);
      expect(m.mangler).toBe(poster.length - 2);
      const ogg = readdirSync(mappe).filter((f) => f.endsWith('.ogg'));
      expect(ogg).toHaveLength(2);
      const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', join(mappe, ogg[0])]);
      expect(probe.stdout.toString().trim()).toBe('opus');
      const status = readFileSync(join(mappe, 'status.md'), 'utf8');
      expect(status).toContain('kvote');
      expect(status).toContain('requests per day');
      // Kun spillets egne tekster, med figurens stemme og stil, bliver sendt.
      const gyldige = new Map(poster.map((p) => [p.tekst, p]));
      for (const r of modtaget) {
        const p = gyldige.get(r.text);
        expect(p, r.text).toBeDefined();
        const f = stemmer.figurer[p!.figur as keyof typeof stemmer.figurer];
        expect(r.voice).toBe(f.stemme);
        expect(r.style).toBe(f.stil);
        expect(r.model).toBe(stemmer.model);
        expect(r.key).toBe('test-noegle');
      }
    } finally {
      server.close();
      rmSync(mappe, { recursive: true, force: true });
    }
  });
});
