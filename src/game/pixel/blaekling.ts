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
  palet: { K: '#070912', b: '#2a2f48', B: '#28467c', W: '#f4efe0', E: '#070912', m: '#070912' },
};
