import type { Betingelse } from '../engine/betingelse';
import type { FejlType, KorrekturTekst } from '../mechanics/korrektur';
import da from './tekster/da.json';
import kapitel1Data from './kapitler/kapitel1.json';
import kapitel2Data from './kapitler/kapitel2.json';
import stummeData from './ord/stumme.json';
import ogormData from './ord/ogorm.json';
import raaberData from './ord/raaber.json';
import broData from './ord/historiebro.json';
import synonymData from './ord/synonymer.json';
import kapitel3Data from './kapitler/kapitel3.json';
import kapitel4Data from './kapitler/kapitel4.json';
import rimData from './ord/rim.json';
import fortaellerData from './ord/fortaeller.json';
import korrekturJson from './ord/korrektur.json';
import kapitel6Data from './kapitler/kapitel6.json';
import kapitel5Data from './kapitler/kapitel5.json';
import ordkortData from './ordkort.json';
import navneData from './avatar/navne.json';
import deleData from './avatar/dele.json';

export type TekstId = keyof typeof da;

/** Henter en tekst og indsætter værdier i {krøllede} pladser. */
export function t(id: TekstId, vaerdier: Record<string, string | number> = {}): string {
  const tekst = (da as Record<string, string>)[id];
  if (tekst === undefined) {
    if (import.meta.env.DEV) console.error(`Mangler tekst: ${id}`);
    return id;
  }
  return tekst.replace(/\{(\w+)\}/g, (_, k: string) => (k in vaerdier ? String(vaerdier[k]) : `{${k}}`));
}

export function harTekst(id: string): id is TekstId {
  return id in da;
}

export type Taler = 'holm' | 'aeseloere' | 'klatten' | 'lanterne' | 'fortaeller' | 'portvagt' | 'raaber' | 'borgmester' | 'ufaerdige' | 'vims' | 'tomordet' | 'stumming' | 'halvfugl' | 'rimfod' | 'ekko' | 'fodnote' | 'tvivl' | 'snegl';

/** En replik. Med hvis vises den kun, når betingelsen er opfyldt (src/engine/betingelse.ts). */
export type Replik = { taler: Taler; tekst: string; bevidstFejl?: boolean; hvis?: Betingelse };

export type StedObjekt = {
  id: string;
  navn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  form: string;
  farve: string;
  /** Feltet på kortet, hvis stedet har et kort (pixelgrafik). x, y, w og h bruges kun af steder uden kort. */
  felt?: [number, number];
  /** Objektet forsvinder fra dette trin og frem, fx når Klatten er løbet sin vej. */
  skjulFra?: string;
  /** Objektet er skjult, indtil kapitlet når dette trin. */
  visFra?: string;
  /** Pynt: byens folk, der står og snakker. Man kan ikke undersøge dem. */
  snakker?: boolean;
  /** Objektet lyser om natten, fx en lanterne. */
  lys?: boolean;
  /**
   * Frivilligt (Henrik, 9. november 2026): kan undersøges når som helst på stedet, uden for kapitlets trin.
   *   mission: den, der giver kapitlets sidemission. blad: noget, man samler til missionen.
   *   udflugt: indgangen til et frivilligt sted (feltet udflugt), fx en svær platformbane.
   */
  frivillig?: 'mission' | 'blad' | 'udflugt';
  udflugt?: string;
};

/** En frivillig, svær udfordring på et sted for sig selv. Belønningen er et hukommelsesskår (docs/historie.md). */
export type Udflugt = {
  skaar: string;
  /** Stedet, man kommer fra og vender tilbage til. */
  fra: string;
  opgavetekst: string;
  ind: Replik[];
  spoergsmaal: string;
  ja: string;
  nej: string;
  faerdig: Replik[];
  /** Når man klarer den igen og allerede har skåret. */
  igen: Replik[];
};

/** De slags ordopgaver, som ordsten og sidemissioner kan bruge. */
export type OrdOpgaveArt = 'synonym' | 'rim' | 'ikkerim' | 'fortaeller' | 'stavning';

/** En sidemission: find bladene, og hjælp den, der gav missionen, med en opgave. Belønningen er et hukommelsesskår. */
export type Mission = {
  giver: string;
  blade: string[];
  skaar: string;
  /** Antal opgaver til sidst. */
  antal: number;
  /** Slags opgave til sidst. Uden feltet: synonymer. */
  art?: OrdOpgaveArt;
  titel: string;
  intro: string;
  start: Replik[];
  mangler: Replik[];
  klar: Replik[];
  faerdig: Replik[];
  efter: Replik[];
};

