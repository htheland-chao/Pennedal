/**
 * Jorden under et kort: græs, skov, sti, brosten, huse, mure, træernes skygger og vandet.
 * Delt ud af lerred.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { hash, hx, lerred } from './grundlag';
import { erBrosten, erSti, erVand, FELT, type Kort } from '../../kort';
import { pyntSkovbund, skovbundFarve } from './skovbund';

const GRAES = ['#3d7a57', '#468a60', '#356c4d', '#4f9467'].map(hx);
const SKOV = ['#2f6448', '#24503a', '#2a5a40'].map(hx);
const STRAA = hx('#5aa572');
const STI = { f: hx('#c4ab7c'), m: hx('#a99068'), k: hx('#8a7656'), l: hx('#e0c995') };
const VAND = { a: hx('#203a6b'), b: hx('#28467c'), krus: hx('#4f6fa8'), bred: hx('#3a2a20') };
/** Blæksøen (kapitel 6): sort, blankt blæk med violette glimt. */
const BLAEKVAND = { a: hx('#0f0e1c'), b: hx('#15132a'), krus: hx('#5a4f8a'), bred: hx('#2a2030') };
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

/** Glat støj 0-1: hash på et gitter med afstanden trin, blødt blandet imellem. Giver bløde, ens kanter hver gang. */
export function glatStoej(x: number, y: number, trin: number, saed = 0): number {
  const gx = Math.floor(x / trin);
  const gy = Math.floor(y / trin);
  const fx = x / trin - gx;
  const fy = y / trin - gy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const h = (a: number, b: number) => hash(a + saed * 101, b - saed * 57);
  const o = h(gx, gy) + (h(gx + 1, gy) - h(gx, gy)) * sx;
  const u = h(gx, gy + 1) + (h(gx + 1, gy + 1) - h(gx, gy + 1)) * sx;
  return o + (u - o) * sy;
}

/** Natur, hvor kanterne må flyde: græs, blomstergræs og skovbund. Huse, mure, sten og vand har skarpe kanter. */
const erNatur = (c: string) => c === ',' || c === ';' || c === '#';

/** Afstand fra et punkt i et stifelt (u, v fra feltets midte) til stiens midterlinje mod nabofelterne. */
function stiAfstand(u: number, v: number, op: boolean, ned: boolean, venstre: boolean, hoejre: boolean): number {
  let d = Math.hypot(u, v);
  if (op && v < 0) d = Math.min(d, Math.abs(u));
  if (ned && v > 0) d = Math.min(d, Math.abs(u));
  if (venstre && u < 0) d = Math.min(d, Math.abs(v));
  if (hoejre && u > 0) d = Math.min(d, Math.abs(v));
  return d;
}

type RGB = [number, number, number];
const STEN = { a: hx('#8f8a80'), b: hx('#6f6a62'), lys: hx('#b3ab9e') };
const TUE = { m: hx('#2f6448'), l: hx('#6fb585') };
const SVAMP = { hat: hx('#c0503e'), prik: hx('#f4efe0'), fod: hx('#e0d6be') };
const KVIST = hx('#6b4a2b');
const MOS = hx('#5a7a4a');

/**
 * Små ting på jorden (Henrik, 9. november 2026): sten, tuer, blomster, svampe og kviste på græsset,
 * mos og revner mellem brostenene. Tegnes én gang ind i jorden, så de koster intet, mens man spiller.
 * Hver ting er et lille stempel. Placeringen kommer fra hash, så den er ens hver gang.
 */
const STEMPLER: { kort: string[]; farver: Record<string, RGB> }[] = [
  // Sten med lys side til venstre.
  { kort: ['.lb.', 'lab', '.bb'], farver: { l: STEN.lys, a: STEN.a, b: STEN.b } },
  { kort: ['la', 'ab'], farver: { l: STEN.lys, a: STEN.a, b: STEN.b } },
  // Græstuer.
  { kort: ['l.l', 'mlm', '.m.'], farver: { l: TUE.l, m: TUE.m } },
  { kort: ['.l..l', 'l.lm.', 'mmlmm'], farver: { l: TUE.l, m: TUE.m } },
  // Svamp.
  { kort: ['.hh.', 'hphh', '.ff.'], farver: { h: SVAMP.hat, p: SVAMP.prik, f: SVAMP.fod } },
  // Kvist.
  { kort: ['k...', '.kk.', '...k'], farver: { k: KVIST } },
];

function stempl(p: Uint8ClampedArray, W: number, H: number, x0: number, y0: number, s: (typeof STEMPLER)[number]) {
  s.kort.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const c = s.farver[r[x]];
      if (!c) continue;
      const X = x0 + x;
      const Y = y0 + y;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const o = (Y * W + X) * 4;
      p[o] = c[0];
      p[o + 1] = c[1];
      p[o + 2] = c[2];
    }
  });
}

