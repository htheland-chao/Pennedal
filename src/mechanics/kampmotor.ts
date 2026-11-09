/**
 * Kampmotoren (3. november 2026, Henrik): turbaserede kampe i stil med gamle rollespil.
 * Holdet (avataren og hjælperne) mod et eller flere væsner. Ren logik uden React, Phaser og tekster.
 *
 * - Ingen tid og ingen fart (krav 5). En runde er: hjælperne må hver bruge en evne, så handler avataren,
 *   og så handler væsnerne. Væsnerne varsler altid, hvad de gør i næste runde.
 * - Skaden kommer fra væsnernes tur, ikke fra et forkert svar. Et forkert svar rammer bare ved siden af
 *   og giver regel og eksempel (krav 6). Så bliver elever, der har det svært, ikke straffet for fejlen.
 * - Hvert væsen er svagt over for én slags slag (svaret på en bestemt slags opgave).
 * - Blødt nederlag: falder avataren, er holdet slået tilbage. Skaden på væsnerne huskes, og holdet har fuldt liv igen.
 * - "Mindre uhygge" halverer væsnernes skade. Elever på lavt niveau får mildere angreb.
 */
import type { VaesenId } from './kamp';

/** Slags slag. Hvert slag er en lille danskfaglig opgave. */
export type Slag = 'synonym' | 'stumt' | 'rim' | 'fortaeller';
/** Slagene, en kamp har, hvis trinnet ikke selv siger det (kapitel 3). Rim kommer i kapitel 4. */
export const SLAG: Slag[] = ['synonym', 'stumt'];
export const SLAG_FAERDIGHED: Record<Slag, string> = { synonym: 'laes.ordforraad', stumt: 'stav.stumme', rim: 'laes.rim', fortaeller: 'fort.fortaeller_tid' };
/** Hvilket væsen hvert slag svarer til i opgavemotoren (src/mechanics/kamp.ts). */
export const SLAG_OPGAVE: Record<Slag, VaesenId> = { synonym: 'tomordet', stumt: 'stumming', rim: 'ekko', fortaeller: 'tvivl' };
/** Hvert væsen er svagt over for ét slag. */
export const SVAGHED: Record<VaesenId, Slag> = { tomordet: 'synonym', stumming: 'stumt', ekko: 'rim', tvivl: 'fortaeller' };

export type MedlemId = 'avatar' | 'aeseloere' | 'vims';
export type HjaelperId = Exclude<MedlemId, 'avatar'>;
export const MAKS_LIV: Record<MedlemId, number> = { avatar: 12, aeseloere: 8, vims: 8 };

/** Hjælpernes evner. forklar og visk hjælper med næste slag, lap helbreder, slet fjerner et varslet angreb. */
export type EvneId = 'forklar' | 'lap' | 'visk' | 'slet';
export const EVNER: Record<HjaelperId, EvneId[]> = { aeseloere: ['forklar', 'lap'], vims: ['visk', 'slet'] };
export const LADNINGER: Record<EvneId, number> = { forklar: 2, lap: 2, visk: 2, slet: 1 };
export const LAP_LIV = 4;

/** Ting fra tasken, der kan bruges én gang pr. kamp. */
export type KampTingId = 'lanterne' | 'krummer' | 'punktum';
export const KAMP_TING: KampTingId[] = ['lanterne', 'krummer', 'punktum'];
export const KRUMMER_LIV = 3;

/** Så mange rigtige slag i træk giver et stort slag, der rammer alle væsner. */
export const KOMBI = 3;
export const SKADE = { slag: 2, svag: 4, stort: 3, stortSvag: 5 };

export type AngrebId = 'aed' | 'gab' | 'stjael' | 'hvisk' | 'gentag' | 'raab' | 'skift' | 'bland';
type AngrebInfo = { id: AngrebId; skade: number; alle: boolean };
export const ANGREB: Record<VaesenId, AngrebInfo[]> = {
  tomordet: [
    { id: 'aed', skade: 3, alle: false },
    { id: 'gab', skade: 1, alle: true },
  ],
  stumming: [
    { id: 'stjael', skade: 3, alle: false },
    { id: 'hvisk', skade: 1, alle: true },
  ],
  // Ekkoet kan kun gentage: det slår tilbage med et ekko af et slag, og det råber, så bjerget ryster.
  ekko: [
    { id: 'gentag', skade: 3, alle: false },
    { id: 'raab', skade: 1, alle: true },
  ],
  // Den Tvivlende Sætning skifter fortæller midt i det hele og blander holdet sammen.
  tvivl: [
    { id: 'bland', skade: 3, alle: false },
    { id: 'skift', skade: 1, alle: true },
  ],
};