export type Sted = {
  navn: string;
  tema: string;
  start: { x: number; y: number };
  /** Kort i felter (se src/game/kort.ts). Steder med kort tegnes i pixelgrafik set oppefra. */
  kort?: string[];
  startFelt?: [number, number];
  /** Platformbane set fra siden (se src/game/bane.ts). Et sted har enten kort eller bane. */
  bane?: string[];
  /** Replikker, der vises, når man kommer til stedet, fx Æseløre, der forklarer en bane. Er ikke et trin. */
  intro?: Replik[];
  /** Platformbane: hvilken slags opgave ordstenene giver. Uden feltet: synonymer. */
  ordsten?: 'synonym' | 'rim' | 'fortaeller' | 'stavning';
  /** Stedet er en frivillig udflugt (se Udflugt). */
  udflugt?: Udflugt;
  objekter: StedObjekt[];
};

type FaellesTrin = {
  id: string;
  del: number;
  sted: string;
  objekt: string | null;
  opgavetekst?: string;
  slutDel?: number;
  slutKapitel?: boolean;
  tilSted?: string;
  laaserOp?: string[];
  /** Ting, der kommer i tasken, når trinnet er klaret (se src/engine/taske.ts). */
  giver?: string[];
  /** Ting fra tasken, der bliver brugt, når trinnet er klaret. */
  bruger?: string[];
  uhygge?: boolean;
  /** Mørket: Den Ufærdige er til stede. Farverne forsvinder, og musikken skifter. */
  moerke?: boolean;
};

export type DialogTrin = FaellesTrin & {
  type: 'dialog';
  replikker: Replik[];
  /** Et tilbageblik (se src/content/minder.ts), der vises lige før replikken med nummer foer (fra 0). */
  tilbageblik?: { id: string; foer: number };
  /** Et valg efter den sidste replik. Begge veje virker, men spillet husker det (docs/historie.md). */
  valg?: DialogValg;
};

/** En valgmulighed i en dialog. saet gemmes i spil.valg, og venlighed lægges til Klattens venlighed. */
export type ValgMulighed = { tekst: string; saet?: string; venlighed?: number; replikker: Replik[]; hvis?: Betingelse };
export type DialogValg = { spoergsmaal: string; muligheder: ValgMulighed[] };

/** En rolig kamp mod et væsen (src/mechanics/kamp.ts). antal er det mindste antal ture. */
export type KampTrin = FaellesTrin & {
  type: 'kamp';
  vaesen: 'tomordet' | 'stumming' | 'ekko' | 'tvivl' | 'krusedulle';
  faerdighed: string;
  antal: number;
  /** En hjælper, der kan bruge en tur på at hjælpe. */
  hjaelper?: 'vims';
  /** Flere væsner i samme kamp. Uden feltet er det kun vaesen. */
  vaesner?: ('tomordet' | 'stumming' | 'ekko' | 'tvivl' | 'krusedulle')[];
  /** Hjælperne på holdet. Uden feltet: Æseløre, og Vims hvis hjaelper er vims. */
  hold?: ('aeseloere' | 'vims')[];
  /** Klatten kommer med på holdet, når betingelsen er opfyldt (kapitel 6: venlig mod ham). */
  klatten?: Betingelse;
  /** De slags slag, avataren kan bruge. Uden feltet: alle. */
  slag?: ('synonym' | 'stumt' | 'rim' | 'fortaeller' | 'ret')[];
};
export type SkiftTrin = FaellesTrin & { type: 'skift'; tilSted: string };
export type OpgaveTrin = FaellesTrin & {
  type: 'opgave';
  mekanik: 'hviske' | 'ogorm' | 'historiebro' | 'raaber' | 'rim' | 'synsvinkel' | 'korrektur';
  faerdighed: string;
  antal: number;
};
export type BevisSpoergsmaal = {
  id: string;
  tekst: string;
  svar: number;
  forkert: Record<string, string>;
  standard: string;
};
export type BevisjagtTrin = FaellesTrin & {
  type: 'bevisjagt';
  faerdighed: string;
  forforstaaelse: string[];
  titel: string;
  saetninger: string[];
  spoergsmaal: BevisSpoergsmaal[];
};

/** En ting, man kan finde i et escape room-rum. */
export type RumFund = {
  objekt: string;
  /** Det, der kommer i tasken. Uden ting er fundet kun noget at læse, fx en seddel. */
  ting?: string;
  /** Tingens navn i tasken. */
  tingNavn?: string;
  /** Det, fortælleren siger, når man undersøger stedet. */
  tekst: string;
  /** En længere tekst, eleven kan læse, fx en seddel. Vises som rigtig tekst. */
  laesning?: string[];
};

/** Escape room: find tingene, og åbn låsen med en kode, man finder ved at læse. */
export type RumTrin = FaellesTrin & {
  type: 'rum';
  objekt: null;
  faerdighed: string;
  fund: RumFund[];
  laas: {
    objekt: string;
    /** Ting, der skal være i tasken, før man kan prøve koden. */
    kraever: string[];
    mangler: string;
    gaade: string;
    /** Rigtige svar (store og små bogstaver og mellemrum tæller ikke). */
    svar: string[];
    regel: string;
    eksempel: string;
    aabnet: string;
  };
};

export type Trin = DialogTrin | SkiftTrin | OpgaveTrin | BevisjagtTrin | RumTrin | KampTrin;

