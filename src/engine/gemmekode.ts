import { FAERDIGHEDER, OPLAASNINGER } from './faerdigheder';
import { AVATAR_DELE, AVATAR_GRAENSER, nytSpil, type Avatar, type GemtSpil } from './gem';
import type { Niveau } from './tilpasning';

/**
 * Gemmekoden pakker det vigtigste fra et gemt spil ind i en kort kode.
 * Alfabetet er Crockford base32. Det har ikke bogstaverne I, L, O og U,
 * og hvis eleven taster O, I eller L, læses de som 0 og 1.
 * De sidste to tegn er et kontroltal, der fanger tastefejl.
 */
const ALFABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const VERSION = 1;
const KONTROL_TEGN = 2;

function bitsTil(antal: number): number {
  return Math.max(1, Math.ceil(Math.log2(antal)));
}

const FELTER: { navn: string; bits: number }[] = [
  { navn: 'version', bits: 3 },
  { navn: 'kapitel', bits: 4 },
  { navn: 'trin', bits: 6 },
  { navn: 'adjektiv', bits: 5 },
  { navn: 'dyr', bits: 5 },
  ...AVATAR_DELE.map((d) => ({ navn: `avatar.${d}`, bits: bitsTil(AVATAR_GRAENSER[d]) })),
  ...FAERDIGHEDER.map((f) => ({ navn: `f.${f}`, bits: 3 })),
  { navn: 'oplaasninger', bits: 16 },
  { navn: 'historier', bits: 6 },
];

const DATA_BITS = FELTER.reduce((s, f) => s + f.bits, 0);
const DATA_TEGN = Math.ceil(DATA_BITS / 5);
export const KODE_LAENGDE = DATA_TEGN + KONTROL_TEGN;

function kontrol(tegn: string): string {
  // FNV-1a, 32 bit. Vi bruger 10 bit = 2 tegn.
  let h = 0x811c9dc5;
  for (let i = 0; i < tegn.length; i++) {
    h ^= tegn.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const v = h & 0x3ff;
  return ALFABET[v >> 5] + ALFABET[v & 31];
}

export function lavGemmekode(spil: GemtSpil): string {
  const vaerdier: Record<string, number> = {
    version: VERSION,
    kapitel: spil.kapitel,
    trin: spil.trin,
    adjektiv: spil.avatarnavn.adjektiv,
    dyr: spil.avatarnavn.dyr,
    oplaasninger: OPLAASNINGER.reduce((m, id, i) => (spil.laasteOp.includes(id) ? m | (1 << i) : m), 0),
    historier: Math.min(63, spil.faerdigeHistorier),
  };
  for (const d of AVATAR_DELE) vaerdier[`avatar.${d}`] = spil.avatar[d];
  for (const f of FAERDIGHEDER) vaerdier[`f.${f}`] = spil.faerdigheder[f].niveau - 1;

  let bits = '';
  for (const felt of FELTER) {
    const v = vaerdier[felt.navn];
    if (v < 0 || v >= 2 ** felt.bits) throw new Error(`Værdien for ${felt.navn} er uden for området`);
    bits += v.toString(2).padStart(felt.bits, '0');
  }
  bits = bits.padEnd(DATA_TEGN * 5, '0');
  let data = '';
  for (let i = 0; i < bits.length; i += 5) data += ALFABET[parseInt(bits.slice(i, i + 5), 2)];
  const kode = data + kontrol(data);
  return kode.match(/.{1,4}/g)!.join('-');
}

export type LaesResultat =
  | { ok: true; spil: GemtSpil }
  | { ok: false; fejl: 'laengde'; antal: number }
  | { ok: false; fejl: 'tegn'; tegn: string }
  | { ok: false; fejl: 'kontrol' }
  | { ok: false; fejl: 'indhold' };

export function normaliserKode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s\-_.]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
}

export function laesGemmekode(input: string, maksTrin: (kapitel: number) => number): LaesResultat {
  const kode = normaliserKode(input);
  for (const t of kode) {
    if (!ALFABET.includes(t)) return { ok: false, fejl: 'tegn', tegn: t };
  }
  if (kode.length !== KODE_LAENGDE) return { ok: false, fejl: 'laengde', antal: kode.length };
  const data = kode.slice(0, DATA_TEGN);
  if (kontrol(data) !== kode.slice(DATA_TEGN)) return { ok: false, fejl: 'kontrol' };

  let bits = '';
  for (const t of data) bits += ALFABET.indexOf(t).toString(2).padStart(5, '0');
  const v: Record<string, number> = {};
  let pos = 0;
  for (const felt of FELTER) {
    v[felt.navn] = parseInt(bits.slice(pos, pos + felt.bits), 2);
    pos += felt.bits;
  }
  if (v.version !== VERSION) return { ok: false, fejl: 'indhold' };
  if (v.kapitel < 1) return { ok: false, fejl: 'indhold' };
  const maks = maksTrin(v.kapitel);
  if (maks < 0 || v.trin > maks) return { ok: false, fejl: 'indhold' };

  const avatar = {} as Avatar;
  for (const d of AVATAR_DELE) {
    const x = v[`avatar.${d}`];
    if (x >= AVATAR_GRAENSER[d]) return { ok: false, fejl: 'indhold' };
    avatar[d] = x;
  }
  const spil = nytSpil(avatar, { adjektiv: v.adjektiv, dyr: v.dyr });
  spil.kapitel = v.kapitel;
  spil.trin = v.trin;
  spil.faerdigeHistorier = v.historier;
  spil.laasteOp = OPLAASNINGER.filter((_, i) => (v.oplaasninger & (1 << i)) !== 0);
  for (const f of FAERDIGHEDER) {
    const n = v[`f.${f}`] + 1;
    if (n > 5) return { ok: false, fejl: 'indhold' };
    spil.faerdigheder[f].niveau = n as Niveau;
  }
  return { ok: true, spil };
}
