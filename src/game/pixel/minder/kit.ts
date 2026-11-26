/**
 * Værktøj til minderne (26. november 2026): former med lys fra venstre, lyskegler med dither og vignet.
 * En form er en maske (hvilke pixel hører til) og en kasse, den ligger i. form() giver den omrids,
 * lys kant mod lyset og skygge på den modsatte side, så ting ser runde og faste ud.
 */
import { bay } from '../lerred/grundlag';
import { B, H, felt } from './faelles';

export type Maske = (x: number, y: number) => boolean;
export type Form = { m: Maske; kasse: [number, number, number, number] };
/** Farverne til en form, mørk til lys. glans er valgfri ekstra lys plet. */
export type Toner = { kontur?: string; skygge: string; mid: string; lys: string; glans?: string };

/** Mørkt, varmt omrids, som på gamle tegninger. */
export const OMRIDS = '#3a2a20';

export const ellipse = (cx: number, cy: number, rx: number, ry: number): Form => ({
  m: (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1,
  kasse: [Math.floor(cx - rx), Math.floor(cy - ry), Math.ceil(cx + rx), Math.ceil(cy + ry)],
});

/** En pølse fra (x1, y1) til (x2, y2) med radius r: fingre, arme og blyanter. */
export function kapsel(x1: number, y1: number, x2: number, y2: number, r: number): Form {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  return {
    m: (x, y) => {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
      return (px - x1 - t * dx) ** 2 + (py - y1 - t * dy) ** 2 <= r * r;
    },
    kasse: [Math.floor(Math.min(x1, x2) - r), Math.floor(Math.min(y1, y2) - r), Math.ceil(Math.max(x1, x2) + r), Math.ceil(Math.max(y1, y2) + r)],
  };
}

/** Rektangel med afrundede hjørner (radius r). */
export function firkant(x: number, y: number, w: number, h: number, r = 0): Form {
  return {
    m: (px, py) => {
      if (px < x || py < y || px >= x + w || py >= y + h) return false;
      const cx = Math.min(Math.max(px + 0.5, x + r), x + w - r);
      const cy = Math.min(Math.max(py + 0.5, y + r), y + h - r);
      return (px + 0.5 - cx) ** 2 + (py + 0.5 - cy) ** 2 <= r * r + 0.01;
    },
    kasse: [x, y, x + w, y + h],
  };
}

/** Polygon (fx et skråt hjørne eller en dør på klem). */
export function polygon(pkt: [number, number][]): Form {
  const xs = pkt.map((p) => p[0]);
  const ys = pkt.map((p) => p[1]);
  return {
    m: (x, y) => {
      const px = x + 0.5;
      const py = y + 0.5;
      let inde = false;
      for (let i = 0, j = pkt.length - 1; i < pkt.length; j = i++) {
        const [xi, yi] = pkt[i];
        const [xj, yj] = pkt[j];
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inde = !inde;
      }
      return inde;
    },
    kasse: [Math.floor(Math.min(...xs)), Math.floor(Math.min(...ys)), Math.ceil(Math.max(...xs)), Math.ceil(Math.max(...ys))],
  };
}

export function forening(...f: Form[]): Form {
  return {
    m: (x, y) => f.some((a) => a.m(x, y)),
    kasse: [Math.min(...f.map((a) => a.kasse[0])), Math.min(...f.map((a) => a.kasse[1])), Math.max(...f.map((a) => a.kasse[2])), Math.max(...f.map((a) => a.kasse[3]))],
  };
}

export const minus = (a: Form, b: Form): Form => ({ m: (x, y) => a.m(x, y) && !b.m(x, y), kasse: a.kasse });

function gennem(f: Form, gør: (x: number, y: number) => void) {
  const [x0, y0, x1, y1] = f.kasse;
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(B - 1, x1); x++) if (f.m(x, y)) gør(x, y);
}

/** Tegner en form med omrids, lys kant øverst til venstre og skygge nederst til højre. */
export function form(g: CanvasRenderingContext2D, f: Form, t: Toner, kant = 2) {
  const m = f.m;
  gennem(f, (x, y) => {
    let farve = t.mid;
    if (t.kontur && (!m(x - 1, y) || !m(x + 1, y) || !m(x, y - 1) || !m(x, y + 1))) farve = t.kontur;
    else if (!m(x + kant, y + kant) || !m(x + kant + 1, y)) farve = t.skygge;
    else if (t.glans && !m(x - 2, y - 2) && !m(x - 1, y - 1)) farve = t.glans;
    else if (!m(x - kant, y - kant) || !m(x - kant, y)) farve = t.lys;
    felt(g, x, y, 1, 1, farve);
  });
}

/** Fylder en form med én farve. */
export function fyld(g: CanvasRenderingContext2D, f: Form, farve: string) {
  gennem(f, (x, y) => felt(g, x, y, 1, 1, farve));
}

/**
 * Fylder en form med en trappe af farver, valgt af v(x, y) fra 0 (første) til 1 (sidste), med Bayer-dither
 * mellem trinene. Bruges til lyskegler, vægge og himle.
 */
export function lysfelt(g: CanvasRenderingContext2D, f: Form, farver: string[], v: (x: number, y: number) => number) {
  const n = farver.length - 1;
  gennem(f, (x, y) => {
    const t = Math.max(0, Math.min(1, v(x, y))) * n;
    const a = Math.floor(t);
    felt(g, x, y, 1, 1, farver[Math.min(n, a + (t - a > bay(x, y) ? 1 : 0))]);
  });
}

/** Lys fra en lampe i (cx, cy): 1 ved lampen, 0 ved radius r. */
export const lampelys = (cx: number, cy: number, r: number, fladhed = 1) => (x: number, y: number) =>
  1 - Math.hypot(x - cx, (y - cy) * fladhed) / r;

/** Mørkere hjørner, som på et gammelt fotografi. styrke 0 til 1. */
export function vignet(g: CanvasRenderingContext2D, farve: string, styrke = 0.5) {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot((x - B / 2) / (B / 2), (y - H / 2) / (H / 2)) / Math.SQRT2;
      const v = (d - 0.55) / 0.45;
      if (v > 0 && v * styrke * 1.6 > bay(x, y)) felt(g, x, y, 1, 1, farve);
    }
}

/** Ulæselige ord: korte streger i rækker (ingen bogstaver, krav 1). */
export function ordlinjer(g: CanvasRenderingContext2D, x: number, y: number, w: number, raekker: number, afstand: number, farve: string, frø = 1, sidsteKort = true) {
  for (let r = 0; r < raekker; r++) {
    let px = x;
    const slut = r === raekker - 1 && sidsteKort ? x + w * 0.5 : x + w;
    while (px < slut - 4) {
      const l = Math.min(4 + Math.floor(((Math.sin((r + 1) * 12.9898 + px * 78.233 + frø) * 43758.5453) % 1 + 1) % 1 * 14), slut - px);
      felt(g, px, y + r * afstand, l, 1, farve);
      px += l + 3;
    }
  }
}

/** Træårer: korte, mørkere streger i klynger. */
export function traeaarer(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, farve: string, frø = 3) {
  for (let r = 0; r < h; r += 3) {
    let px = x + ((r * 7 + frø) % 11);
    while (px < x + w) {
      const l = 6 + ((r * 13 + px * 5 + frø) % 19);
      if ((r + px + frø) % 3 !== 0) felt(g, px, y + r, Math.min(l, x + w - px), 1, farve);
      px += l + 8;
    }
  }
}
