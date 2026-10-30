// Fælles for spillet og scriptet, der laver lydfiler (scripts/lav-lyd.mjs).
// Ren JavaScript uden import, så både Vite og Node kan bruge den direkte.

/** 53-bit hash (cyrb53). Hurtig og stabil på tværs af browser og Node. */
export function cyrb53(tekst, seed = 0) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Teksten, som stemmen får. Udtalehjælp fra stemmer.json skifter ord ud, fx et navn, der bliver sagt forkert. */
export function taleTekst(tekst, udtale = {}) {
  let ud = tekst;
  for (const [fra, til] of Object.entries(udtale)) ud = ud.split(fra).join(til);
  return ud;
}

/**
 * Nøglen til et lydklip. Den skifter, hvis teksten, stemmen, stilen, udtalen eller modellen skifter,
 * så et klip altid passer til det, der står på skærmen.
 */
export function lydNoegle(tekst, figur, stemmer) {
  const f = stemmer.figurer[figur];
  if (!f) return null;
  const tale = taleTekst(tekst, stemmer.udtale);
  return cyrb53([stemmer.model, f.stemme, f.stil, tale].join('␞')).toString(16).padStart(14, '0');
}
