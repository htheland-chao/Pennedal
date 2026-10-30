#!/usr/bin/env node
// Laver indtalte lydklip til spillets faste tekster med Google Gemini TTS.
//
// Sikkerhed: Scriptet sender KUN tekster fra alleLydtekster() (src/content). Elevtekster findes ikke
// i repoet og kan derfor ikke komme med. Nøglen læses fra GEMINI_API_KEY og skrives aldrig ud.
//
// Brug:
//   node scripts/lav-lyd.mjs               laver op til LYD_MAKS nye klip (kræver GEMINI_API_KEY)
//   node scripts/lav-lyd.mjs --kun-status  opdaterer kun manifestet (fjerner forældede klip, tæller manglende)
//
// Miljøvariabler: GEMINI_API_KEY, LYD_MAKS (40), LYD_PAUSE_MS (6500), LYD_OMGOER (nøgler adskilt med komma),
// LYD_MAPPE (public/lyd), LYD_STATUS_FIL (lyd-status.md), GEMINI_BASE (kun til test).
import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taleTekst } from '../src/content/lydnoegle.mjs';
import { alleLydtekster, hentStemmer } from './lydtekster.mjs';

const ROD = fileURLToPath(new URL('..', import.meta.url));
const MAPPE = resolve(process.env.LYD_MAPPE || join(ROD, 'public/lyd'));
const MANIFEST = join(MAPPE, 'manifest.json');
const STATUS_FIL = resolve(process.env.LYD_STATUS_FIL || join(ROD, 'lyd-status.md'));
const MAKS = Math.max(0, Number(process.env.LYD_MAKS || 40));
const PAUSE = Math.max(0, Number(process.env.LYD_PAUSE_MS ?? 6500));
const BASE = process.env.GEMINI_BASE || 'https://generativelanguage.googleapis.com';
const OMGOER = (process.env.LYD_OMGOER || '').split(/[\s,]+/).filter(Boolean);
const NOEGLE = process.env.GEMINI_API_KEY || '';
const kunStatus = process.argv.includes('--kun-status');

// Fjern stilhed i starten og slutningen, og gør alle stemmer lige høje.
const FILTER = [
  'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB',
  'areverse',
  'silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB',
  'areverse',
  'loudnorm=I=-18:TP=-2:LRA=11',
].join(',');

class KvoteBrugt extends Error {}
class StopFejl extends Error {}

const vent = (ms) => new Promise((r) => setTimeout(r, ms));

function laesManifest() {
  try {
    const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    if (m && typeof m === 'object' && m.filer && typeof m.filer === 'object') return m;
  } catch {
    /* intet manifest endnu */
  }
  return { version: 1, filer: {} };
}

function skrivManifest(m) {
  const filer = Object.fromEntries(Object.entries(m.filer).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MANIFEST, JSON.stringify({ ...m, filer }, null, 2) + '\n');
}

function findLyd(data) {
  for (const trin of [...(data?.steps ?? [])].reverse())
    for (const c of [...(trin?.content ?? [])].reverse()) if (c?.type === 'audio' && c.data) return c;
  if (data?.output_audio?.data) return data.output_audio;
  return null;
}

function ventetid(tekst) {
  const m = tekst.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return m ? Math.ceil(Number(m[1])) : null;
}

