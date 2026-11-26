/**
 * Himmel med ordnet dither (26. november 2026): en lodret overgang mellem paletfarver uden bløde overgange,
 * så himlene også kun bruger masterpalettens farver. Tegnes med ImageData, så brede baner går hurtigt.
 */
import { bay } from './grundlag';

const rgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** Fylder hele lerredet med en himmel fra den første farve øverst til den sidste nederst. */
export function ditherHimmel(g: CanvasRenderingContext2D, bredde: number, hoejde: number, farver: string[]) {
  const f = farver.map(rgb);
  const d = g.createImageData(bredde, hoejde);
  const p = d.data;
  for (let y = 0; y < hoejde; y++) {
    const t = (y / Math.max(1, hoejde - 1)) * (f.length - 1);
    const a = Math.floor(t);
    for (let x = 0; x < bredde; x++) {
      const c = f[Math.min(f.length - 1, a + (t - a > bay(x, y) ? 1 : 0))];
      const i = (y * bredde + x) * 4;
      p[i] = c[0];
      p[i + 1] = c[1];
      p[i + 2] = c[2];
      p[i + 3] = 255;
    }
  }
  g.putImageData(d, 0, 0);
}