/** Mørkere: bruges til skygger. */
function moerkn(p: Uint8ClampedArray, o: number, f: number) {
  p[o] = p[o] * f;
  p[o + 1] = p[o + 1] * f;
  p[o + 2] = p[o + 2] * f;
}

/**
 * Jorden under hele kortet: græs, skovbund, sti, brosten, huse og mure. Tegnes én gang pr. sted.
 * Kanterne mellem græs og skov flyder (feltet aflæses lidt forskudt med glat støj), stien har runde hjørner
 * og en kant, der bølger lidt, og huse og mure kaster en skygge mod højre (lyset kommer fra venstre).
 * Græsset er roligt med lånte strå og småting (se skovbund.ts), undtagen på Rimbjerget (sne), i Halvelande og på
 * Sidste side, hvor bunden selv er tegnet på papir.
 */
export function tegnGrund(kort: Kort, tema = ''): HTMLCanvasElement {
  const nyBund = tema !== 'rimbjerg' && tema !== 'halve' && tema !== 'siden';
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
      const sTi = sti(tx, ty);
      const naboer = sTi ? [sti(tx, ty - 1), sti(tx, ty + 1), sti(tx - 1, ty), sti(tx + 1, ty)] : null;
      for (let py = 0; py < FELT; py++)
        for (let px = 0; px < FELT; px++) {
          const X = tx * FELT + px;
          const Y = ty * FELT + py;
          const r = hash(X, Y);
          // Naturens kanter flyder: læs feltet lidt forskudt.
          let cn = c0;
          if (erNatur(c0)) {
            const wx = X + Math.round((glatStoej(X, Y, 7, 1) - 0.5) * 9);
            const wy = Y + Math.round((glatStoej(X, Y, 7, 2) - 0.5) * 9);
            const cw = kort.tegn(Math.floor(wx / FELT), Math.floor(wy / FELT));
            if (erNatur(cw)) cn = cw;
          }
          const skov = cn === '#';
          let col = skov ? SKOV[r < 0.7 ? 0 : r < 0.85 ? 1 : 2] : GRAES[r < 0.72 ? 0 : Math.min(3, Math.floor(((r - 0.72) / 0.28) * 3) + 1)];
          if (nyBund && erNatur(c0)) col = skovbundFarve(X, Y, skov, glatStoej(X, Y, 12, 3));
          else if (!skov && (hash(X, Y + 1) > 0.985 || hash(X, Y + 2) > 0.985)) col = STRAA;
          // Lys og mørke pletter i græsset, så det ikke er en ensartet flade.
          if (!nyBund && !skov && erNatur(c0)) {
            const pl = glatStoej(X, Y, 12, 3);
            if (pl > 0.72 && r < 0.5) col = GRAES[3];
            else if (pl < 0.25 && r < 0.5) col = GRAES[2];
          }
          if (cn === ';' && hash(X >> 1, Y >> 1) > 0.93) col = BLOMST[Math.floor(hash(X >> 1, (Y >> 1) + 7) * BLOMST.length)];
          if (erBrosten(c0)) col = brosten(X, Y, r, c0 === ':' && hash(tx * 3, ty * 5 + (X >> 2)) > 0.55 && (px - 8) ** 2 + (py - 8) ** 2 < 20);
          if (c0 === 'H') col = hus(kort, tx, ty, px, py, r);
          if (c0 === 'w') col = mur(kort, tx, ty, X, Y, py);
          if (c0 === 'f') col = brosten(X, Y, r, false);
          if (naboer) {
            // Stien: runde hjørner og en kant, der bølger lidt.
            const d = stiAfstand(px - 7.5, py - 7.5, naboer[0], naboer[1], naboer[2], naboer[3]);
            const b = 4.6 + (glatStoej(X, Y, 5, 4) - 0.5) * 3.4;
            if (d < b) col = r < 0.06 ? STI.k : r > 0.95 ? STI.l : r < 0.16 ? STI.m : STI.f;
            else if (d < b + 1.1) col = STI.k;
            else if (d < b + 2 && r < 0.5) col = STI.m;
          }
          const o = (Y * W + X) * 4;
          p[o] = col[0];
          p[o + 1] = col[1];
          p[o + 2] = col[2];
          p[o + 3] = 255;
          // Skygge fra huse og mure mod højre.
          const venstre = kort.tegn(tx - 1, ty);
          if ((venstre === 'H' || venstre === 'w') && c0 !== 'H' && c0 !== 'w') {
            if (px < 3 || (px < 5 && (X + Y) % 2 === 0)) moerkn(p, o, 0.72);
          }
        }
    }

  // Små ting på græsset og mellem brostenene.
  for (let ty = 0; ty < kort.hoejde; ty++)
    for (let tx = 0; tx < kort.bredde; tx++) {
      const c0 = kort.tegn(tx, ty);
      const a = hash(tx * 31 + 5, ty * 17 + 3);
      const b = hash(tx * 13 + 9, ty * 29 + 1);
      if ((c0 === ',' || c0 === ';') && !nyBund) {
        // Højst én ting pr. felt, og ikke i alle felter.
        if (a < 0.6) {
          const i = b < 0.3 ? 2 : b < 0.5 ? 3 : b < 0.72 ? 0 : b < 0.86 ? 1 : b < 0.94 ? 5 : 4;
          stempl(p, W, H, tx * FELT + 2 + Math.floor(hash(tx, ty + 99) * 10), ty * FELT + 2 + Math.floor(hash(tx + 99, ty) * 10), STEMPLER[i]);
        }
      } else if (erBrosten(c0) && a < 0.35) {
        // Mos i fugerne.
        for (let k = 0; k < 6; k++) {
          const X = tx * FELT + Math.floor(hash(tx * 7 + k, ty) * 16);
          const Y = ty * FELT + Math.floor(hash(tx, ty * 7 + k) * 16);
          const o = (Y * W + X) * 4;
          if (p[o] === BROSTEN.fuge[0] && p[o + 1] === BROSTEN.fuge[1]) {
            p[o] = MOS[0];
            p[o + 1] = MOS[1];
            p[o + 2] = MOS[2];
          }
        }
      }
    }
  if (nyBund) pyntSkovbund(p, W, H, kort);
  g.putImageData(img, 0, 0);
  return c;
}