export type Varsel = { angreb: AngrebId; skade: number; alle: boolean; maal: MedlemId | null };
export type Fjende = { nr: number; vaesen: VaesenId; maks: number; liv: number; varsel: Varsel | null; lammet: boolean };
export type Medlem = { id: MedlemId; maks: number; liv: number };

export type Kamp = {
  fjender: Fjende[];
  hold: Medlem[];
  evner: Partial<Record<EvneId, number>>;
  /** Ting, der kan bruges i denne kamp. Sand, indtil tingen er brugt. */
  ting: Partial<Record<KampTingId, boolean>>;
  /** Hjælpere, der har brugt deres evne i denne runde. */
  brugt: HjaelperId[];
  forsvar: boolean;
  lys: boolean;
  kombi: number;
  runde: number;
  /** Al skade, holdet har givet væsnerne. Gemmes, så kampen kan fortsætte senere. */
  givet: number;
  udfald: null | 'vundet' | 'slaaet';
  daempet: boolean;
  /** Ændring af væsnernes skade efter elevens niveau (0 eller -1). */
  styrke: number;
};

export type Haendelse =
  | { type: 'ramt'; fjende: number; skade: number; svag: boolean; stort: boolean }
  | { type: 'forbi'; fjende: number }
  | { type: 'rolig'; fjende: number }
  | { type: 'kombi' }
  | { type: 'forsvar' }
  | { type: 'evne'; evne: EvneId; hvem?: MedlemId; liv?: number; fjende?: number }
  | { type: 'ting'; ting: KampTingId; fjende?: number }
  | { type: 'angreb'; fjende: number; angreb: AngrebId; hvem: MedlemId; skade: number }
  | { type: 'misser'; fjende: number; angreb: AngrebId }
  | { type: 'lammet'; fjende: number }
  | { type: 'faldet'; hvem: MedlemId }
  | { type: 'vundet' }
  | { type: 'slaaet' };

export type StartValg = {
  vaesner: VaesenId[];
  /** Antal rigtige slag, kampen er bygget til (fra antalTure). Fordeles på væsnerne. */
  ture: number;
  hjaelpere: HjaelperId[];
  /** Det, der ligger i elevens taske. Kun kampting bruges. */
  taske: readonly string[];
  /** Skade givet i en tidligere, afbrudt kamp. */
  givet: number;
  daempet: boolean;
  niveau: number;
  rnd: () => number;
};

const kopi = (k: Kamp): Kamp => ({
  ...k,
  fjender: k.fjender.map((f) => ({ ...f, varsel: f.varsel && { ...f.varsel } })),
  hold: k.hold.map((m) => ({ ...m })),
  evner: { ...k.evner },
  ting: { ...k.ting },
  brugt: [...k.brugt],
});

export const levende = <T extends { liv: number }>(x: T[]) => x.filter((y) => y.liv > 0);
export const medlem = (k: Kamp, id: MedlemId) => k.hold.find((m) => m.id === id);
/** Avataren kan bruge det store slag, når kombi er fyldt. */
export const stortSlagKlar = (k: Kamp) => k.kombi >= KOMBI;

export function startKamp(v: StartValg): Kamp {
  const n = Math.max(1, v.vaesner.length);
  const ture = Math.max(n, v.ture);
  let rest = Math.max(0, v.givet);
  const fjender: Fjende[] = v.vaesner.map((vaesen, nr) => {
    const mine = Math.floor(ture / n) + (nr < ture % n ? 1 : 0);
    const maks = Math.max(2, mine * SKADE.slag);
    const fra = Math.min(maks - 1, rest);
    rest -= fra;
    return { nr, vaesen, maks, liv: maks - fra, varsel: null, lammet: false };
  });
  const hold: Medlem[] = (['avatar', ...v.hjaelpere] as MedlemId[]).map((id) => ({ id, maks: MAKS_LIV[id], liv: MAKS_LIV[id] }));
  const evner: Kamp['evner'] = {};
  for (const h of v.hjaelpere) for (const e of EVNER[h]) evner[e] = LADNINGER[e];
  const ting: Kamp['ting'] = {};
  for (const t of KAMP_TING) if (v.taske.includes(t)) ting[t] = true;
  const k: Kamp = {
    fjender,
    hold,
    evner,
    ting,
    brugt: [],
    forsvar: false,
    lys: false,
    kombi: 0,
    runde: 1,
    givet: Math.max(0, v.givet) - rest,
    udfald: null,
    daempet: v.daempet,
    styrke: v.niveau <= 2 ? -1 : 0,
  };
  varsle(k, v.rnd);
  return k;
}

