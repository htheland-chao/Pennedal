/**
 * Hvilke steder har runde træer (Henrik, 19. november 2026): én slags træer pr. sted, aldrig blandet.
 * Kapitel 3 (Viskeskoven) og kapitel 6 (Blæksøen) har runde træer fra Ninja Adventure (CC0, se LICENSER.md).
 * Alle andre steder har vores egne papirgraner (Rimbjerget graner med sne).
 */
const RUNDE_TRAEER = new Set(['viskeskov', 'viskesti', 'blaeksoe', 'hytte']);

export function rundeTraeer(tema: string): boolean {
  return RUNDE_TRAEER.has(tema);
}
