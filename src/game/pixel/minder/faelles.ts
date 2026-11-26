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
  lys: '#f3ead2',
  mellem: '#e0c995',
  moerk: '#c4ab7c',
  skygge: '#8a7656',
  kontur: '#7a4e33',
  hud: '#eec1a0',
  hudLys: '#f6d7c3',
  hudSkygge: '#c98d63',
  knoer: '#f4efe0',
  papir: '#f4efe0',
  papirSkygge: '#d9d2bd',
  linje: '#c4ab7c',
  roed: '#c0503e',
  blaek: '#3a3560',
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
  palet: { k: '#7a4e33', h: '#eec1a0', s: '#c98d63', W: '#f4efe0', t: '#e0a982', T: '#f6d7c3', y: '#d9b56f', Y: '#f0c45a', g: '#e0c995', a: '#8a8a8a' },
};

/** Tegner hånden med blyanten forstørret, med spidsen mod papiret i (x, y). */
export function haandMedBlyant(g: CanvasRenderingContext2D, x: number, y: number, skala = 3) {
  const sprite = tegnkortTilLerred(HAAND);
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, x - 11.5 * skala, y - sprite.height * skala, sprite.width * skala, sprite.height * skala);
}
