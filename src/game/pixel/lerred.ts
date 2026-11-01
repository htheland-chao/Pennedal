/** Tegner pixelgrafik på canvas: figurer, jorden under et kort og lys. Kræver en browser. */
import { erBrosten, erSti, erVand, FELT, type Kort } from '../kort';
import type { Tegnkort } from './sprites';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

/** Lysstyrke 0-1 rundet til 4 trin med Bayer-dither, så der ikke er bløde overgange. */
export const lysTrin = (s: number, x: number, y: number) => Math.floor(s * 4 + bay(x, y)) / 4;

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

const BLOMST = ['#e5c03a', '#f4efe0', '#c0503e', '#7b4bb3', '#e8a0b8'].map(hx);
const BROSTEN = { a: hx('#9c9488'), b: hx('#8a8276'), fuge: hx('#5f5a52'), lys: hx('#b3ab9e') };
const BLAEKPLET = hx('#141629');
const TAGFARVER = [['#b0413e', '#8e3428'], ['#2f7a6b', '#1f5a4e'], ['#2c6fbb', '#1f4f86'], ['#c97a3a', '#a05a28'], ['#7b4bb3', '#5a3488']].map((p) => p.map(hx));
const FACADER = ['#e8dcc0', '#f0d0a0', '#d9e3f0', '#e8c0b0', '#f4efe0'].map(hx);
const BJAELKE = hx('#4a3426');
const RUDE = hx('#2a3a66');
const RUDE_LYS = hx('#9ec3e6');
const DOER = hx('#6b4a2b');
const MURSTEN = { a: hx('#8f8a80'), b: hx('#7f7a70'), fuge: hx('#55514a'), top: hx('#a8a297') };

/** Brosten i små, skæve sten. Med blæk er der en sort plet. */
function brosten(X: number, Y: number, _r: number, blaek: boolean): [number, number, number] {
  if (blaek) return BLAEKPLET;
  const rk = Math.floor(Y / 5);
  const sx = (X + (rk % 2) * 3) % 6;
  if (Y % 5 === 4 || sx === 0) return BROSTEN.fuge;
  if (sx === 1 && Y % 5 === 0) return BROSTEN.lys;
  return hash(Math.floor((X + (rk % 2) * 3) / 6), rk) < 0.5 ? BROSTEN.a : BROSTEN.b;
}

/** Et hus set skråt oppefra: tag på de øverste felter, facade med bjælker, vindue og dør på det nederste. */
function hus(kort: Kort, tx: number, ty: number, px: number, py: number, r: number): [number, number, number] {
  const nr = Math.floor(tx / 3) + ty * 0;
  const facade = kort.tegn(tx, ty + 1) !== 'H';
  if (facade) {
    if (px === 0 || px === FELT - 1 || py === FELT - 1 || py === 0) return BJAELKE;
    const fc = FACADER[Math.floor(hash(nr, 11) * FACADER.length)];
    const vindue = px >= 4 && px <= 11 && py >= 3 && py <= 9;
    const doer = hash(tx, 31) > 0.7 && px >= 5 && px <= 10 && py >= 6;
    if (doer) return px === 5 || px === 10 || py === 6 ? BJAELKE : DOER;
    if (vindue) return px === 4 || px === 11 || py === 3 || py === 9 || px === 7 || py === 6 ? BJAELKE : px < 7 && py < 6 ? RUDE_LYS : RUDE;
    return r < 0.04 ? BJAELKE : fc;
  }
  const [a, b] = TAGFARVER[Math.floor(hash(nr, 5) * TAGFARVER.length)];
  const rk = Math.floor(py / 4);
  if (py % 4 === 3) return b;
  return hash(Math.floor((tx * FELT + px + (rk % 2) * 4) / 8), ty * 4 + rk) < 0.75 ? a : b;
}

