/**
 * Blækdybet (Henrik, 13. november 2026): en uendelig nedstigning, der låses op, når spillet er gennemført.
 * Ren logik, ingen React eller Phaser.
 *
 * - En tur er en række rum (kamp, ordsten, platformbane, hvile). Rummene, væsnerne og gaverne bestemmes af et frø, så alle, der
 *   spiller samme udfordringskode (fx DYB-4821), får præcis den samme tur. Opgaverne følger elevens eget niveau.
 * - Blæk er liv: et forkert svar koster en dråbe. Når blækket er brugt, slutter turen.
 * - Rekorden er dybden (antal klarede rum) og derefter antal rigtige svar. Aldrig tid (krav 5: belønn aldrig fart).
 * - Efter hvert klaret rum vælger eleven 1 af 3 gaver.
 * - Intet sendes til en server (krav 4). Rekorden gemmes kun i browseren, og rekordkoden kan vises frem i klassen.
 */
import type { FaerdighedId } from './faerdigheder';
import { lavTilfaeldig, vaelg } from './tilfaeldig';

export type VaesenId = 'tomordet' | 'stumming' | 'ekko' | 'tvivl' | 'krusedulle' | 'halvsaetning';
export type OrdstenArt = 'synonym' | 'rim' | 'ikkerim' | 'fortaeller' | 'stavning' | 'genre';
export type SlagId = 'synonym' | 'stumt' | 'rim' | 'fortaeller' | 'ret' | 'slut';

export type Rum =
  | { type: 'kamp'; vaesner: VaesenId[]; faerdighed: FaerdighedId; slag: SlagId[]; antal: number; minNiveau: number }
  | { type: 'ordsten'; art: OrdstenArt; antal: number; minNiveau: number }
  /** En platformbane fra spillet (stedets id). Ordstenene på banen giver opgaver i dybets sværhed. */
  | { type: 'bane'; sted: BaneSted; minNiveau: number }
  | { type: 'hvile' };

/** Platformbanerne fra kapitlerne, som dybet kan låne. Rækkefølgen bruges af frøet: tilføj kun til sidst. */
export const BANER = ['tagene', 'viskestien', 'hvidesti', 'bjergstien', 'kammen', 'reolerne', 'soestenene', 'halvebroen'] as const;
export type BaneSted = (typeof BANER)[number];

/**
 * Henrik, 13. november 2026: dybet er til de fagligt stærke elever og må bryde grundreglen om, at opgaverne følger
 * elevens eget niveau. Fra dybde 3 hæves sværheden trin for trin, til alle møder det sværeste niveau fra dybde 12.
 * Det er stadig muligt (samme opgaver som i spillet), men hårdt. Ingen tidsgrænser (krav 5 holdes).
 */
export function minNiveau(dybde: number): number {
  if (dybde < 3) return 1;
  return Math.min(5, 2 + Math.floor((dybde - 3) / 3));
}

/** Hvilesteder: hvert femte rum til og med dybde 14, derefter kun hvert ottende. */
export function erHvile(dybde: number): boolean {
  return dybde < 15 ? dybde % 5 === 4 : dybde % 8 === 7;
}

export type GaveId = 'blaek' | 'beholder' | 'vims' | 'klatten' | 'skjold' | 'stribe';
export const GAVER: readonly GaveId[] = ['blaek', 'beholder', 'vims', 'klatten', 'skjold', 'stribe'];

export const START_BLAEK = 3;
export const MAKS_BLAEK = 5;

/** Væsnet, den færdighed det træner, og de slag, der virker på det (som i kapitlerne). */
export const VAESEN_INFO: Record<VaesenId, { faerdighed: FaerdighedId; slag: SlagId[] }> = {
  tomordet: { faerdighed: 'laes.ordforraad', slag: ['synonym'] },
  stumming: { faerdighed: 'stav.stumme', slag: ['stumt'] },
  ekko: { faerdighed: 'laes.rim', slag: ['rim'] },
  tvivl: { faerdighed: 'fort.fortaeller_tid', slag: ['fortaeller'] },
  krusedulle: { faerdighed: 'stav.vokal_dobbeltkonsonant', slag: ['ret'] },
  halvsaetning: { faerdighed: 'fort.struktur', slag: ['slut'] },
};
const VAESNER = Object.keys(VAESEN_INFO) as VaesenId[];
const ORDSTEN: OrdstenArt[] = ['synonym', 'rim', 'ikkerim', 'fortaeller', 'stavning', 'genre'];