async function hentLyd(tekst, figur, model, udtale) {
  const krop = {
    model,
    input: [
      {
        type: 'user_input',
        content: [{ type: 'text', text: taleTekst(tekst, udtale), annotations: [{ type: 'speech_metadata', style: figur.stil }] }],
      },
    ],
    response_format: { type: 'audio', mime_type: 'audio/wav' },
    generation_config: { speech_config: [{ voice: figur.stemme }] },
  };
  for (let forsoeg = 1; forsoeg <= 4; forsoeg++) {
    const svar = await fetch(`${BASE}/v1beta/interactions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': NOEGLE },
      body: JSON.stringify(krop),
    });
    const tekstSvar = await svar.text();
    if (svar.ok) {
      const lyd = findLyd(JSON.parse(tekstSvar));
      if (!lyd) throw new Error('Svaret fra Gemini indeholdt ingen lyd.');
      return { data: Buffer.from(lyd.data, 'base64'), mime: lyd.mime_type || lyd.mimeType || '' };
    }
    if (svar.status === 429) {
      if (/per ?day|perday|daily/i.test(tekstSvar)) throw new KvoteBrugt(tekstSvar.slice(0, 300));
      const sek = ventetid(tekstSvar) ?? 20 * forsoeg;
      if (sek > 120) throw new KvoteBrugt(tekstSvar.slice(0, 300));
      await vent(sek * 1000);
      continue;
    }
    if (svar.status >= 500) {
      await vent(5000 * forsoeg);
      continue;
    }
    // 400, 401, 403, 404: forkert nøgle, model eller forespørgsel. Ingen grund til at prøve resten.
    throw new StopFejl(`Gemini svarede ${svar.status}: ${tekstSvar.slice(0, 500)}`);
  }
  throw new Error('Gav op efter 4 forsøg.');
}

function tilOgg(lyd, udfil) {
  const erWav = lyd.data.subarray(0, 4).toString('latin1') === 'RIFF';
  const ind = erWav ? [] : ['-f', 's16le', '-ar', String(/rate=(\d+)/.exec(lyd.mime)?.[1] ?? 24000), '-ac', '1'];
  const args = ['-hide_banner', '-loglevel', 'error', '-y', ...ind, '-i', 'pipe:0', '-af', FILTER, '-ac', '1', '-c:a', 'libopus', '-b:a', '24k', '-f', 'ogg', udfil];
  return new Promise((ok, fejl) => {
    const p = spawn('ffmpeg', args);
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', fejl);
    p.on('close', (kode) => (kode === 0 ? ok() : fejl(new Error(`ffmpeg fejlede: ${err.trim()}`))));
    p.stdin.on('error', () => {});
    p.stdin.end(lyd.data);
  });
}

function skrivStatus(linjer) {
  const tekst = linjer.join('\n') + '\n';
  writeFileSync(STATUS_FIL, tekst);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, tekst);
  console.log(tekst);
}

async function main() {
  mkdirSync(MAPPE, { recursive: true });
  const stemmer = hentStemmer();
  const poster = alleLydtekster(stemmer);
  const gyldige = new Map(poster.map((p) => [p.noegle, p]));
  const m = laesManifest();
  m.version = 1;
  m.model = stemmer.model;

  // Ryd op: klip til tekster, der er ændret eller slettet, og klip, Henrik vil have lavet om.
  let fjernet = 0;
  for (const [k, f] of Object.entries(m.filer)) {
    if (!gyldige.has(k) || OMGOER.includes(k)) {
      rmSync(join(MAPPE, f.fil), { force: true });
      delete m.filer[k];
      fjernet++;
    }
  }
  const kendte = new Set(Object.values(m.filer).map((f) => f.fil));
  for (const fil of readdirSync(MAPPE)) {
    if (fil.endsWith('.ogg') && !kendte.has(fil)) {
      rmSync(join(MAPPE, fil), { force: true });
      fjernet++;
    }
  }

  const mangler = poster.filter((p) => !m.filer[p.noegle]);
  const lavet = [];
  const fejl = [];
  let stop = '';
  let fatal = false;

  if (!kunStatus && mangler.length > 0) {
    if (!NOEGLE) {
      const besked = 'GEMINI_API_KEY mangler. Læg nøglen ind under Settings > Secrets and variables > Actions på GitHub.';
      if (process.env.GITHUB_EVENT_NAME === 'schedule') stop = besked;
      else {
        console.error(besked);
        process.exitCode = 1;
        stop = besked;
        fatal = true;
      }
    } else {
      for (const p of mangler.slice(0, MAKS)) {
        try {
          const lyd = await hentLyd(p.tekst, stemmer.figurer[p.figur], stemmer.model, stemmer.udtale);
          const fil = `${p.noegle}.ogg`;
          await tilOgg(lyd, join(MAPPE, fil));
          m.filer[p.noegle] = { figur: p.figur, tekst: p.tekst, fil, kilde: p.kilde, lavet: new Date().toISOString().slice(0, 10) };
          lavet.push(p);
          skrivManifest(m);
          console.log(`Lavet: ${p.kilde} (${p.figur})`);
        } catch (e) {
          if (e instanceof KvoteBrugt) {
            stop = 'Dagens kvote hos Google er brugt. Resten bliver lavet ved næste kørsel.';
            break;
          }
          if (e instanceof StopFejl) {
            stop = e.message;
            fatal = true;
            process.exitCode = 1;
            break;
          }
          fejl.push(`${p.kilde}: ${e.message}`);
          console.error(`Fejl ved ${p.kilde}: ${e.message}`);
        }
        if (PAUSE) await vent(PAUSE);
      }
    }
  }

  m.i_alt = poster.length;
  m.mangler = poster.filter((p) => !m.filer[p.noegle]).length;
  skrivManifest(m);

  const linjer = [
    '## Lydklip',
    '',
    `- Lavet i denne kørsel: ${lavet.length}`,
    `- Fjernet (tekst ændret, slettet eller lavet om): ${fjernet}`,
    `- Findes nu: ${poster.length - m.mangler} af ${poster.length}`,
    `- Mangler: ${m.mangler}`,
  ];
  if (stop) linjer.push('', `**Stoppet:** ${stop}`);
  if (fejl.length) linjer.push('', '**Fejl:**', ...fejl.map((f) => `- ${f}`));
  if (lavet.length) {
    linjer.push('', 'Lyt dem igennem på siden med `?lyd=1` efter adressen, før du godkender.', '', '| Figur | Tekst | Nøgle |', '| --- | --- | --- |');
    for (const p of lavet) linjer.push(`| ${p.figur} | ${p.tekst.replace(/\|/g, '/')} | \`${p.noegle}\` |`);
  }
  skrivStatus(linjer);
  if (!fatal && fejl.length > 0 && lavet.length === 0) process.exitCode = 1;
}

if (!existsSync(join(ROD, 'src/content/stemmer.json'))) {
  console.error('Kør scriptet fra Pennedal-repoet.');
  process.exit(1);
}
await main();
