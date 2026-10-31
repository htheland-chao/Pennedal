import { FAERDIGHEDER, type FaerdighedId } from './faerdigheder';
import { START_STATUS, type FaerdighedsStatus, type Niveau } from './tilpasning';

export type Avatar = {
  hud: number;
  krop: number;
  oejne: number;
  mund: number;
  haar: number;
  haarfarve: number;
  hoved: number;
  hovedfarve: number;
  toej: number;
  toejfarve: number;
  tilbehoer: number;
};

/** Hvor mange valg hver avatardel har. Bruges også af gemmekoden. */
export const AVATAR_GRAENSER: Record<keyof Avatar, number> = {
  hud: 8,
  krop: 3,
  oejne: 4,
  mund: 4,
  haar: 8,
  haarfarve: 8,
  hoved: 4,
  hovedfarve: 8,
  toej: 4,
  toejfarve: 8,
  tilbehoer: 4,
};

export const AVATAR_DELE = Object.keys(AVATAR_GRAENSER) as (keyof Avatar)[];

export const STANDARD_AVATAR: Avatar = {
  hud: 2,
  krop: 1,
  oejne: 0,
  mund: 0,
  haar: 0,
  haarfarve: 1,
  hoved: 0,
  hovedfarve: 4,
  toej: 0,
  toejfarve: 4,
  tilbehoer: 0,
};

export type GemtSpil = {
  version: 1;
  /** Indeks i navnelisterne. Eleven kan ikke skrive et frit navn. */
  avatarnavn: { adjektiv: number; dyr: number };
  avatar: Avatar;
  kapitel: number;
  /** Indeks for det aktuelle trin i kapitlet. */
  trin: number;
  /** Antal løste opgaver i det aktuelle trin. */
  trinFremskridt: number;
  laasteOp: string[];
  valg: Record<string, string>;
  /** Ordkort, eleven har samlet. Følger ikke med i gemmekoden. */
  samling: string[];
  /** Antal færdige historier (lyset i fyrtårnet). */
  faerdigeHistorier: number;
  faerdigheder: Record<FaerdighedId, FaerdighedsStatus>;
};

export type Indstillinger = {
  oplaesning: boolean;
  stemme: string | null;
  skrift: 'standard' | 'ordblind' | 'system';
  stoerrelse: 1 | 2 | 3;
  mindreUhygge: boolean;
  /** Brug spillets indtalte stemmer, når der findes et klip. */
  indtalt: boolean;
  /** Lydstyrke for oplæsning, 0-100. */
  taleStyrke: number;
  /** Dialogen går selv videre til næste replik, når oplæsningen er færdig. */
  autoVidere: boolean;
};

export const STANDARD_INDSTILLINGER: Indstillinger = {
  oplaesning: true,
  stemme: null,
  skrift: 'standard',
  stoerrelse: 1,
  mindreUhygge: false,
  indtalt: true,
  taleStyrke: 80,
  autoVidere: true,
};

export const GEM_NOEGLE = 'pennedal.gemtspil.v1';
export const INDSTILLINGER_NOEGLE = 'pennedal.indstillinger.v1';

export function tommeFaerdigheder(): Record<FaerdighedId, FaerdighedsStatus> {
  const r = {} as Record<FaerdighedId, FaerdighedsStatus>;
  for (const id of FAERDIGHEDER) r[id] = { ...START_STATUS };
  return r;
}

export function nytSpil(avatar: Avatar, avatarnavn: GemtSpil['avatarnavn']): GemtSpil {
  return {
    version: 1,
    avatarnavn,
    avatar,
    kapitel: 1,
    trin: 0,
    trinFremskridt: 0,
    laasteOp: [],
    valg: {},
    samling: [],
    faerdigeHistorier: 0,
    faerdigheder: tommeFaerdigheder(),
  };
}

function erTal(x: unknown, min: number, max: number): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}