/** Bymuren: grå sten i rækker med en lys kant foroven. */
function mur(kort: Kort, tx: number, ty: number, X: number, Y: number, py: number): [number, number, number] {
  if (kort.tegn(tx, ty - 1) !== 'w' && py < 3) return (X >> 2) % 2 === 0 ? MURSTEN.top : MURSTEN.fuge;
  const rk = Math.floor(Y / 6);
  const sx = (X + (rk % 2) * 5) % 10;
  if (Y % 6 === 5 || sx === 0) return MURSTEN.fuge;
  return hash(Math.floor((X + (rk % 2) * 5) / 10), rk) < 0.5 ? MURSTEN.a : MURSTEN.b;
}

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
          if (c0 === ';' && hash(X >> 1, Y >> 1) > 0.93) col = BLOMST[Math.floor(hash(X >> 1, (Y >> 1) + 7) * BLOMST.length)];
          if (erBrosten(c0)) col = brosten(X, Y, r, c0 === ':' && hash(tx * 3, ty * 5 + (X >> 2)) > 0.55 && (px - 8) ** 2 + (py - 8) ** 2 < 20);
          if (c0 === 'H') col = hus(kort, tx, ty, px, py, r);
          if (c0 === 'w') col = mur(kort, tx, ty, X, Y, py);
          if (c0 === 'f') col = brosten(X, Y, r, false);
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

export type Farve = [number, number, number];

/** Nattens grundtone. Lyset ganges på billedet, så alt bliver blåligt undtagen der, hvor noget lyser. */
export function grundtone(mindreUhygge: boolean): Farve {
  return mindreUhygge ? [205, 210, 238] : [140, 148, 217];
}
export const VARMT: Farve = [255, 250, 219];

/**
 * Lyset på et sted. Grundtonen ganges på hele billedet. Hovedpersonens lygte har radius spillerLys (0 = ingen).
 *   nat:    udendørs om natten (Pennedal, floden, fyrtårnet)
 *   morgen: skolebiblioteket med morgensol gennem vinduerne
 *   moerke: kælderen, hvor kun lygten og lyset fra trappen lyser
 */
export type Belysning = 'nat' | 'morgen' | 'moerke' | 'dag';
/** Byen i kapitel 2 ligger i varmt dagslys. Trykkeriet er mørkt som kælderen. */
export function belysning(tema: string): Belysning {
  if (tema === 'bibliotek') return 'morgen';
  if (tema === 'kaelder' || tema === 'trykkeri') return 'moerke';
  if (tema === 'eng' || tema === 'torv' || tema === 'smoeger' || tema === 'viskeskov') return 'dag';
  return 'nat';
}
export function lysOpsaetning(b: Belysning, mindreUhygge: boolean): { tone: Farve; spillerLys: number } {
  if (b === 'morgen') return { tone: [236, 222, 200], spillerLys: 0 };
  if (b === 'dag') return { tone: [255, 248, 232], spillerLys: 0 };
  if (b === 'moerke') return mindreUhygge ? { tone: [150, 148, 184], spillerLys: 80 } : { tone: [64, 62, 96], spillerLys: 70 };
  return { tone: grundtone(mindreUhygge), spillerLys: 76 };
}

/** En lyskegle i 4 trin med Bayer-dither. Gennemsigtig uden for keglen. */
export function lavLys(r: number, styrke: number, tone: Farve, farve: Farve = VARMT): HTMLCanvasElement {
  const c = lerred(r * 2, r * 2);
  const g = c.getContext('2d')!;
  const img = g.createImageData(r * 2, r * 2);
  const p = img.data;
  for (let y = 0; y < r * 2; y++)
    for (let x = 0; x < r * 2; x++) {
      const d = Math.hypot(x + 0.5 - r, (y + 0.5 - r) * 1.25);
      const s = lysTrin(Math.pow(Math.max(0, 1 - d / r), 1.1) * styrke, x, y);
      if (s <= 0) continue;
      const o = (y * r * 2 + x) * 4;
      for (let k = 0; k < 3; k++) p[o + k] = tone[k] + s * (farve[k] - tone[k]);
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

/**
 * Viskeskoven (kapitel 3): farverne er ved at blive visket ud. Gør et billede blegt én gang, når det tegnes.
 * Et CSS-filter på lærredet ville blive regnet ud i hvert billede og koste for meget på en Chromebook (krav 8).
 */
export function blegt(c: HTMLCanvasElement, maengde = 0.6): HTMLCanvasElement {
  const g = c.getContext('2d')!;
  const d = g.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const graa = p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
    const lys = graa * 0.7 + 236 * 0.3;
    for (let k = 0; k < 3; k++) p[i + k] = Math.round(p[i + k] * (1 - maengde) + lys * maengde);
  }
  g.putImageData(d, 0, 0);
  return c;
}
