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
  palet: { K: '#222222', Y: '#e5c03a', H: '#c98d63', S: '#eec1a0', E: '#222222', m: '#c0503e', R: '#7b4bb3', r: '#603979', s: '#c9dcf2', y: '#8a7656' },
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
  palet: { K: '#1b1b24', B: '#4a3426', S: '#e0a982', E: '#1b1b24', m: '#7a4e33', T: '#8a7656', t: '#5d5243', G: '#c9dcf2' },
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
  palet: { K: '#222222', F: '#468a60', f: '#3d7a57', W: '#f4efe0', E: '#222222', T: '#f4efe0', t: '#222222', P: '#c0503e' },
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
  palet: { K: '#2a2f48', M: '#b9bfcf', m: '#8a8a8a', k: '#1a1e36', B: '#c9dcf2', b: '#c9dcf2', Y: '#c0503e' },
};

/** Et spor fra Kommissær Lups sag: et lille fodaftryk af blæk. */
export const SPOR: Tegnkort = {
  raekker: ['.KK..KK.', 'KbbKKbbK', '.KK..KK.', '..KKKK..', '.KbbbbK.', '.KbbbbK.', '..KbbK..', '...KK...'],
  palet: { K: '#3a3560', b: '#603979' },
};
