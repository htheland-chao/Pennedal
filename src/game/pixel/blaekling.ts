import type { Tegnkort } from './sprites';

/**
 * Blæklingen (16. november 2026): en lille klat blæk, som Klatten taber, når han har travlt.
 * Spillets første kamp er mod den (kapitel 1). Lille, rund og mere bange end farlig. Ingen bogstaver.
 */
export const BLAEKLING: Tegnkort = {
  raekker: [
    '....KKKKK.....',
    '..KKbbbbbKK...',
    '.KbbbBBbbbbK..',
    '.KbbBWbbbbbK..',
    'KbbbbbbbbbbbK.',
    'KbWWbbbbWWbbK.',
    'KbWEbbbbWEbbK.',
    'KbbbbbbbbbbbK.',
    'KbbbbbmmbbbbK.',
    '.KbbbbbbbbbK..',
    'KbKbbbbbbKbbK.',
    '.K.KKbbKK.KK..',
  ],
  palet: { K: '#0b0a14', b: '#1f2a44', B: '#33416a', W: '#e8eef8', E: '#0b0a14', m: '#0b0a14' },
};
