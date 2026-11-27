// Hvem siger beskederne i opgaverne (27. november 2026, Henrik: Æseløre læste regler op, før man havde mødt ham)?
// Æseløre, men først fra trinnet, hvor eleven møder ham i kapitel 1. Før det er det fortælleren.
// Bruges både af spillet (OpgaveVindue) og af scripts/lydtekster.mjs, så klippene passer.

/** Trinnet, hvor eleven møder Æseløre. */
export const AESELOERE_MOEDES = 'k1-aeseloere';

/** Stemmen til beskederne i et trin: 'fortaeller' før mødet med Æseløre, ellers 'aeseloere'. */
export function beskedFigur(kapitler, trinId) {
  const k1 = kapitler.find((k) => k.kapitel === 1);
  if (!k1) return 'aeseloere';
  const ids = k1.trin.map((t) => t.id);
  const i = ids.indexOf(trinId);
  const moede = ids.indexOf(AESELOERE_MOEDES);
  return i >= 0 && moede >= 0 && i < moede ? 'fortaeller' : 'aeseloere';
}
