import { t, type TekstId } from './index';

/**
 * Tilbageblik (minder) fra avatarens forhistorie. Se docs/historie.md, afsnittet "Tilbageblik".
 * Teksterne står i tekster/da.json som minde.<id>.<nr>. En del kan have en mildere udgave
 * (minde.<id>.<nr>.mild), som bruges med indstillingen "Mindre uhygge".
 * Rækkefølgen er fast: tilføj kun til sidst.
 */
export const MINDER = ['blaek', 'streger', 'koekkenbord'] as const;
export type MindeId = (typeof MINDER)[number];

export const MINDE_INFO: Record<MindeId, { kapitel: number; dele: number; mild: number[] }> = {
  blaek: { kapitel: 1, dele: 4, mild: [] },
  streger: { kapitel: 2, dele: 4, mild: [2] },
  koekkenbord: { kapitel: 3, dele: 4, mild: [] },
};

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
