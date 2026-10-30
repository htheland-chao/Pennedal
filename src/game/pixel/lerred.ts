/** Tegner pixelgrafik på canvas: figurer, jorden under et kort og lys. Kræver en browser. */
import { erSti, erVand, FELT, type Kort } from '../kort';
import type { Tegnkort } from './sprites';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

export function hash(x: number, y: number): number {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const hx = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

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

const GRAES = ['#3d7a57', '#468a60', '#356c4d', '#4f9467'].map(hx);
const SKOV = ['#2f6448', '#24503a', '#2a5a40'].map(hx);
const STRAA = hx('#5aa572');
const STI = { f: hx('#c4ab7c'), m: hx('#a99068'), k: hx('#8a7656'), l: hx('#e0c995') };
const VAND = { a: hx('#203a6b'), b: hx('#28467c'), krus: hx('#4f6fa8'), bred: hx('#3a2a20') };
const MAANER = ['#f3ead2', '#f0c45a', '#c9dcf2'].map(hx);
const MAANE_R = [5, 3, 4];

/** Jorden under hele kortet: græs, skovbund og sti. Tegnes én gang pr. sted. */
export function tegnGrund(kort: Kort): HTMLCanvasElement {
  const W = kort.bredde * FELT;
  const H = kort.hoejde * FELT;
  const c = lerred(W, H);
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const p = img.data;
  const sti = (x: number, y: number) => erSti(kort.tegn(x, y));
  for (let ty = 0; ty < kort.hoejde; ty++)
    for (let tx = 0; tx < kort.bredde; tx++) {
      const c0 = kort.tegn(tx, ty);
      const skov = c0 === '#';
      for (let py = 0; py < FELT; py++)
        for (let px = 0; px < FELT; px++) {
          const X = tx * FELT + px;
          const Y = ty * FELT + py;
          const r = hash(X, Y);
          let col = skov ? SKOV[r < 0.7 ? 0 : r < 0.85 ? 1 : 2] : GRAES[r < 0.72 ? 0 : Math.min(3, Math.floor(((r - 0.72) / 0.28) * 3) + 1)];
          if (!skov && (hash(X, Y + 1) > 0.985 || hash(X, Y + 2) > 0.985)) col = STRAA;
          if (sti(tx, ty)) {
            const u = px - 7.5;
            const v = py - 7.5;
            const inde = (w: number) =>
              (Math.abs(u) < w && Math.abs(v) < w) ||
              (Math.abs(u) < w && ((v < 0 && sti(tx, ty - 1)) || (v > 0 && sti(tx, ty + 1)))) ||
              (Math.abs(v) < w && ((u < 0 && sti(tx - 1, ty)) || (u > 0 && sti(tx + 1, ty))));
            if (inde(5)) col = r < 0.06 ? STI.k : r > 0.95 ? STI.l : r < 0.16 ? STI.m : STI.f;
            else if (inde(6.2)) col = STI.k;
          }
          const o = (Y * W + X) * 4;
          p[o] = col[0];
          p[o + 1] = col[1];
          p[o + 2] = col[2];
          p[o + 3] = 255;
        }
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Vandet i tre billeder, der skifter, så det ser ud til at bevæge sig. Månerne spejler sig i felterne med M. */
export function tegnVand(kort: Kort, ramme: number): HTMLCanvasElement {
  const W = kort.bredde * FELT;
  const H = kort.hoejde * FELT;
  const c = lerred(W, H);
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const q = img.data;
  const vand = (x: number, y: number) => erVand(kort.tegn(x, y));
  const maaner: { x: number; y: number; r: number; c: [number, number, number] }[] = [];
  for (let ty = 0; ty < kort.hoejde; ty++)
    for (let tx = 0; tx < kort.bredde; tx++)
      if (kort.tegn(tx, ty) === 'M' && maaner.length < 3) {
        const i = maaner.length;
        maaner.push({ x: tx * FELT + 8 + (i - 1) * 3, y: ty * FELT + 8 + (i % 2) * 3, r: MAANE_R[i], c: MAANER[i] });
      }
  for (let ty = 0; ty < kort.hoejde; ty++)
    for (let tx = 0; tx < kort.bredde; tx++) {
      if (!vand(tx, ty)) continue;
      for (let py = 0; py < FELT; py++)
        for (let px = 0; px < FELT; px++) {
          const X = tx * FELT + px;
          const Y = ty * FELT + py;
          let col = hash(X >> 2, Y >> 2) < 0.5 ? VAND.a : VAND.b;
          if (hash(Math.floor((X + ramme * 3) / 6), Y) > 0.93) col = VAND.krus;
          for (const m of maaner) {
            const d = Math.hypot(X + 0.5 - m.x, (Y + 0.5 - m.y) * 1.6);
            if (d <= m.r && !(hash(Math.floor((X + ramme * 2) / 3), Y) > 0.8 && (Y + ramme) % 3 === 0)) col = m.c;
          }
          const kant =
            (py === 0 && !vand(tx, ty - 1)) ||
            (py === FELT - 1 && !vand(tx, ty + 1)) ||
            (px === 0 && !vand(tx - 1, ty)) ||
            (px === FELT - 1 && !vand(tx + 1, ty));
          if (kant) col = VAND.bred;
          const o = (Y * W + X) * 4;
          q[o] = col[0];
          q[o + 1] = col[1];
          q[o + 2] = col[2];
          q[o + 3] = 255;
        }
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Nattens grundtone. Lyset ganges på billedet, så alt bliver blåligt undtagen der, hvor noget lyser. */
export function grundtone(mindreUhygge: boolean): [number, number, number] {
  return mindreUhygge ? [205, 210, 238] : [140, 148, 217];
}
const VARMT: [number, number, number] = [255, 250, 219];

/** En lyskegle i 4 trin med Bayer-dither. Gennemsigtig uden for keglen. */
export function lavLys(r: number, styrke: number, tone: [number, number, number]): HTMLCanvasElement {
  const c = lerred(r * 2, r * 2);
  const g = c.getContext('2d')!;
  const img = g.createImageData(r * 2, r * 2);
  const p = img.data;
  for (let y = 0; y < r * 2; y++)
    for (let x = 0; x < r * 2; x++) {
      const d = Math.hypot(x + 0.5 - r, (y + 0.5 - r) * 1.25);
      let s = Math.pow(Math.max(0, 1 - d / r), 1.1) * styrke;
      s = Math.floor(s * 4 + bay(x, y)) / 4;
      if (s <= 0) continue;
      const o = (y * r * 2 + x) * 4;
      for (let k = 0; k < 3; k++) p[o + k] = tone[k] + s * (VARMT[k] - tone[k]);
      p[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Lille skygge under figurer. */
export function lavSkygge(b: number): HTMLCanvasElement {
  const c = lerred(b, 4);
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(20, 30, 25, 0.45)';
  g.fillRect(1, 0, b - 2, 1);
  g.fillRect(0, 1, b, 2);
  g.fillRect(1, 3, b - 2, 1);
  return c;
}
