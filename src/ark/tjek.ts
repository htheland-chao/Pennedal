/**
 * Tjek af pixelgrafik (docs/grafik.md): størrelse, farver og at paletten er hel.
 * Ren logik uden DOM, så både testen og grafikarket (npm run grafik:ark) kan bruge den.
 */
import type { Tegnkort } from '../game/pixel/sprites';

/** Over så mange farver pr. figur skriver arket "mange farver". Det er en vejledning, ikke et krav. */
export const MANGE_FARVER = 16;

export type TegnkortInfo = {
  b: number;
  h: number;
  /** Antal forskellige farvetegn i brug. */
  farver: number;
  /** Tegn i rækkerne, som ikke findes i paletten (ville gå i stykker, når figuren tegnes). */
  mangler: string[];
  /** Rækkerne har ikke alle samme bredde. */
  uens: boolean;
};

export function tegnkortInfo(t: Tegnkort): TegnkortInfo {
  const b = Math.max(...t.raekker.map((r) => r.length));
  const brugt = new Set<string>();
  for (const r of t.raekker) for (const k of r) if (k !== '.') brugt.add(k);
  return {
    b,
    h: t.raekker.length,
    farver: brugt.size,
    mangler: [...brugt].filter((k) => !(k in t.palet)),
    uens: t.raekker.some((r) => r.length !== b),
  };
}