/** Færdigheden, en ordsten træner (samme som i spillet). */
export function ordstenFaerdighed(art: OrdstenArt): FaerdighedId {
  if (art === 'rim' || art === 'ikkerim') return 'laes.rim';
  if (art === 'fortaeller') return 'fort.fortaeller_tid';
  if (art === 'stavning') return 'stav.vokal_dobbeltkonsonant';
  if (art === 'genre') return 'laes.forstaaelse';
  return 'laes.ordforraad';
}

// ---------- Udfordringskoder ----------

/** En udfordringskode er DYB- og fire cifre. Let at skrive på tavlen og at taste. */
export function lavKode(froe: number): string {
  return `DYB-${String(froe).padStart(4, '0')}`;
}

/** Læser en kode. Tåler små bogstaver, mellemrum og at DYB mangler. Giver null, hvis det ikke er en kode. */
export function laesKode(tekst: string): number | null {
  const m = tekst.trim().toUpperCase().replace(/\s+/g, '').match(/^(?:DYB-?)?(\d{4})$/);
  return m ? Number(m[1]) : null;
}

export function tilfaeldigtFroe(rnd: () => number = Math.random): number {
  return 1000 + Math.floor(rnd() * 9000);
}

// ---------- Rummene ----------

/** Rummet på en given dybde (0 er det første). Det samme frø og den samme dybde giver altid det samme rum. */
export function rumFor(froe: number, dybde: number): Rum {
  const rnd = lavTilfaeldig(froe * 7919 + dybde * 104729 + 17);
  // Det første rum er en ordsten, så man kommer blidt i gang. Hvilestederne bliver sjældnere i dybet (erHvile).
  if (dybde === 0) return { type: 'ordsten', art: vaelg(['synonym', 'rim'] as const, rnd), antal: 2, minNiveau: 1 };
  if (erHvile(dybde)) return { type: 'hvile' };
  const slag = rnd();
  // Fra rum 2 kan der komme platformbaner (cirka hvert femte rum).
  if (dybde >= 2 && slag >= 0.8) return { type: 'bane', sted: vaelg(BANER, rnd), minNiveau: minNiveau(dybde) };
  if (slag < 0.45) {
    // Flere væsner jo dybere: 1 til at begynde med, 2 fra dybde 3, 3 fra dybde 8.
    const antalVaesner = dybde >= 8 ? 3 : dybde >= 3 ? 2 : 1;
    const hoved = vaelg(VAESNER, rnd);
    const vaesner: VaesenId[] = [hoved];
    while (vaesner.length < antalVaesner) vaesner.push(rnd() < 0.5 ? hoved : vaelg(VAESNER, rnd));
    const slagListe = [...new Set(vaesner.flatMap((v) => VAESEN_INFO[v].slag))];
    return { type: 'kamp', vaesner, faerdighed: VAESEN_INFO[hoved].faerdighed, slag: slagListe, antal: Math.min(5, 3 + Math.floor(dybde / 6)), minNiveau: minNiveau(dybde) };
  }
  return { type: 'ordsten', art: vaelg(ORDSTEN, rnd), antal: Math.min(5, 2 + Math.floor(dybde / 5)), minNiveau: minNiveau(dybde) };
}

/** De tre gaver, man kan vælge mellem efter et rum. Altid tre forskellige. */
export function gaverFor(froe: number, dybde: number): GaveId[] {
  const rnd = lavTilfaeldig(froe * 31337 + dybde * 7 + 3);
  const pulje = [...GAVER];
  const ud: GaveId[] = [];
  while (ud.length < 3) ud.push(pulje.splice(Math.floor(rnd() * pulje.length), 1)[0]);
  return ud;
}

// ---------- En tur ----------

export type Tur = {
  froe: number;
  /** Antal klarede rum. Det er rekorden. */
  dybde: number;
  blaek: number;
  maksBlaek: number;
  rigtige: number;
  /** Rigtige svar i træk. */
  stribe: number;
  bedsteStribe: number;
  gaver: GaveId[];
  /** Antal forkerte svar i det nuværende rum (til gaven skjold). */
  forkerteIRum: number;
  slut: boolean;
};

