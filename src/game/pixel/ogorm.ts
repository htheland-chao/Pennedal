/** Og-ormens hoved og hale (8. november 2026). Kroppen er HTML med ordene, så de kan læses op. */
import type { Tegnkort } from './sprites';

const P = { G: '#5aa572', D: '#356c4d', g: '#356c4d', W: '#f4efe0', k: '#1b1b24', R: '#e595a9' };

/** Hovedet vender mod højre (ormen kryber mod højre, i læseretningen). 12 x 10. */
export const ORM_HOVED: Tegnkort = {
  raekker: [
    '...DDDD.....',
    '..DGGGGDD...',
    '.DGGWWGWWD..',
    '.DGGWkGWkGD.',
    'DGGGGGGGGGGD',
    'DGRGGGGGGGGD',
    'DGGGGGGgggGD',
    '.DGGGGGGGGD.',
    '..DDGGGGDD..',
    '....DDDD....',
  ],
  palet: P,
};

/** Halen. 7 x 10. */
export const ORM_HALE: Tegnkort = {
  raekker: ['.......', '.......', '.....DD', '...DDGG', '.DDGGGG', 'DGGGGGG', '.DDGGGG', '...DDGG', '.....DD', '.......'],
  palet: P,
};