/** Hvert væsen vælger, hvad det gør i næste runde. Holdet kan se det. */
function varsle(k: Kamp, rnd: () => number) {
  const maal = levende(k.hold);
  for (const f of k.fjender) {
    if (f.liv <= 0) {
      f.varsel = null;
      continue;
    }
    const valg = ANGREB[f.vaesen][rnd() < 0.65 ? 0 : 1];
    // Avataren bliver oftest valgt, så hjælperne sjældent falder først.
    const hvem = valg.alle ? null : rnd() < 0.5 || maal.length === 1 ? 'avatar' : maal[1 + Math.floor(rnd() * (maal.length - 1))].id;
    f.varsel = { angreb: valg.id, skade: Math.max(1, valg.skade + k.styrke), alle: valg.alle, maal: hvem };
  }
}

function tjekVundet(k: Kamp, ud: Haendelse[]) {
  if (k.fjender.every((f) => f.liv <= 0)) {
    k.udfald = 'vundet';
    ud.push({ type: 'vundet' });
  }
}

function giv(k: Kamp, f: Fjende, skade: number, svag: boolean, stort: boolean, ud: Haendelse[]) {
  const s = Math.min(f.liv, skade);
  f.liv -= s;
  k.givet += s;
  ud.push({ type: 'ramt', fjende: f.nr, skade: s, svag, stort });
  if (f.liv <= 0) {
    f.varsel = null;
    ud.push({ type: 'rolig', fjende: f.nr });
  }
}

/**
 * Avataren slår med et svar. rigtigt kommer fra opgaven. Et stort slag rammer alle væsner.
 * Afslutter ikke runden: kald fjendensTur bagefter, medmindre kampen er vundet.
 */
export function slaa(k0: Kamp, v: { slag: Slag; fjende: number; rigtigt: boolean; stort?: boolean }): { kamp: Kamp; haendelser: Haendelse[] } {
  const k = kopi(k0);
  const ud: Haendelse[] = [];
  if (k.udfald) return { kamp: k, haendelser: ud };
  const stort = !!v.stort && stortSlagKlar(k);
  if (!v.rigtigt) {
    k.kombi = 0;
    ud.push({ type: 'forbi', fjende: v.fjende });
    return { kamp: k, haendelser: ud };
  }
  if (stort) {
    k.kombi = 0;
    for (const f of levende(k.fjender)) {
      const svag = SVAGHED[f.vaesen] === v.slag;
      giv(k, f, svag ? SKADE.stortSvag : SKADE.stort, svag, true, ud);
    }
  } else {
    const f = k.fjender.find((x) => x.nr === v.fjende && x.liv > 0) ?? levende(k.fjender)[0];
    if (f) {
      const svag = SVAGHED[f.vaesen] === v.slag;
      giv(k, f, svag ? SKADE.svag : SKADE.slag, svag, false, ud);
    }
    k.kombi = Math.min(KOMBI, k.kombi + 1);
    if (k.kombi === KOMBI) ud.push({ type: 'kombi' });
  }
  tjekVundet(k, ud);
  return { kamp: k, haendelser: ud };
}

/** Avataren dækker holdet: al skade i denne runde halveres, og avataren får 1 liv igen. */
export function forsvar(k0: Kamp): { kamp: Kamp; haendelser: Haendelse[] } {
  const k = kopi(k0);
  k.forsvar = true;
  const a = medlem(k, 'avatar');
  if (a) a.liv = Math.min(a.maks, a.liv + 1);
  return { kamp: k, haendelser: [{ type: 'forsvar' }] };
}

export function kanBrugeEvne(k: Kamp, evne: EvneId): boolean {
  const hvem = (Object.keys(EVNER) as HjaelperId[]).find((h) => EVNER[h].includes(evne));
  if (!hvem || k.udfald) return false;
  const m = medlem(k, hvem);
  return !!m && m.liv > 0 && (k.evner[evne] ?? 0) > 0 && !k.brugt.includes(hvem);
}

