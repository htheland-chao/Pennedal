/** Og-ormens hoved og hale (8. november 2026). Kroppen er HTML med ordene, så de kan læses op. */
import type { Tegnkort } from './sprites';

const P = { G: '#6fae5b', D: '#3d6b34', g: '#3d6b34', W: '#ffffff', k: '#1b1b24', R: '#e88a8a' };

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