/** Hvor træerne står på kortet. Bruges både til at tegne træerne og til deres skygger. */
export function traePladser(kort: Kort): { x: number; y: number; nr: number }[] {
  const ud: { x: number; y: number; nr: number }[] = [];
  for (let ty = 0; ty < kort.hoejde; ty++)
    for (let tx = 0; tx < kort.bredde; tx++) {
      if (kort.tegn(tx, ty) !== '#') continue;
      const a = hash(tx * 7 + 3, ty * 13 + 1);
      const b = hash(tx * 5 + 1, ty * 3 + 7);
      ud.push({ x: tx * FELT + 8 + (a - 0.5) * 8, y: ty * FELT + 13 + (b - 0.5) * 6, nr: Math.floor(a * 4) });
      if (b > 0.55) ud.push({ x: tx * FELT + 8 + (b - 0.5) * 14, y: ty * FELT + 4 + a * 4, nr: Math.floor(b * 3) });
    }
  return ud;
}

/** Bløde skygger under træerne, skråt mod højre. Midten er mørkest, kanten er ditheret. */
export function tegnTraeskygger(c: HTMLCanvasElement, kort: Kort, bredder: number[]) {
  const g = c.getContext('2d')!;
  const img = g.getImageData(0, 0, c.width, c.height);
  const p = img.data;
  for (const t of traePladser(kort)) {
    const rx = Math.round(bredder[t.nr] * 0.55);
    const ry = Math.max(2, Math.round(rx * 0.45));
    const cx = Math.round(t.x + 3);
    const cy = Math.round(t.y - 1);
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) {
        const d = (x / rx) ** 2 + (y / ry) ** 2;
        if (d > 1) continue;
        const X = cx + x;
        const Y = cy + y;
        if (X < 0 || Y < 0 || X >= c.width || Y >= c.height) continue;
        if (d > 0.6 && (X + Y) % 2 === 1) continue;
        moerkn(p, (Y * c.width + X) * 4, 0.78);
      }
  }
  g.putImageData(img, 0, 0);
}

/** Vandet i tre billeder, der skifter, så det ser ud til at bevæge sig. Månerne spejler sig i felterne med M. */
export function tegnVand(kort: Kort, ramme: number, tema = ''): HTMLCanvasElement {
  const V = tema === 'blaeksoe' ? BLAEKVAND : VAND;
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
          let col = hash(X >> 2, Y >> 2) < 0.5 ? V.a : V.b;
          if (hash(Math.floor((X + ramme * 3) / 6), Y) > 0.93) col = V.krus;
          for (const m of maaner) {
            const d = Math.hypot(X + 0.5 - m.x, (Y + 0.5 - m.y) * 1.6);
            if (d <= m.r && !(hash(Math.floor((X + ramme * 2) / 3), Y) > 0.8 && (Y + ramme) % 3 === 0)) col = m.c;
          }
          const kant =
            (py === 0 && !vand(tx, ty - 1)) ||
            (py === FELT - 1 && !vand(tx, ty + 1)) ||
            (px === 0 && !vand(tx - 1, ty)) ||
            (px === FELT - 1 && !vand(tx + 1, ty));
          if (kant) col = V.bred;
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
