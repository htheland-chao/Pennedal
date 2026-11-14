/**
 * Introens trailer (Henrik, 14. november 2026): hurtige smagsprøver på spillet til sidst i introen.
 * Ren logik uden canvas, så den kan testes. Billederne tegnes i src/ui/IntroTrailer.tsx.
 */
import { BFELT, kanStaa, laesBane, type Bane } from './bane';

/** Byens tage fra kapitel 2 (et udsnit). Samme tegn som i src/game/bane.ts. */
export const TRAILER_BANE = laesBane([
  '..............................................',
  '..............................................',
  '..............................................',
  '..............................................',
  '....................................=====.....',
  '..................####.....^..................',
  '..................####...######..........#####',
  '#########...##########...######...#####..#####',
  '#########...##########...######...#####..#####',
  '#########~~~##########~~~######~~~#####~~#####',
  '#########~~~##########~~~######~~~#####~~#####',
]);

/** Et punkt på figurens vej: tid i sekunder og fodpunkt i pixel. */
export type Punkt = { t: number; x: number; y: number };

/** Hvor figuren kan stå i en kolonne (fodpunktets y), eller null hvis der er et hul eller blæk. */
export function standHoejde(bane: Bane, kol: number): number | null {
  for (let y = 0; y < bane.hoejde; y++) {
    const c = bane.tegn(kol, y);
    if (c === '^' || c === '~') return null;
    if (kanStaa(c)) return y * BFELT;
  }
  return null;
}

/**
 * Figurens vej hen over banen fra kolonne fra til kolonne til. Den går med farten (pixel pr. sekund),
 * og hvor jorden skifter højde eller der er et hul, hopper den i en bue til næste sted, man kan stå.
 */
export function baneSti(bane: Bane, fra: number, til: number, fart = 110): Punkt[] {
  const midt = (k: number) => k * BFELT + BFELT / 2;
  let kol = fra;
  let y = standHoejde(bane, fra);
  if (y === null) throw new Error('Figuren kan ikke stå, hvor den starter');
  let t = 0;
  const sti: Punkt[] = [{ t, x: midt(kol), y }];
  while (kol < til) {
    const naeste = standHoejde(bane, kol + 1);
    if (naeste === y) {
      kol++;
      t += BFELT / fart;
      sti.push({ t, x: midt(kol), y });
      continue;
    }
    // Hop: til den første kolonne, man kan stå i.
    let maal = kol + 1;
    while (maal <= til && standHoejde(bane, maal) === null) maal++;
    if (maal > til) break;
    const ny = standHoejde(bane, maal)!;
    const x0 = midt(kol);
    const x1 = midt(maal);
    const top = Math.min(y, ny) - 28;
    const varighed = (x1 - x0) / fart + 0.2;
    for (const del of [0.25, 0.5, 0.75, 1]) {
      // En parabel gennem start, top og landing.
      const yy = del < 0.5 ? y + (top - y) * (1 - (1 - del * 2) ** 2) : top + (ny - top) * ((del - 0.5) * 2) ** 2;
      sti.push({ t: t + varighed * del, x: x0 + (x1 - x0) * del, y: yy });
    }
    t += varighed;
    kol = maal;
    y = ny;
  }
  return sti;
}
