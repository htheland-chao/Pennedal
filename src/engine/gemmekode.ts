import { FAERDIGHEDER, OPLAASNINGER } from './faerdigheder';
import { AVATAR_DELE, AVATAR_GRAENSER, nytSpil, type Avatar, type GemtSpil } from './gem';
import { MAKS_VENLIGHED, SKAAR, VIGTIGE_VALG } from './taske';
import type { Niveau } from './tilpasning';

/**
 * Gemmekoden pakker det vigtigste fra et gemt spil ind i en kort kode.
 * Alfabetet er Crockford base32. Det har ikke bogstaverne I, L, O og U,
 * og hvis eleven taster O, I eller L, læses de som 0 og 1.
 * De sidste to tegn er et kontroltal, der fanger tastefejl.
 *
 * Version 2 (31. oktober 2026) har også hukommelsesskår, Klattens venlighed og vigtige valg.
 * Tasken står ikke i koden, den regnes ud fra kapitel og trin (se taske.ts).
 * Koder fra version 1 kan stadig læses. De er kortere, så længden afslører versionen.
 */
const ALFABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const VERSION = 2;
const KONTROL_TEGN = 2;

function bitsTil(antal: number): number {
  return Math.max(1, Math.ceil(Math.log2(antal)));
}

type Felt = { navn: string; bits: number };

const FELTER_V1: Felt[] = [
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

/** Version 2: alt fra version 1 og derefter de nye felter. Nye felter kommer kun til sidst. */
const FELTER_V2: Felt[] = [
  ...FELTER_V1,
  { navn: 'skaar', bits: SKAAR.length },
  { navn: 'venlighed', bits: 3 },
  { navn: 'valg', bits: 8 },
];

const tegnFor = (felter: Felt[]) => Math.ceil(felter.reduce((s, f) => s + f.bits, 0) / 5);
const DATA_TEGN = tegnFor(FELTER_V2);
const DATA_TEGN_V1 = tegnFor(FELTER_V1);
export const KODE_LAENGDE = DATA_TEGN + KONTROL_TEGN;
/** Længden på en gammel kode (version 1). Den kan stadig læses. */
export const KODE_LAENGDE_V1 = DATA_TEGN_V1 + KONTROL_TEGN;

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
    skaar: SKAAR.reduce((m, id, i) => (spil.skaar.includes(id) ? m | (1 << i) : m), 0),
    venlighed: Math.max(0, Math.min(MAKS_VENLIGHED, spil.venlighed)),
    valg: VIGTIGE_VALG.reduce((m, id, i) => (spil.valg[id] ? m | (1 << i) : m), 0),
  };
  for (const d of AVATAR_DELE) vaerdier[`avatar.${d}`] = spil.avatar[d];
  for (const f of FAERDIGHEDER) vaerdier[`f.${f}`] = spil.faerdigheder[f].niveau - 1;

  let bits = '';
  for (const felt of FELTER_V2) {
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
  if (kode.length !== KODE_LAENGDE && kode.length !== KODE_LAENGDE_V1)
    return { ok: false, fejl: 'laengde', antal: kode.length };
  const gammel = kode.length === KODE_LAENGDE_V1;
  const FELTER = gammel ? FELTER_V1 : FELTER_V2;
  const dataTegn = gammel ? DATA_TEGN_V1 : DATA_TEGN;
  const data = kode.slice(0, dataTegn);
  if (kontrol(data) !== kode.slice(dataTegn)) return { ok: false, fejl: 'kontrol' };

  let bits = '';
  for (const t of data) bits += ALFABET.indexOf(t).toString(2).padStart(5, '0');
  const v: Record<string, number> = {};
  let pos = 0;
  for (const felt of FELTER) {
    v[felt.navn] = parseInt(bits.slice(pos, pos + felt.bits), 2);
    pos += felt.bits;
  }
  if (v.version !== (gammel ? 1 : VERSION)) return { ok: false, fejl: 'indhold' };
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
  if (!gammel) {
    spil.skaar = SKAAR.filter((_, i) => (v.skaar & (1 << i)) !== 0);
    spil.venlighed = v.venlighed;
    for (const [i, id] of VIGTIGE_VALG.entries()) if (v.valg & (1 << i)) spil.valg[id] = 'ja';
    // Ubrugte bit skal være 0, ellers er koden ikke lavet af spillet.
    if (v.valg >> VIGTIGE_VALG.length) return { ok: false, fejl: 'indhold' };
  }
  for (const f of FAERDIGHEDER) {
    const n = v[`f.${f}`] + 1;
    if (n > 5) return { ok: false, fejl: 'indhold' };
    spil.faerdigheder[f].niveau = n as Niveau;
  }
  return { ok: true, spil };
}
