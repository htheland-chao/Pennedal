/**
 * Fin hovedperson (13. november 2026): hovedpersonen tegnes med dobbelt så mange pixel (32 x 48), men fylder
 * det samme i verden. Billedet laves af den almindelige figur (16 x 24), så alle valg i avatardesigneren virker:
 * 1. Scale2x gør skrå kanter blødere uden at gøre billedet uskarpt.
 * 2. Omridset bliver tyndt (én fin pixel), og den inderste halvdel bliver en mørk kant af stoffet.
 * 3. Lys fra oven til venstre: en lys kant øverst og til venstre, skygge nederst og til højre.
 * Kun brugt med fin grafik. Hurtig grafik bruger den almindelige figur.
 */
import type { Tegnkort } from './sprites';
import { moerkere } from './sprites';

const TOM = '.';

function lysere(hex: string, faktor = 0.22): string {
  const n = parseInt(hex.slice(1), 16);
  const k = (v: number) => Math.min(255, Math.round(v + (255 - v) * faktor));
  return `#${((k((n >> 16) & 255) << 16) | (k((n >> 8) & 255) << 8) | k(n & 255)).toString(16).padStart(6, '0')}`;
}

/** Scale2x (EPX): hver pixel bliver fire, og hjørnerne følger skrå kanter. */
export function scale2x(g: string[][]): string[][] {
  const h = g.length;
  const b = g[0]?.length ?? 0;
  const p = (x: number, y: number) => (y >= 0 && y < h && x >= 0 && x < b ? g[y][x] : TOM);
  const ud = Array.from({ length: h * 2 }, () => Array<string>(b * 2).fill(TOM));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < b; x++) {
      const P = g[y][x];
      const A = p(x, y - 1);
      const B = p(x + 1, y);
      const C = p(x - 1, y);
      const D = p(x, y + 1);
      let e1 = P;
      let e2 = P;
      let e3 = P;
      let e4 = P;
      if (C === A && C !== D && A !== B) e1 = A;
      if (A === B && A !== C && B !== D) e2 = B;
      if (D === C && D !== B && C !== A) e3 = C;
      if (B === D && B !== A && D !== C) e4 = D;
      ud[y * 2][x * 2] = e1;
      ud[y * 2][x * 2 + 1] = e2;
      ud[y * 2 + 1][x * 2] = e3;
      ud[y * 2 + 1][x * 2 + 1] = e4;
    }
  return ud;
}

/**
 * Fin udgave af en figur. omrids er omridsets bogstav. smaa er bogstaver, der ikke skal skygges (øjne, briller).
 */
export function finFigur(kort: Tegnkort, { omrids = 'K', smaa = 'EWGLm' }: { omrids?: string; smaa?: string } = {}): Tegnkort {
  const g0 = kort.raekker.map((r) => [...r]);
  const g = scale2x(g0);
  const h = g.length;
  const b = g[0].length;
  const at = (x: number, y: number) => (y >= 0 && y < h && x >= 0 && x < b ? g[y][x] : TOM);
  const palet: Record<string, string> = { ...kort.palet };
  const ledige = [...'0123456789!#$%&*+=?@^~<>;:'].filter((c) => !(c in palet));
  const variant = new Map<string, string>();
  const nyFarve = (farve: string) => {
    if (!variant.has(farve)) {
      const c = ledige.shift();
      if (!c) return null;
      palet[c] = farve;
      variant.set(farve, c);
    }
    return variant.get(farve)!;
  };
  const ud = g.map((r) => [...r]);
  const erKant = (c: string) => c === TOM || c === omrids;

  // 2. Tyndt omrids: en omridspixel uden tom nabo (8 retninger) ligger indenfor. Den får stoffets mørke kant.
  for (let y = 0; y < h; y++)
    for (let x = 0; x < b; x++) {
      if (g[y][x] !== omrids) continue;
      let tomNabo = false;
      for (let dy = -1; dy <= 1 && !tomNabo; dy++) for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) === TOM) tomNabo = true;
      if (tomNabo) continue;
      // Kun den yderste omridslinje gøres tynd. Omrids inde i figuren (fx mellem benene) står.
      const ox = x >> 1;
      const oy = y >> 1;
      const p0 = (xx: number, yy: number) => g0[yy]?.[xx] ?? TOM;
      if (![p0(ox - 1, oy), p0(ox + 1, oy), p0(ox, oy - 1), p0(ox, oy + 1)].includes(TOM)) continue;
      const stof = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].find((c) => !erKant(c) && !smaa.includes(c));
      if (!stof) continue;
      const c = nyFarve(moerkere(palet[stof], 0.62));
      if (c) ud[y][x] = c;
    }

  // 3. Lys fra oven til venstre.
  for (let y = 0; y < h; y++)
    for (let x = 0; x < b; x++) {
      const c = g[y][x];
      if (erKant(c) || smaa.includes(c) || !kort.palet[c]) continue;
      const hoejre = erKant(at(x + 1, y));
      const under = erKant(at(x, y + 1));
      const venstre = erKant(at(x - 1, y));
      const over = erKant(at(x, y - 1));
      if (hoejre || under) {
        const n = nyFarve(moerkere(kort.palet[c], 0.82));
        if (n) ud[y][x] = n;
      } else if (venstre || over) {
        const n = nyFarve(lysere(kort.palet[c]));
        if (n) ud[y][x] = n;
      }
    }
  return { raekker: ud.map((r) => r.join('')), palet };
}
