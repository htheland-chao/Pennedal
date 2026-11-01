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