export type Kapitel = {
  kapitel: number;
  titel: string;
  /** Æseløre er først med fra dette trin (i kapitel 1 flyver han ud af skuffen). Uden feltet er han med fra start. */
  fuglFra?: string;
  steder: Record<string, Sted>;
  trin: Trin[];
  /** Sidemissioner i kapitlet (frivillige). */
  missioner?: Record<string, Mission>;
};

// JSON giver tal-lister som number[]. Testene i kapitel.test.ts tjekker, at felterne har to tal.
export const kapitler: Kapitel[] = [kapitel1Data, kapitel2Data, kapitel3Data, kapitel4Data, kapitel5Data, kapitel6Data].map((k) => k as unknown as Kapitel);

export function hentKapitel(nr: number): Kapitel | undefined {
  return kapitler.find((k) => k.kapitel === nr);
}

export type StumtOrd = {
  ord: string;
  stumt: number;
  type: 'd' | 'h' | 'v';
  svaerhed: number;
  saetning: string;
  billede: string;
  forklaring: string;
};
export const stumme = stummeData as { faerdighed: string; regler: Record<'d' | 'h' | 'v', string>; ord: StumtOrd[] };

export type OgTekst = { id: string; niveau: number; tekst: string };
export const ogorm = ogormData as { faerdighed: string; tekster: OgTekst[] };
export const raaber = raaberData as { faerdighed: string; saetninger: { id: string; niveau: number; tekst: string; tegn: '.' | '?' | '!' }[] };

export type Traek = 'problem' | 'portal' | 'verden' | 'konflikt' | 'loesning' | 'hjemkomst';
export type Historie = { id: string; titel: string; planker: Record<Traek, string>; fremmed: string };
export type Synonym = { id: string; ord: string; saetning: string; svar: string; forkerte: string[]; svaerhed: number };
export const synonymer = synonymData as { faerdighed: string; ord: Synonym[] };
/** Fortæller og synsvinkel (kapitel 5, Fodnoternes kælder). */
/** Klattens tekster med stavefejl (kapitel 6): regler og eksempler pr. slags fejl. */
export const korrekturData = korrekturJson as unknown as {
  regler: Record<FejlType, string>;
  eksempler: Record<FejlType, string>;
  tekster: KorrekturTekst[];
};

export const fortaellersaetninger = fortaellerData as unknown as {
  faerdighed: string;
  klassificer: { id: string; tekst: string; fortaeller: 'jeg' | 'hanhun'; svaerhed: number }[];
  fortsaet: { id: string; foer: string; efter: string; svar: string; forkerte: string[]; svaerhed: number }[];
};
/** Rim og stavelser (kapitel 4, Rimbjerget). */
export const rimord = rimData as { faerdighed: string; rim: { ord: string; rimer: string[]; forkerte: string[]; svaerhed: number }[]; stavelser: { ord: string; dele: string; svaerhed: number }[] };

export const historiebro = broData as { faerdighed: string; traek: Traek[]; historier: Historie[] };

export type Ordkort = { ord: string; forklaring: string; eksempel: string; billede: string };
export const ordkort = ordkortData as Record<string, Ordkort>;

/** Ordkort fra ordlisten med stumme bogstaver bruges også i samlingen. */
export function findOrdkort(id: string): Ordkort | undefined {
  if (ordkort[id]) return ordkort[id];
  const s = stumme.ord.find((o) => o.ord === id);
  if (s) return { ord: s.ord, forklaring: s.forklaring, eksempel: s.saetning, billede: s.billede };
  return undefined;
}

export const navne = navneData as { adjektiver: string[]; dyr: string[] };
export function avatarnavn(n: { adjektiv: number; dyr: number }): string {
  return `${navne.adjektiver[n.adjektiv]} ${navne.dyr[n.dyr]}`;
}

type Del = { valg?: string[]; farver?: string[]; laast?: Record<string, string> };
export const avatarDele = deleData as Record<string, Del>;

/** Deler en tekst med {{ord}} eller {{vist ord|id}} op i almindelig tekst og ordkort. */
export type TekstStykke = { type: 'tekst'; tekst: string } | { type: 'ord'; tekst: string; id: string };
export function delTekst(tekst: string): TekstStykke[] {
  const stykker: TekstStykke[] = [];
  const re = /\{\{([^}|]+)(?:\|([^}]+))?\}\}/g;
  let sidst = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tekst))) {
    if (m.index > sidst) stykker.push({ type: 'tekst', tekst: tekst.slice(sidst, m.index) });
    stykker.push({ type: 'ord', tekst: m[1], id: m[2] ?? m[1] });
    sidst = m.index + m[0].length;
  }
  if (sidst < tekst.length) stykker.push({ type: 'tekst', tekst: tekst.slice(sidst) });
  return stykker;
}

/** Tekst uden markering, fx til oplæsning. */
export function renTekst(tekst: string): string {
  return delTekst(tekst)
    .map((s) => s.tekst)
    .join('');
}