/** Tjekker et gemt spil grundigt, så en ødelagt fil ikke får spillet til at gå i stykker. */
export function validerGemtSpil(data: unknown): GemtSpil | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return null;
  const navn = d.avatarnavn as Record<string, unknown> | undefined;
  if (!navn || !erTal(navn.adjektiv, 0, 31) || !erTal(navn.dyr, 0, 31)) return null;
  const av = d.avatar as Record<string, unknown> | undefined;
  if (!av) return null;
  const avatar = {} as Avatar;
  for (const del of AVATAR_DELE) {
    if (!erTal(av[del], 0, AVATAR_GRAENSER[del] - 1)) return null;
    avatar[del] = av[del] as number;
  }
  if (!erTal(d.kapitel, 1, 15) || !erTal(d.trin, 0, 63) || !erTal(d.trinFremskridt, 0, 99)) return null;
  const strengListe = (x: unknown) => Array.isArray(x) && x.every((y) => typeof y === 'string');
  if (!strengListe(d.laasteOp) || !strengListe(d.samling)) return null;
  const faerdigheder = tommeFaerdigheder();
  const f = (d.faerdigheder ?? {}) as Record<string, Record<string, unknown>>;
  for (const id of FAERDIGHEDER) {
    const s = f[id];
    if (!s) continue;
    if (!erTal(s.niveau, 1, 5)) return null;
    faerdigheder[id] = {
      niveau: s.niveau as Niveau,
      rigtigeIForsoeg1: erTal(s.rigtigeIForsoeg1, 0, 1e6) ? s.rigtigeIForsoeg1 : 0,
      fejl: erTal(s.fejl, 0, 1e6) ? s.fejl : 0,
      iTraek: erTal(s.iTraek, 0, 99) ? s.iTraek : 0,
      fejlITraek: erTal(s.fejlITraek, 0, 99) ? s.fejlITraek : 0,
    };
  }
  return {
    version: 1,
    avatarnavn: { adjektiv: navn.adjektiv as number, dyr: navn.dyr as number },
    avatar,
    kapitel: d.kapitel as number,
    trin: d.trin as number,
    trinFremskridt: d.trinFremskridt as number,
    laasteOp: d.laasteOp as string[],
    valg: (d.valg && typeof d.valg === 'object' ? d.valg : {}) as Record<string, string>,
    samling: d.samling as string[],
    faerdigeHistorier: erTal(d.faerdigeHistorier, 0, 9999) ? d.faerdigeHistorier : 0,
    faerdigheder,
  };
}

/** Browserens lager kan mangle eller fejle (fx i et privat vindue). Derfor try/catch overalt. */
export function hentGemtSpil(lager: Storage | undefined = globalThis.localStorage): GemtSpil | null {
  try {
    const tekst = lager?.getItem(GEM_NOEGLE);
    if (!tekst) return null;
    return validerGemtSpil(JSON.parse(tekst));
  } catch {
    return null;
  }
}

export function gemSpil(spil: GemtSpil, lager: Storage | undefined = globalThis.localStorage): boolean {
  try {
    lager?.setItem(GEM_NOEGLE, JSON.stringify(spil));
    return true;
  } catch {
    return false;
  }
}

export function sletGemtSpil(lager: Storage | undefined = globalThis.localStorage): void {
  try {
    lager?.removeItem(GEM_NOEGLE);
  } catch {
    /* ignorer */
  }
}

export function hentIndstillinger(lager: Storage | undefined = globalThis.localStorage): Indstillinger {
  try {
    const tekst = lager?.getItem(INDSTILLINGER_NOEGLE);
    if (!tekst) return { ...STANDARD_INDSTILLINGER };
    const d = JSON.parse(tekst) as Partial<Indstillinger>;
    return {
      oplaesning: typeof d.oplaesning === 'boolean' ? d.oplaesning : true,
      stemme: typeof d.stemme === 'string' ? d.stemme : null,
      skrift: d.skrift === 'ordblind' || d.skrift === 'system' ? d.skrift : 'standard',
      stoerrelse: d.stoerrelse === 2 || d.stoerrelse === 3 ? d.stoerrelse : 1,
      mindreUhygge: typeof d.mindreUhygge === 'boolean' ? d.mindreUhygge : false,
      indtalt: typeof d.indtalt === 'boolean' ? d.indtalt : true,
      taleStyrke: erTal(d.taleStyrke, 0, 100) ? d.taleStyrke : 80,
      autoVidere: typeof d.autoVidere === 'boolean' ? d.autoVidere : true,
    };
  } catch {
    return { ...STANDARD_INDSTILLINGER };
  }
}

export function gemIndstillinger(i: Indstillinger, lager: Storage | undefined = globalThis.localStorage): void {
  try {
    lager?.setItem(INDSTILLINGER_NOEGLE, JSON.stringify(i));
  } catch {
    /* ignorer */
  }
}
