/**
 * Fælles for minderne: billedets mål og en enkelt pixel-/feltfunktion.
 * Former, lys og vignet står i kit.ts, tingene (hæftet, Skyggen, hænder, lamper) i ting.ts
 * og baggrundene i rum.ts (tegnet om 26. november 2026).
 */
import { lerred } from '../lerred';

export const B = 320;
export const H = 180;

export type Farve = string;

// Minderne tegnes pixel for pixel. Det går meget hurtigere i en buffer end med fillRect for hver pixel,
// så et minde fra nytMinde() tegnes i en buffer, der lægges på lerredet i faerdig().
const buffere = new WeakMap<CanvasRenderingContext2D, ImageData>();
const rgb = new Map<string, [number, number, number]>();

export function nytMinde() {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  buffere.set(g, g.createImageData(B, H));
  return { c, g };
}

export function faerdig(c: HTMLCanvasElement, g: CanvasRenderingContext2D): HTMLCanvasElement {
  const d = buffere.get(g);
  if (d) g.putImageData(d, 0, 0);
  return c;
}

/** Fylder et felt med en farve (#rrggbb i en buffer, alt andet med fillRect). */
export function felt(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: Farve) {
  const d = buffere.get(g);
  if (!d || f.length !== 7) {
    g.fillStyle = f;
    g.fillRect(x, y, w, h);
    return;
  }
  let c = rgb.get(f);
  if (!c) rgb.set(f, (c = [parseInt(f.slice(1, 3), 16), parseInt(f.slice(3, 5), 16), parseInt(f.slice(5, 7), 16)]));
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(B, Math.round(x + w));
  const y1 = Math.min(H, Math.round(y + h));
  const p = d.data;
  for (let py = y0; py < y1; py++)
    for (let px = x0; px < x1; px++) {
      const i = (py * B + px) * 4;
      p[i] = c[0];
      p[i + 1] = c[1];
      p[i + 2] = c[2];
      p[i + 3] = 255;
    }
}