/**
 * En hjælper bruger en evne. Det koster ikke avatarens tur, men hver hjælper kan kun handle én gang pr. runde.
 * lap: helbred hvem (også en, der er faldet). slet: fjern væsnet fjendes varslede angreb.
 */
export function brugEvne(k0: Kamp, evne: EvneId, v: { hvem?: MedlemId; fjende?: number } = {}): { kamp: Kamp; haendelser: Haendelse[] } {
  if (!kanBrugeEvne(k0, evne)) return { kamp: k0, haendelser: [] };
  const k = kopi(k0);
  const hjaelper = (Object.keys(EVNER) as HjaelperId[]).find((h) => EVNER[h].includes(evne))!;
  k.evner[evne] = (k.evner[evne] ?? 0) - 1;
  k.brugt.push(hjaelper);
  if (evne === 'lap') {
    const m = medlem(k, v.hvem ?? 'avatar') ?? medlem(k, 'avatar')!;
    const foer = m.liv;
    m.liv = Math.min(m.maks, m.liv + LAP_LIV);
    return { kamp: k, haendelser: [{ type: 'evne', evne, hvem: m.id, liv: m.liv - foer }] };
  }
  if (evne === 'slet') {
    const f = k.fjender.find((x) => x.nr === v.fjende && x.varsel) ?? k.fjender.find((x) => x.varsel);
    if (f) f.varsel = null;
    return { kamp: k, haendelser: [{ type: 'evne', evne, fjende: f?.nr }] };
  }
  return { kamp: k, haendelser: [{ type: 'evne', evne }] };
}

/** Avataren bruger en ting fra tasken. Det koster avatarens tur. Hver ting kan bruges én gang pr. kamp. */
export function brugTing(k0: Kamp, ting: KampTingId, v: { fjende?: number } = {}): { kamp: Kamp; haendelser: Haendelse[] } {
  if (!k0.ting[ting] || k0.udfald) return { kamp: k0, haendelser: [] };
  const k = kopi(k0);
  k.ting[ting] = false;
  if (ting === 'lanterne') k.lys = true;
  if (ting === 'krummer') for (const m of k.hold) m.liv = Math.min(m.maks, m.liv + KRUMMER_LIV);
  let fjende: number | undefined;
  if (ting === 'punktum') {
    const f = k.fjender.find((x) => x.nr === v.fjende && x.liv > 0) ?? levende(k.fjender)[0];
    if (f) {
      f.lammet = true;
      fjende = f.nr;
    }
  }
  return { kamp: k, haendelser: [{ type: 'ting', ting, fjende }] };
}

/** Væsnerne handler efter avataren. Derefter varsler de næste runde. */
export function fjendensTur(k0: Kamp, rnd: () => number): { kamp: Kamp; haendelser: Haendelse[] } {
  const k = kopi(k0);
  const ud: Haendelse[] = [];
  if (k.udfald) return { kamp: k, haendelser: ud };
  for (const f of k.fjender) {
    if (f.liv <= 0 || !f.varsel) continue;
    if (f.lammet) {
      f.lammet = false;
      ud.push({ type: 'lammet', fjende: f.nr });
      continue;
    }
    if (k.lys) {
      ud.push({ type: 'misser', fjende: f.nr, angreb: f.varsel.angreb });
      continue;
    }
    const maal = f.varsel.alle
      ? levende(k.hold)
      : [medlem(k, f.varsel.maal ?? 'avatar')].filter((m): m is Medlem => !!m && m.liv > 0);
    if (maal.length === 0) maal.push(medlem(k, 'avatar')!);
    for (const m of maal) {
      let s = f.varsel.skade;
      if (k.daempet) s = Math.ceil(s / 2);
      if (k.forsvar) s = Math.floor(s / 2);
      s = Math.min(m.liv, s);
      m.liv -= s;
      ud.push({ type: 'angreb', fjende: f.nr, angreb: f.varsel.angreb, hvem: m.id, skade: s });
      if (m.liv <= 0 && s > 0) ud.push({ type: 'faldet', hvem: m.id });
    }
    if ((medlem(k, 'avatar')?.liv ?? 0) <= 0) break;
  }
  k.forsvar = false;
  k.lys = false;
  k.brugt = [];
  if ((medlem(k, 'avatar')?.liv ?? 0) <= 0) {
    k.udfald = 'slaaet';
    ud.push({ type: 'slaaet' });
    return { kamp: k, haendelser: ud };
  }
  k.runde++;
  varsle(k, rnd);
  return { kamp: k, haendelser: ud };
}
