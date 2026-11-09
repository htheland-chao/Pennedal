/**
 * Betingelser på replikker og valg (kapitel 6, 9. november 2026): spillet husker, hvad eleven har valgt,
 * og hvor venlig eleven har været mod Klatten. En replik eller en valgmulighed med hvis vises kun, når betingelsen er opfyldt.
 * Ren logik uden React og Phaser.
 */
import type { GemtSpil } from './gem';

export type Betingelse = {
  /** Et valg, der skal være taget (spil.valg[id] er sat). */
  valg?: string;
  /** Et valg, der ikke må være taget. */
  ikkeValg?: string;
  /** Klattens venlighed skal mindst være så høj. */
  venlighed?: number;
  /** Klattens venlighed skal være lavere end dette. */
  venlighedUnder?: number;
};

type Spil = Pick<GemtSpil, 'valg' | 'venlighed'>;

export function opfyldt(b: Betingelse | undefined, spil: Spil): boolean {
  if (!b) return true;
  if (b.valg && !spil.valg[b.valg]) return false;
  if (b.ikkeValg && spil.valg[b.ikkeValg]) return false;
  if (b.venlighed !== undefined && spil.venlighed < b.venlighed) return false;
  if (b.venlighedUnder !== undefined && spil.venlighed >= b.venlighedUnder) return false;
  return true;
}

/** Kun de replikker (eller valgmuligheder), hvis betingelse er opfyldt. */
export function udvaelg<T extends { hvis?: Betingelse }>(liste: T[], spil: Spil): T[] {
  return liste.filter((x) => opfyldt(x.hvis, spil));
}

/** Klatten er en ven og kommer med på holdet, når eleven har været venlig mod ham mindst én gang. */
export const KLATTEN_VEN: Betingelse = { venlighed: 1 };
