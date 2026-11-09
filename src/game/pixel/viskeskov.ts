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
  palet: { K: '#3a3550', M: '#d8c8e0', m: '#f6f2fa', S: '#efe6d8', P: '#e8a8a8', E: '#1b1b24', o: '#9a5a6a', B: '#7d9cc8', b: '#5f7ead' },
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
  palet: { K: '#6a6488', W: '#f3f0fa', E: '#3a3550', o: '#2b2433', T: '#ffffff' },
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
  palet: { K: '#4a4a5c', G: '#a8a8b8', g: '#8a8a9c', F: '#d6d6e2', H: '#c4c4d2', E: '#1b1b24' },
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
  palet: { K: '#3a3550', W: '#f4f1ea', w: '#cfc8da', E: '#1b1b24', O: '#e5b84c', T: '#8a7656', t: '#6b5a40' },
};

/** Et hvidt blad med et ord, der er ved at blive visket ud. Streger, ingen bogstaver. */
export const ORDBLAD: Tegnkort = {
  raekker: ['....KK..', '..KKWWK.', '.KWWWWWK', 'KWdWdWWK', 'KWWdWdWK', '.KWWWWK.', '..KKKK..', '...K....'],
  palet: { K: '#8a8aa0', W: '#ffffff', d: '#b9bfcf' },
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
  palet: { K: '#6a6488', W: '#f3f0fa', w: '#cfc8da' },
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
    palet: { K: '#5a5a6e', G: '#c4c4d2', g: '#a8a8b8', P: loest ? '#f4efe0' : '#ffe9a8', d: loest ? '#2a2f48' : '#e5b84c' },
  };
}
