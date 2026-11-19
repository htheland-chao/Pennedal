/**
 * Figurerne i Viskeskoven (kapitel 3): Vims under sin svamp, Tomordet og Stummingen.
 * Tegnet til Pennedal (31. oktober 2026), pladsholdere i spillets stil. Ingen bogstaver.
 * Hvert bogstav i et tegnkort er en farve i paletten, punktum er gennemsigtigt.
 */
import type { Tegnkort } from './sprites';

/** Vims: et lille, slidt viskelæder i to farver under en bleg svamp. */
export const VIMS: Tegnkort = {
  raekker: [
    '....KKKKKKKK....',
    '..KKMMMMMMMMKK..',
    '.KMMmMMMMMmMMMK.',
    'KMMMMMMmMMMMMMMK',
    'KKKKKKKKKKKKKKKK',
    '......KSSK......',
    '......KSSK......',
    '...KKKKKKKKKK...',
    '...KPPPPPPPPK...',
    '...KPEPPPPEPK...',
    '...KPEPPPPEPK...',
    '...KPPPPPPPPK...',
    '...KPPPooPPPK...',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KBbBBBBbBK...',
    '...KKKKKKKKKK...',
    '....KK....KK....',
  ],
  palet: { K: '#3a3560', M: '#c9dcf2', m: '#f4efe0', S: '#f3ead2', P: '#e595a9', E: '#1b1b24', o: '#8a5a3a', B: '#698fc1', b: '#4f6fa8' },
};

/** Tomordet: et ord uden noget indeni. Kun omrids, øjne og en stor, sulten mund. */
export const TOMORD: Tegnkort = {
  raekker: [
    '....KKKKKKKK....',
    '..KKWWWWWWWWKK..',
    '.KWWWWWWWWWWWWK.',
    'KWWEEWWWWWWEEWWK',
    'KWWEEWWWWWWEEWWK',
    'KWWWWWWWWWWWWWWK',
    'KWWKKKKKKKKKKWWK',
    'KWWKoToToToTKWWK',
    'KWWKooooooooKWWK',
    'KWWKToToToToKWWK',
    'KWWWKKKKKKKKWWWK',
    'KWWWWWWWWWWWWWWK',
    '.KWWWWWWWWWWWWK.',
    '..KWWKWWWWKWWK..',
    '...KK.KWWK.KK...',
    '.......KK.......',
  ],
  palet: { K: '#6a6487', W: '#f4efe0', E: '#3a3560', o: '#222222', T: '#f3ead2' },
};

/** Stummingen: en lille grå skabning med en finger for munden. */
export const STUMMING: Tegnkort = {
  raekker: [
    '.....KKKK.....',
    '...KKGGGGKK...',
    '..KGGGGGGGGK..',
    '.KGGEGGGGEGGK.',
    '.KGGEGGGGEGGK.',
    '.KGGGGGGGGGGK.',
    '.KGGGGFKGGGGK.',
    '.KGGGGFGGGGGK.',
    '..KGGGFGGGGK..',
    '.KGGGHHGGGGGK.',
    'KGGGGHHGGGGGGK',
    'KGGGGGGGGGGGGK',
    'KGgGGGGGGGgGGK',
    '.KGGGGGGGGGGK.',
    '..KKGK..KGKK..',
    '...KK....KK...',
  ],
  palet: { K: '#4f4a57', G: '#a7aab8', g: '#8a8a8a', F: '#c9dcf2', H: '#b9bfcf', E: '#1b1b24' },
};

/** Lægger et tegnkort midt i et kvadrat, så det kan bruges som portræt (24 x 24). */
export function somPortraet(t: Tegnkort, side = 24): Tegnkort {
  const b = Math.max(...t.raekker.map((r) => r.length));
  const venstre = Math.floor((side - b) / 2);
  const top = side - t.raekker.length;
  const tom = '.'.repeat(side);
  const raekker = [
    ...Array.from({ length: top }, () => tom),
    ...t.raekker.map((r) => ('.'.repeat(venstre) + r.padEnd(b, '.')).padEnd(side, '.')),
  ];
  return { raekker, palet: t.palet };
}

/**
 * Halvsangen (kapitel 3, sidemission): en lille, bleg fugl på en knækket gren. Den synger kun halve toner.
 * Tegnet til Pennedal 9. november 2026. Ingen bogstaver.
 */
export const HALVFUGL: Tegnkort = {
  raekker: [
    '.....KKK........',
    '....KWWWK.......',
    '...KWWEWWK......',
    '...KWWWWWKOO....',
    '..KWWWWWWWKO....',
    '.KWwWWWWWWK.....',
    '.KWwwWWWWWK.....',
    '..KWwwwWWK......',
    '...KKWWKK.......',
    '.....OKO........',
    'TTTTTTTTTTTTT...',
    'tTTtTTTTtTTTt...',
    '..........t.....',
  ],
  palet: { K: '#3a3560', W: '#f4efe0', w: '#b9bfcf', E: '#1b1b24', O: '#e5c03a', T: '#8a7656', t: '#5d5243' },
};

/** Et hvidt blad med et ord, der er ved at blive visket ud. Streger, ingen bogstaver. */
export const ORDBLAD: Tegnkort = {
  raekker: ['....KK..', '..KKWWK.', '.KWWWWWK', 'KWdWdWWK', 'KWWdWdWK', '.KWWWWK.', '..KKKK..', '...K....'],
  palet: { K: '#8a8a8a', W: '#f4efe0', d: '#b9bfcf' },
};

/** En port af hvide grene: indgangen til den lange hvide sti, og målet på banerne i Viskeskoven. */
export const GRENPORT: Tegnkort = {
  raekker: [
    '..KKKKKKKKKKKK..',
    '.KWWwWWWWWwWWWK.',
    'KWWK........KWWK',
    'KWK..........KWK',
    'KWK..........KwK',
    'KwK..........KWK',
    'KWK..........KWK',
    'KWK..........KWK',
    'KWK..........KwK',
    'KwK..........KWK',
    'KWK..........KWK',
    'KWK..........KWK',
    'KWK..........KWK',
    'KKK..........KKK',
  ],
  palet: { K: '#6a6487', W: '#f4efe0', w: '#b9bfcf' },
};

/** Ordstenen på banen: en bleg sten med en tom side. Lyser, indtil ordet er skrevet tilbage. */
export function ordsten(loest: boolean): Tegnkort {
  return {
    raekker: [
      '....KKKKKK....',
      '...KGGGGGGK...',
      '..KGPPPPPPGK..',
      '..KGPddddPGK..',
      '..KGPPPPPPGK..',
      '.KGGPddPPPGGK.',
      '.KGGPPPPPPGGK.',
      'KGgGGGGGGGGgGK',
      'KGggGGGGGGggGK',
      'KKKKKKKKKKKKKK',
    ],
    palet: { K: '#5b5663', G: '#b9bfcf', g: '#a7aab8', P: loest ? '#f4efe0' : '#ffe9a8', d: loest ? '#2a2f48' : '#e5c03a' },
  };
}
