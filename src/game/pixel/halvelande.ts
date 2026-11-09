/**
 * De halve lande (kapitel 7, 9. november 2026): figurerne fra de fire ufærdige genrer.
 * Tegnet til Pennedal. Ingen bogstaver. Originale figurer, ingen lånte.
 */
import type { Tegnkort } from './sprites';

/** Prinsesse Hilde fra eventyret, der mangler sin slutning: en krone, en lang kjole og et sværd, hun selv har fundet. */
export const PRINSESSE: Tegnkort = {
  raekker: [
    '....Y.Y.Y.....',
    '....YYYYY.....',
    '...KHHHHHK....',
    '..KHSSSSSHK...',
    '..KHSESESHK...',
    '..KHSSSSSHK...',
    '...KSSmSSK.s..',
    '..KRRRRRRRK.s.',
    '.KRRrRRRrRRKs.',
    '.KSRRRRRRRSKs.',
    '.KRRRRRRRRRKy.',
    '.KRRrRRRrRRK..',
    'KRRRRRRRRRRRK.',
    'KRRRRRRRRRRRK.',
    'KKKKKKKKKKKKK.',
  ],
  palet: { K: '#2a1f2e', Y: '#e5c03a', H: '#c9773a', S: '#efc49a', E: '#2a1f2e', m: '#b0505a', R: '#7a4bb3', r: '#5a3a8a', s: '#c9d3e4', y: '#8a6a2e' },
};

/** Kommissær Lup fra krimien uden opklaring: lang frakke, hat og en stor lup. */
export const LUP: Tegnkort = {
  raekker: [
    '...KKKKKK......',
    '..KBBBBBBK.....',
    '.KKKKKKKKKK....',
    '...KSSSSK......',
    '...KSESEK......',
    '...KSSSSK......',
    '...KSmmSK..KK..',
    '..KTTTTTTK.KGGK',
    '.KTTtTTtTTKKGGK',
    '.KTTTTTTTTSK.KK',
    '.KTTtTTtTTK.K..',
    '.KTTTTTTTTK....',
    '.KTTTTTTTTK....',
    '..KKK..KKK.....',
  ],
  palet: { K: '#1d1a24', B: '#4a4038', S: '#e0b090', E: '#1d1a24', m: '#7a5040', T: '#8a7a5a', t: '#6a5c44', G: '#bfe0f0' },
};

/** Grumsen fra gyseren uden monster: et lille, lodent monster i hjemmesko, der er blevet bange for mørket. */
export const GRUMSEN: Tegnkort = {
  raekker: [
    '..K.......K...',
    '..KK.....KK...',
    '..KFKKKKKFK...',
    '.KFFFFFFFFFK..',
    '.KFWWFFFWWFK..',
    '.KFWEFFFWEFK..',
    '.KFFFFFFFFFK..',
    '.KFFtTtTtFFK..',
    'KFFFFFFFFFFFK.',
    'KFfFFFFFFFfFK.',
    'KFFFFFFFFFFFK.',
    '.KFFFFFFFFFK..',
    '.KPPK...KPPK..',
    'KPPPPK.KPPPPK.',
  ],
  palet: { K: '#1d2a24', F: '#5a8a6a', f: '#4a7a5a', W: '#f4efe0', E: '#1d2a24', T: '#f4efe0', t: '#1d2a24', P: '#c0503e' },
};

/** Bip fra science fiction-historien: en rund robot med en antenne og et lille skærmansigt. */
export const BIP: Tegnkort = {
  raekker: [
    '......Y.......',
    '......K.......',
    '....KKKKK.....',
    '...KMMMMMK....',
    '..KMkkkkkMK...',
    '..KMkBkBkMK...',
    '..KMkkkkkMK...',
    '..KMkbbbkMK...',
    '...KMMMMMK....',
    '..KKKKKKKKK...',
    '.KMMMMMMMMMK..',
    'KMKMMmMMmMKMK.',
    '.KMMMMMMMMMK..',
    '..KK.....KK...',
  ],
  palet: { K: '#22283a', M: '#b8c4d6', m: '#8a96aa', k: '#1a2a3a', B: '#7af0c8', b: '#7af0c8', Y: '#ff6a5a' },
};

/** Et spor fra Kommissær Lups sag: et lille fodaftryk af blæk. */
export const SPOR: Tegnkort = {
  raekker: ['.KK..KK.', 'KbbKKbbK', '.KK..KK.', '..KKKK..', '.KbbbbK.', '.KbbbbK.', '..KbbK..', '...KK...'],
  palet: { K: '#3a3550', b: '#5a4f8a' },
};