export function nyTur(froe: number): Tur {
  return { froe, dybde: 0, blaek: START_BLAEK, maksBlaek: MAKS_BLAEK, rigtige: 0, stribe: 0, bedsteStribe: 0, gaver: [], forkerteIRum: 0, slut: false };
}

/** Et svar i et rum. Et forkert svar koster en dråbe blæk, undtagen det første i hvert rum med gaven skjold. */
export function svar(tur: Tur, rigtigt: boolean): Tur {
  if (tur.slut) return tur;
  if (rigtigt) {
    const stribe = tur.stribe + 1;
    return { ...tur, rigtige: tur.rigtige + 1, stribe, bedsteStribe: Math.max(tur.bedsteStribe, stribe) };
  }
  const skjold = tur.gaver.filter((g) => g === 'skjold').length;
  const gratis = tur.forkerteIRum < skjold;
  const blaek = gratis ? tur.blaek : tur.blaek - 1;
  return { ...tur, stribe: 0, blaek, forkerteIRum: tur.forkerteIRum + 1, slut: blaek <= 0 };
}

/**
 * Rummet er klaret. Gaven stribe giver en dråbe blæk tilbage, hvis man fik alt rigtigt i rummet.
 * Et hvilested giver altid en dråbe.
 */
export function rumKlaret(tur: Tur, rum: Rum): Tur {
  if (tur.slut) return tur;
  let blaek = tur.blaek;
  if (rum.type === 'hvile') blaek += 1;
  if (rum.type !== 'hvile' && tur.forkerteIRum === 0 && tur.gaver.includes('stribe')) blaek += 1;
  return { ...tur, dybde: tur.dybde + 1, blaek: Math.min(tur.maksBlaek, blaek), forkerteIRum: 0 };
}

/** Eleven vælger en gave. */
export function vaelgGave(tur: Tur, gave: GaveId): Tur {
  const gaver = [...tur.gaver, gave];
  if (gave === 'blaek') return { ...tur, gaver, blaek: Math.min(tur.maksBlaek, tur.blaek + 2) };
  if (gave === 'beholder') return { ...tur, gaver, maksBlaek: tur.maksBlaek + 1, blaek: tur.blaek + 1 };
  return { ...tur, gaver };
}

/** Holdet i en kamp i dybet: Æseløre altid, Vims og Klatten med deres gaver. */
export function holdFor(tur: Tur): { vims: boolean; klatten: boolean } {
  return { vims: tur.gaver.includes('vims'), klatten: tur.gaver.includes('klatten') };
}

// ---------- Rekorder ----------

export type Rekord = { froe: number; dybde: number; rigtige: number };

/** Bedst er dybest. Ved samme dybde vinder flest rigtige. Tid tæller aldrig. */
export function erBedre(a: Rekord, b: Rekord | null): boolean {
  if (!b) return true;
  return a.dybde > b.dybde || (a.dybde === b.dybde && a.rigtige > b.rigtige);
}

const TJEK = 'BCDFGHJKLMNPRSTV';
function tjek(froe: number, dybde: number, rigtige: number): string {
  let h = 2166136261;
  for (const c of `${froe}:${dybde}:${rigtige}:blaek`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h >>>= 0;
  return TJEK[h % 16] + TJEK[(h >>> 4) % 16];
}

/**
 * Rekordkoden kan vises frem i klassen: koden, dybden, de rigtige og to kontrolbogstaver, fx DYB-4821/7/23/KT.
 * Kontrolbogstaverne gør det svært at skrive en falsk rekord. Ingen navne.
 */
export function rekordkode(r: Rekord): string {
  return `${lavKode(r.froe)}/${r.dybde}/${r.rigtige}/${tjek(r.froe, r.dybde, r.rigtige)}`;
}

/** Læser en rekordkode. Null, hvis den er forkert skrevet, eller kontrolbogstaverne ikke passer. */
export function laesRekordkode(tekst: string): Rekord | null {
  const m = tekst.trim().toUpperCase().replace(/\s+/g, '').match(/^(?:DYB-?)?(\d{4})\/(\d{1,3})\/(\d{1,4})\/([A-Z]{2})$/);
  if (!m) return null;
  const r = { froe: Number(m[1]), dybde: Number(m[2]), rigtige: Number(m[3]) };
  return tjek(r.froe, r.dybde, r.rigtige) === m[4] ? r : null;
}
