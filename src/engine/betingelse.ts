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
  /** Alle hukommelsesskår skal være fundet (true) eller ikke alle (false). Kapitel 8: den sande slutning. */
  alleSkaar?: boolean;
  /** Betingelsen her må ikke være opfyldt (fx "ikke den sande slutning"). */
  ikke?: Betingelse;
};

/** Alle hukommelsesskår i spillet: to i hvert kapitel fra 3 til 7. */
export const ALLE_SKAAR = ['k3a', 'k3b', 'k4a', 'k4b', 'k5a', 'k5b', 'k6a', 'k6b', 'k7a', 'k7b'];

type Spil = Pick<GemtSpil, 'valg' | 'venlighed'> & { skaar?: readonly string[] };

export function opfyldt(b: Betingelse | undefined, spil: Spil): boolean {
  if (!b) return true;
  if (b.valg && !spil.valg[b.valg]) return false;
  if (b.ikkeValg && spil.valg[b.ikkeValg]) return false;
  if (b.venlighed !== undefined && spil.venlighed < b.venlighed) return false;
  if (b.venlighedUnder !== undefined && spil.venlighed >= b.venlighedUnder) return false;
  if (b.alleSkaar !== undefined && ALLE_SKAAR.every((x) => spil.skaar?.includes(x)) !== b.alleSkaar) return false;
  if (b.ikke && opfyldt(b.ikke, spil)) return false;
  return true;
}

/** Kun de replikker (eller valgmuligheder), hvis betingelse er opfyldt. */
export function udvaelg<T extends { hvis?: Betingelse }>(liste: T[], spil: Spil): T[] {
  return liste.filter((x) => opfyldt(x.hvis, spil));
}

/** Klatten er en ven og kommer med på holdet, når eleven har været venlig mod ham mindst én gang. */
export const KLATTEN_VEN: Betingelse = { venlighed: 1 };

/** Den sande slutning (kapitel 8, Henrik 10. november 2026): alle skår og venlig mod Klatten mindst én gang. */
export const SAND_SLUTNING: Betingelse = { alleSkaar: true, venlighed: 1 };
