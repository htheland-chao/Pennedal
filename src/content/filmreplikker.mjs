// Replikkerne i en filmsekvens (20. november 2026), i den rækkefølge de står, også inde i "samtidig".
// Bruges af spillet, testene og scripts (stavetjek, korrektur og lydklip), så filmens tekst kommer med overalt.

/** Alle replikker i et trin: dialogens egne og dem i en films handlinger. */
export function trinReplikker(trin) {
  return [...(trin.replikker ?? []), ...filmReplikker(trin.handlinger ?? [])];
}

/** Replikkerne i en liste af filmhandlinger. */
export function filmReplikker(handlinger) {
  return handlinger.flatMap((h) => (h.type === 'replikker' ? h.replikker : h.type === 'samtidig' ? filmReplikker(h.handlinger) : []));
}
