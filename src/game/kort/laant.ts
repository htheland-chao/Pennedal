/**
 * PRØVE med lånt grafik (Henrik, 19. november 2026): kun slået til med ?laant=1 i adressen, så eleverne ikke ser den,
 * før Henrik har godkendt stilen. Se LICENSER.md.
 */
export function laantGrafik(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).has('laant');
}
