import { t, type TekstId } from './index';

/**
 * Tilbageblik (minder) fra avatarens forhistorie. Se docs/historie.md, afsnittet "Tilbageblik".
 * Teksterne står i tekster/da.json som minde.<id>.<nr>. En del kan have en mildere udgave
 * (minde.<id>.<nr>.mild), som bruges med indstillingen "Mindre uhygge".
 * Rækkefølgen er fast: tilføj kun til sidst.
 */
export const MINDER = ['blaek', 'streger', 'koekkenbord', 'skaar3a', 'skaar3b', 'godnat', 'skaar4a', 'skaar4b', 'skyggen', 'skaar5a', 'skaar5b', 'foldet', 'skaar6a', 'skaar6b', 'soeskendet', 'skaar7a', 'skaar7b'] as const;
export type MindeId = (typeof MINDER)[number];

export const MINDE_INFO: Record<MindeId, { kapitel: number; dele: number; mild: number[] }> = {
  blaek: { kapitel: 1, dele: 4, mild: [] },
  streger: { kapitel: 2, dele: 4, mild: [2] },
  koekkenbord: { kapitel: 3, dele: 4, mild: [] },
  skaar3a: { kapitel: 3, dele: 3, mild: [] },
  skaar3b: { kapitel: 3, dele: 3, mild: [] },
  godnat: { kapitel: 4, dele: 4, mild: [] },
  skaar4a: { kapitel: 4, dele: 3, mild: [] },
  skaar4b: { kapitel: 4, dele: 3, mild: [] },
  skyggen: { kapitel: 5, dele: 4, mild: [] },
  skaar5a: { kapitel: 5, dele: 3, mild: [] },
  skaar5b: { kapitel: 5, dele: 3, mild: [] },
  foldet: { kapitel: 6, dele: 4, mild: [] },
  skaar6a: { kapitel: 6, dele: 3, mild: [] },
  skaar6b: { kapitel: 6, dele: 3, mild: [] },
  soeskendet: { kapitel: 7, dele: 4, mild: [] },
  skaar7a: { kapitel: 7, dele: 3, mild: [] },
  skaar7b: { kapitel: 7, dele: 3, mild: [] },
};

/** Ekstra minder, som hukommelsesskår låser op (docs/historie.md, "Hukommelsesskår"). */
export const SKAAR_MINDE: Record<string, MindeId> = { k3a: 'skaar3a', k3b: 'skaar3b', k4a: 'skaar4a', k4b: 'skaar4b', k5a: 'skaar5a', k5b: 'skaar5b', k6a: 'skaar6a', k6b: 'skaar6b', k7a: 'skaar7a', k7b: 'skaar7b' };

/** Minderne fra de skår, eleven har fundet. */
export const skaarMinder = (skaar: string[]): MindeId[] => skaar.map((s) => SKAAR_MINDE[s]).filter((m): m is MindeId => !!m);

export function erMinde(id: string): id is MindeId {
  return (MINDER as readonly string[]).includes(id);
}

export const mindeTitel = (id: MindeId) => t(`minde.${id}.titel` as TekstId);

/** Mindets tekst, del for del. */
export function mindeTekster(id: MindeId, mindreUhygge: boolean): string[] {
  const info = MINDE_INFO[id];
  return Array.from({ length: info.dele }, (_, i) => {
    const nr = i + 1;
    const noegle = mindreUhygge && info.mild.includes(nr) ? `minde.${id}.${nr}.mild` : `minde.${id}.${nr}`;
    return t(noegle as TekstId);
  });
}
