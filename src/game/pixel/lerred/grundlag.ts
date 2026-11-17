/**
 * Grundlaget for al pixelgrafik: et tomt lerred, et tegnkort som billede, tilfældige tal og Bayer-dither.
 * Delt ud af lerred.ts 16. november 2026.
 */
import type { Tegnkort } from '../sprites';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);
export const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

/** Lysstyrke 0-1 rundet til 4 trin med Bayer-dither, så der ikke er bløde overgange. */
export const lysTrin = (s: number, x: number, y: number) => Math.floor(s * 4 + bay(x, y)) / 4;

export function hash(x: number, y: number): number {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export const hx = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

export function lerred(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function tegnkortTilLerred(t: Tegnkort): HTMLCanvasElement {
  const w = Math.max(...t.raekker.map((r) => r.length));
  const c = lerred(w, t.raekker.length);
  const g = c.getContext('2d')!;
  t.raekker.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const k = r[x];
      if (k === '.') continue;
      g.fillStyle = t.palet[k];
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
}
