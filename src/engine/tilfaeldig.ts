/** Lille, forudsigelig tilfældighedsgenerator (mulberry32), så tests kan gentages. */
export function lavTilfaeldig(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bland<T>(liste: readonly T[], tal: () => number): T[] {
  const kopi = [...liste];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(tal() * (i + 1));
    [kopi[i], kopi[j]] = [kopi[j], kopi[i]];
  }
  return kopi;
}

export function vaelg<T>(liste: readonly T[], tal: () => number): T {
  return liste[Math.floor(tal() * liste.length)];
}
