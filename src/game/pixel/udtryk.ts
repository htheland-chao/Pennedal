/**
 * Udtryk i portrætterne (20. november 2026): glad, bange og vred. Hvert udtryk er nogle få pixel, der ændres ved
 * øjne, bryn og mund i det faste portræt. En replik vælger udtrykket med feltet "udtryk" i kapitlet.
 * Figurer uden udtryk her viser altid det faste portræt. Ingen bogstaver i grafikken.
 */
import type { Tegnkort } from './sprites';
import { PORTRAETTER } from './portraetter';

export type Udtryk = 'glad' | 'bange' | 'vred';
export const UDTRYK: readonly Udtryk[] = ['glad', 'bange', 'vred'];

/** En ændring: x, y og det paletbogstav, pixlen får. */
type Pixel = [number, number, string];
type Opskrift = { ryd?: { bogstav: string; erstat: string; y: [number, number] }; pixel: Pixel[] };

const OPSKRIFTER: Partial<Record<keyof typeof PORTRAETTER, Partial<Record<Udtryk, Opskrift>>>> = {
  // Æseløre: papirfugl med ét øje (18, 9) og et bryn (17-18, 8). Næbbet sidder til højre.
  aeseloere: {
    glad: { pixel: [[17, 8, 'W'], [18, 8, 'E'], [18, 9, 'W'], [17, 9, 'E'], [19, 9, 'E']] },
    bange: { pixel: [[17, 8, 'W'], [18, 8, 'W'], [17, 7, 'k'], [18, 7, 'k'], [18, 10, 'E']] },
    vred: { pixel: [[17, 8, 'W'], [17, 7, 'k'], [18, 8, 'k'], [19, 8, 'k']] },
  },
  // Klatten: blæk-klat med store øjne (x 7-10 og 13-16, rækkerne 10-14). Kroppen er mørk, så øjnene og lyse bryn (w)
  // bærer udtrykket, og munden følger med.
  klatten: {
    glad: {
      ryd: { bogstav: 'o', erstat: 'I', y: [17, 18] },
      pixel: [
        // Lukkede, glade øjne: buer.
        ...[[8, 11], [9, 11], [9, 12], [8, 12], [9, 13], [10, 13], [8, 13], [7, 13], [8, 14], [9, 14], [10, 14]].map(([x, y]) => [x, y, 'I'] as Pixel),
        ...[[14, 11], [15, 11], [14, 12], [15, 12], [13, 13], [14, 13], [15, 13], [16, 13], [14, 14], [15, 14], [13, 14]].map(([x, y]) => [x, y, 'I'] as Pixel),
        [9, 17, 'o'], [15, 17, 'o'], [10, 18, 'o'], [11, 18, 'o'], [12, 18, 'o'], [13, 18, 'o'], [14, 18, 'o'],
      ],
    },
    bange: {
      ryd: { bogstav: 'o', erstat: 'I', y: [17, 18] },
      pixel: [
        // Små pupiller og bryn, der løfter sig i midten.
        [9, 12, 'O'], [15, 12, 'O'], [9, 13, 'O'], [15, 13, 'O'], [8, 12, 'o'], [14, 12, 'o'],
        [6, 9, 'w'], [7, 9, 'w'], [8, 8, 'w'], [9, 8, 'w'], [17, 9, 'w'], [16, 9, 'w'], [15, 8, 'w'], [14, 8, 'w'],
        [11, 17, 'o'], [12, 17, 'o'], [13, 17, 'o'], [11, 18, 'o'], [12, 18, 'o'], [13, 18, 'o'],
      ],
    },
    vred: {
      ryd: { bogstav: 'o', erstat: 'I', y: [17, 18] },
      pixel: [
        // Øjenlåg, der skærer øjnene skråt ind mod midten, og lyse bryn langs kanten.
        [8, 10, 'I'], [9, 10, 'I'], [9, 11, 'I'], [10, 11, 'I'], [10, 12, 'I'],
        [14, 10, 'I'], [15, 10, 'I'], [13, 11, 'I'], [14, 11, 'I'], [13, 12, 'I'],
        [6, 9, 'w'], [7, 9, 'w'], [8, 9, 'w'], [9, 10, 'w'], [10, 11, 'w'],
        [17, 9, 'w'], [16, 9, 'w'], [15, 9, 'w'], [14, 10, 'w'], [13, 11, 'w'],
        [10, 17, 'o'], [11, 17, 'o'], [12, 17, 'o'], [13, 17, 'o'], [14, 17, 'o'], [9, 18, 'o'], [15, 18, 'o'],
      ],
    },
  },
};

/** Har figuren et særligt portræt til dette udtryk? */
export function harUdtryk(figur: keyof typeof PORTRAETTER, udtryk: Udtryk): boolean {
  return Boolean(OPSKRIFTER[figur]?.[udtryk]);
}

/** Portrættet med et udtryk. Uden udtryk (eller uden opskrift) er det det faste portræt. */
export function medUdtryk(figur: keyof typeof PORTRAETTER, udtryk?: Udtryk): Tegnkort {
  const kort = PORTRAETTER[figur];
  const o = udtryk ? OPSKRIFTER[figur]?.[udtryk] : undefined;
  if (!o) return kort;
  const gitter = kort.raekker.map((r) => [...r]);
  if (o.ryd) {
    const { bogstav, erstat, y } = o.ryd;
    for (let yy = y[0]; yy <= y[1]; yy++) gitter[yy] = gitter[yy].map((c) => (c === bogstav ? erstat : c));
  }
  for (const [x, y, c] of o.pixel) gitter[y][x] = c;
  return { raekker: gitter.map((r) => r.join('')), palet: kort.palet };
}
