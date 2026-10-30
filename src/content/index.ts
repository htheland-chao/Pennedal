import da from './tekster/da.json';
import kapitel1Data from './kapitler/kapitel1.json';
import stummeData from './ord/stumme.json';
import ogormData from './ord/ogorm.json';
import broData from './ord/historiebro.json';
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

export type Taler = 'holm' | 'aeseloere' | 'klatten' | 'lanterne' | 'fortaeller';

export type Replik = { taler: Taler; tekst: string; bevidstFejl?: boolean };

export type StedObjekt = {
  id: string;
  navn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  form: string;
  farve: string;
};

export type Sted = {
  navn: string;
  tema: string;
  start: { x: number; y: number };
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
  uhygge?: boolean;
};

export type DialogTrin = FaellesTrin & { type: 'dialog'; replikker: Replik[] };
export type SkiftTrin = FaellesTrin & { type: 'skift'; tilSted: string };
export type OpgaveTrin = FaellesTrin & {
  type: 'opgave';
  mekanik: 'hviske' | 'ogorm' | 'historiebro';
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

export type Trin = DialogTrin | SkiftTrin | OpgaveTrin | BevisjagtTrin;

export type Kapitel = {
  kapitel: number;
  titel: string;
  steder: Record<string, Sted>;
  trin: Trin[];
};

export const kapitler: Kapitel[] = [kapitel1Data as Kapitel];

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

export type Traek = 'problem' | 'portal' | 'verden' | 'konflikt' | 'loesning' | 'hjemkomst';
export type Historie = { id: string; titel: string; planker: Record<Traek, string>; fremmed: string };
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
