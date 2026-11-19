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
  palet: { K: '#2a2f48', G: '#8a8a8a', g: '#716b60', m: '#468a60', W: '#f4efe0', E: '#1b1b24', n: '#7a7468' },
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
  palet: { K: '#2a2f48', b: '#698fc1', B: '#a7aab8', c: '#c9dcf2', E: '#f4efe0', o: '#1a1e36' },
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
  palet: { K: '#2a2f48', G: '#a7aab8', g: '#b9bfcf', d: '#4f4a57', h: '#f4efe0' },
};

/** Gran med sne: papirtræets form med mørkegrønne nåle og sne på den side, lyset kommer fra. */
export function granMedSne(h: number): Tegnkort {
  const t = papirtrae(h);
  return { raekker: t.raekker, palet: { ...t.palet, K: '#2a2f48', L: '#f4efe0', S: '#2a5a40', l: '#c9dcf2' } };
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
    palet: { K: '#2a2f48', G: '#8a8a8a', g: '#716b60', P: loest ? '#c9dcf2' : '#ffe9a8', d: loest ? '#3a3560' : '#e5c03a' },
  };
}
