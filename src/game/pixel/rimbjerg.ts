/**
 * Rimbjerget (kapitel 4, 9. november 2026): trolden Rimfod, ekkoet, bjergets ældste digt, graner med sne og ekkosten.
 * Tegnet til Pennedal. Ingen bogstaver: digtets linjer er streger.
 */
import type { Tegnkort } from './sprites';
import { papirtrae } from './sprites';

/** Rimfod: en stor, træt trold af sten med mos på hovedet og triste øjne. */
export const RIMFOD: Tegnkort = {
  raekker: [
    '........KKKKKK........',
    '......KKggggggKK......',
    '.....KgGGGGGGGGgK.....',
    '....KgGmGGGGGGmGgK....',
    '...KGGGGGGGGGGGGGGK...',
    '...KGGGGGGGGGGGGGGK...',
    '...KGGWEGGGGGGWEGGK...',
    '...KGGWWGGGGGGWWGGK...',
    '...KGGGGGGnnGGGGGGK...',
    '...KGGGGGnnnnGGGGGK...',
    '...KGGGGGGGGGGGGGGK...',
    '...KGGGKKKKKKKKGGGK...',
    '....KGGGGGGGGGGGGK....',
    '...KKgGGGGGGGGGGgKK...',
    '..KGGKgGGGGGGGGgKGGK..',
    '.KGGGKgGGGmmGGGgKGGGK.',
    '.KGGKKgGGGGGGGGgKKGGK.',
    '.KGK.KgGGGGGGGGgK.KGK.',
    '.KKK.KgGGGGGGGGgK.KKK.',
    '.....KgGGGKKGGGgK.....',
    '.....KgGGK..KGGgK.....',
    '....KKGGGK..KGGGKK....',
    '....KGGGGK..KGGGGK....',
    '....KKKKKK..KKKKKK....',
  ],
  palet: { K: '#2a2c38', G: '#8d8a86', g: '#6c6a68', m: '#5f8a54', W: '#f4f1ea', E: '#1b1b24', n: '#75716c' },
};

/** Ekkoet: en hul ring af lyd med to øjne og en rund mund. Det, der er indeni, er tomt. */
export const EKKO: Tegnkort = {
  raekker: [
    '......KKKKKK......',
    '....KKbbbbbbKK....',
    '...KbbBBBBBBbbK...',
    '..KbBBccccccBBbK..',
    '.KbBBc......cBBbK.',
    '.KbBc.EE..EE.cBbK.',
    'KbBc..EE..EE..cBbK',
    'KbBc..........cBbK',
    'KbBc....KK....cBbK',
    'KbBc...KooK...cBbK',
    'KbBc...KooK...cBbK',
    '.KbBc...KK...cBbK.',
    '.KbBBc......cBBbK.',
    '..KbBBccccccBBbK..',
    '...KbbBBBBBBbbK...',
    '....KKbbbbbbKK....',
    '.....K.K..K.K.....',
    '......K....K......',
  ],
  palet: { K: '#2c3350', b: '#6f86b0', B: '#9db4d8', c: '#cfe0f4', E: '#f4f8ff', o: '#1b1f33' },
};

/** Bjergets ældste digt: en stentavle med linjer og en revne, hvor det sidste vers er brækket af. */
export const DIGTSTEN: Tegnkort = {
  raekker: [
    '...KKKKKKKKKK...',
    '..KGGGGGGGGGGK..',
    '.KGgggggggggGGK.',
    '.KGgddddd.ddgGK.',
    '.KGgggggggggGGK.',
    '.KGgdddd.dddgGK.',
    '.KGgggggggggGGK.',
    '.KGgddd.ddddgGK.',
    '.KGgggggggggGGK.',
    '.KGgggggggggGGK.',
    '.KGggggKgggggGK.',
    '.KGgggKKKggggGK.',
    '.KGgggggKKgggGK.',
    '.KGggggggKgggGK.',
    '.KGGGGGGGGGGGGK.',
    'KKKKKKKKKKKKKKKK',
    'KhhhhhhhhhhhhhhK',
    'KKKKKKKKKKKKKKKK',
  ],
  palet: { K: '#2a2c38', G: '#a9a6a1', g: '#c9c6c0', d: '#4a4a58', h: '#e8eef6' },
};

/** Gran med sne: papirtræets form med mørkegrønne nåle og sne på den side, lyset kommer fra. */
export function granMedSne(h: number): Tegnkort {
  const t = papirtrae(h);
  return { raekker: t.raekker, palet: { ...t.palet, K: '#1f2f33', L: '#eef3f8', S: '#2f5d50', l: '#cdd7e3' } };
}

/** Ekkostenen på banen: en sten med en spiral af lyd. Lyser, indtil eleven har fundet rimet. */
export function ekkosten(loest: boolean): Tegnkort {
  return {
    raekker: [
      '....KKKKKK....',
      '...KGGGGGGK...',
      '..KGGPPPPGGK..',
      '..KGPPddPPGK..',
      '..KGPdPPdPGK..',
      '.KGGPdPdPPGGK.',
      '.KGGPPddPPGGK.',
      'KGgGGGGGGGGgGK',
      'KGggGGGGGGggGK',
      'KKKKKKKKKKKKKK',
    ],
    palet: { K: '#2a2c38', G: '#8d8a86', g: '#6c6a68', P: loest ? '#cfe0f4' : '#ffe9a8', d: loest ? '#2c3350' : '#e5b84c' },
  };
}
