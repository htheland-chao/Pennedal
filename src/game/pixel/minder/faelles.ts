/**
 * Fælles for minderne: billedets mål, falmede farver og hånden med blyanten.
 * Delt ud af minder.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { tegnkortTilLerred } from '../lerred';
import type { Tegnkort } from '../sprites';

export const B = 320;
export const H = 180;

export type Farve = string;
export function felt(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: Farve) {
  g.fillStyle = f;
  g.fillRect(x, y, w, h);
}

/** Varm og falmet, som et gammelt fotografi. */
export const P = {
  lys: '#efe0bf',
  mellem: '#dcc59a',
  moerk: '#bf9f74',
  skygge: '#9a7b58',
  kontur: '#6e5440',
  hud: '#e3b991',
  hudLys: '#f1d2b0',
  hudSkygge: '#c2916c',
  knoer: '#f8eadb',
  papir: '#f6ecd6',
  papirSkygge: '#e2d3b2',
  linje: '#b9a78a',
  roed: '#c25446',
  blaek: '#3e3a5c',
};

/**
 * En knyttet hånd om en blyant, set forfra: fire fingre lagt om blyanten, tommelfingeren hen over.
 * Knoerne (W) er hvide, fordi hånden holder for hårdt.
 */
const HAAND: Tegnkort = {
  raekker: [
    '..........kyyk..........',
    '..........kyYk..........',
    '..........kyYk..........',
    '..........kyYk..........',
    '....kkkkkkkyYkkkkk......',
    '...kWhhhhhhhhhhhhhk.....',
    '..kWWhhhhhhhhttttttk....',
    '..kWhhhhhhhhtTTTTTTtk...',
    '..kkkkkkkkkktTTTTTTTtk..',
    '..kWhhhhhhhhhttttttttkaa',
    '..kWWhhhhhhhhhhhhhhhskaa',
    '..kkkkkkkkkkkkkkkkkkkkaa',
    '...kWhhhhhhhhhhhhhhskaaa',
    '...kWWhhhhhhhhhhhhsskaaa',
    '...kkkkkkkkkkkkkkkkkkaaa',
    '....kWhhhhhhhhhhhhskaaaa',
    '.....kkkkkkkkkkkkkkaaaaa',
    '..........kyYk.....aaaaa',
    '..........kggk..........',
    '..........kggk..........',
    '...........kk...........',
  ],
  palet: { k: '#6e5440', h: '#e3b991', s: '#c2916c', W: '#f8eadb', t: '#d9a87f', T: '#efcaa6', y: '#e0a93c', Y: '#f0c45a', g: '#e8c89a', a: '#8796ad' },
};

/** Tegner hånden med blyanten forstørret, med spidsen mod papiret i (x, y). */
export function haandMedBlyant(g: CanvasRenderingContext2D, x: number, y: number, skala = 3) {
  const sprite = tegnkortTilLerred(HAAND);
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, x - 11.5 * skala, y - sprite.height * skala, sprite.width * skala, sprite.height * skala);
}
