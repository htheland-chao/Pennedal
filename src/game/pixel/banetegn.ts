/** Tegner platformbaner set fra siden: byens tage om natten og Viskeskovens hvide sti. Kræver en browser. */
import { BFELT, erFast, type Bane } from '../bane';
import { hash, lerred } from './lerred';
import type { Tegnkort } from './sprites';

const hx = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

const TAG = { a: hx('#b0413e'), b: hx('#8e3428'), kant: hx('#7a2e1f'), lys: hx('#c9604c') };
const MUR = { a: hx('#8a6a45'), b: hx('#7a5c3e'), fuge: hx('#5a3a28'), bjaelke: hx('#4a3426') };
const PLANKE = { top: hx('#c9a46a'), a: hx('#a07a4a'), kant: hx('#5a3a28') };
const BLAEK = { a: hx('#141629'), b: hx('#1d2140'), glans: hx('#4f6fa8') };
const VAND = { a: hx('#14203f'), b: hx('#1a2a52'), krus: hx('#2c3f73') };

const SKOVBUND = { top: hx('#e8e6ee'), graes: hx('#c9cfc4'), a: hx('#b8ad9c'), b: hx('#a99f8e'), sten: hx('#8f8a80') };
const TOMRUM = { a: hx('#eceaf2'), b: hx('#e2e0ea'), streg: hx('#d2cfdc') };
const VISKET = hx('#b9b4c8');

/** Banens forgrund: tage, mure, planker, blæk og vand. Tegnes én gang. Luft er gennemsigtig. */
export function tegnBane(bane: Bane, tema = ''): HTMLCanvasElement {
  if (tema === 'viskesti') return tegnSkovbane(bane);
  if (tema === 'rimbjerg') return tegnBjergbane(bane);
  if (tema === 'arkiv') return tegnArkivbane(bane);
  const W = bane.bredde * BFELT;
  const H = bane.hoejde * BFELT;
  const c = lerred(W, H);
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const p = img.data;
  const saet = (X: number, Y: number, col: [number, number, number]) => {
    const o = (Y * W + X) * 4;
    p[o] = col[0];
    p[o + 1] = col[1];
    p[o + 2] = col[2];
    p[o + 3] = 255;
  };
  for (let ty = 0; ty < bane.hoejde; ty++)
    for (let tx = 0; tx < bane.bredde; tx++) {
      const t = bane.tegn(tx, ty);
      for (let py = 0; py < BFELT; py++)
        for (let px = 0; px < BFELT; px++) {
          const X = tx * BFELT + px;
          const Y = ty * BFELT + py;
          const r = hash(X, Y);
          if (erFast(t)) {
            const top = !erFast(bane.tegn(tx, ty - 1));
            if (top && py < 6) {
              // Tagsten i rækker med skyggekant.
              const raekke = Math.floor(py / 3);
              const sten = Math.floor((X + raekke * 4) / 8);
              let col = hash(sten, ty * 7 + raekke) < 0.5 ? TAG.a : TAG.b;
              if (py % 3 === 2) col = TAG.kant;
              if (py === 0) col = TAG.lys;
              saet(X, Y, col);
            } else {
              // Bindingsværk: puds med mørke bjælker.
              let col = r < 0.5 ? MUR.a : MUR.b;
              if (px === 0 || px === BFELT - 1) col = MUR.bjaelke;
              if (Y % 16 === 15) col = MUR.fuge;
              if ((px + py) % 23 === 0) col = MUR.bjaelke;
              saet(X, Y, col);
            }
          } else if (t === '=') {
            if (py < 5) saet(X, Y, py === 0 ? PLANKE.top : py === 4 ? PLANKE.kant : (X % 8 === 0 ? PLANKE.kant : PLANKE.a));
          } else if (t === '^') {
            if (py >= 11) saet(X, Y, py === 11 && r > 0.6 ? BLAEK.glans : r < 0.5 ? BLAEK.a : BLAEK.b);
          } else if (t === '~') {
            saet(X, Y, hash(X >> 2, Y >> 1) > 0.9 ? VAND.krus : r < 0.5 ? VAND.a : VAND.b);
          }
        }
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Baggrunden bag tagene: himmel, tre måner og fjerne huse med varme vinduer. Flytter sig langsommere end forgrunden. */
export function tegnByBaggrund(bredde: number, hoejde: number): HTMLCanvasElement {
  const c = lerred(bredde, hoejde);
  const g = c.getContext('2d')!;
  const himmel = g.createLinearGradient(0, 0, 0, hoejde);
  himmel.addColorStop(0, '#141a33');
  himmel.addColorStop(1, '#2c3a66');
  g.fillStyle = himmel;
  g.fillRect(0, 0, bredde, hoejde);
  for (let i = 0; i < bredde / 6; i++) {
    g.fillStyle = hash(i, 3) > 0.5 ? '#ffe9a8' : '#c9dcf2';
    g.fillRect(Math.floor(hash(i, 1) * bredde), Math.floor(hash(i, 2) * hoejde * 0.6), 1, 1);
  }
  const maaner: [number, number, number, string][] = [[40, 24, 9, '#f3ead2'], [64, 16, 5, '#f0c45a'], [80, 30, 6, '#c9dcf2']];
  for (const [x, y, r, f] of maaner) {
    g.fillStyle = f;
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) g.fillRect(x + xx, y + yy, 1, 1);
  }
  // Fjerne huse.
  let x = 0;
  let i = 0;
  while (x < bredde) {
    const w = 18 + Math.floor(hash(i, 5) * 22);
    const h = 40 + Math.floor(hash(i, 6) * 50);
    g.fillStyle = '#1d2448';
    g.fillRect(x, hoejde - h, w, h);
    // Spidst tag.
    for (let k = 0; k < w / 2; k++) g.fillRect(x + k, hoejde - h - k / 1.5, w - 2 * k, 1);
    g.fillStyle = '#e8b85a';
    for (let wy = hoejde - h + 8; wy < hoejde - 8; wy += 10)
      for (let wx = x + 4; wx < x + w - 5; wx += 7) if (hash(wx, wy) > 0.55) g.fillRect(wx, wy, 3, 4);
    x += w + 2 + Math.floor(hash(i, 7) * 10);
    i++;
  }
  return c;
}

/** En lanterne på en stang: checkpoint. Tændt eller slukket. */
export function checkpoint(taendt: boolean): Tegnkort {
  return {
    raekker: ['..lll..', '.lLLLl.', '.lLLLl.', '.lLLLl.', '..lll..', '...s...', '...s...', '...s...', '...s...', '...s...', '...s...', '..sss..'],
    palet: { l: '#3a2a20', L: taendt ? '#ffe9a8' : '#4a4a5a', s: '#6b4a2b' },
  };
}

/** Målet: en lem i et tag med lys bagved. */
export const MAAL: Tegnkort = {
  raekker: [
    'KKKKKKKKKKKKKK', 'KWWWWWWWWWWWWK', 'KWYYYYYYYYYYWK', 'KWYyyyyyyyyYWK', 'KWYyyyyyyyyYWK', 'KWYyyyyyyyyYWK',
    'KWYyyyyyyyyYWK', 'KWYYYYYYYYYYWK', 'KWWWWWWWWWWWWK', 'KKKKKKKKKKKKKK',
  ],
  palet: { K: '#2a170f', W: '#6b4a2b', Y: '#e5b84c', y: '#ffe9a8' },
};

/**
 * Viskeskovens bane (Henrik, 9. november 2026): bleg skovbund med hvidt græs, planker af lyst træ,
 * et hvidt tomrum, hvor noget er visket væk, og viskede planker, der kun står som en svag, stiplet kant.
 */
function tegnSkovbane(bane: Bane): HTMLCanvasElement {
  const W = bane.bredde * BFELT;
  const H = bane.hoejde * BFELT;
  const c = lerred(W, H);
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const p = img.data;
  const saet = (X: number, Y: number, col: [number, number, number]) => {
    const o = (Y * W + X) * 4;
    p[o] = col[0];
    p[o + 1] = col[1];
    p[o + 2] = col[2];
    p[o + 3] = 255;
  };
  for (let ty = 0; ty < bane.hoejde; ty++)
    for (let tx = 0; tx < bane.bredde; tx++) {
      const t = bane.tegn(tx, ty);
      for (let py = 0; py < BFELT; py++)
        for (let px = 0; px < BFELT; px++) {
          const X = tx * BFELT + px;
          const Y = ty * BFELT + py;
          const r = hash(X, Y);
          if (erFast(t)) {
            const top = !erFast(bane.tegn(tx, ty - 1));
            if (top && py < 2) saet(X, Y, SKOVBUND.top);
            else if (top && py < 5) saet(X, Y, r < 0.35 ? SKOVBUND.top : SKOVBUND.graes);
            else saet(X, Y, r > 0.97 ? SKOVBUND.sten : hash(X >> 2, Y >> 2) < 0.5 ? SKOVBUND.a : SKOVBUND.b);
          } else if (t === '=') {
            if (py < 5) saet(X, Y, py === 0 ? PLANKE.top : py === 4 ? PLANKE.kant : X % 8 === 0 ? PLANKE.kant : PLANKE.a);
          } else if (t === 'v') {
            // Kun en svag, stiplet kant, hvor planken var.
            if ((py === 0 || py === 4) && (X >> 1) % 2 === 0) saet(X, Y, VISKET);
          } else if (t === '^') {
            if (py >= 11) saet(X, Y, py === 11 && r > 0.6 ? BLAEK.glans : r < 0.5 ? BLAEK.a : BLAEK.b);
          } else if (t === '~') {
            saet(X, Y, hash(X >> 3, Y >> 1) > 0.94 ? TOMRUM.streg : r < 0.5 ? TOMRUM.a : TOMRUM.b);
          }
        }
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Baggrunden i Viskeskoven: bleg himmel og tre lag af hvide træer, der bliver svagere bagud. */
export function tegnSkovBaggrund(bredde: number, hoejde: number): HTMLCanvasElement {
  const c = lerred(bredde, hoejde);
  const g = c.getContext('2d')!;
  const himmel = g.createLinearGradient(0, 0, 0, hoejde);
  himmel.addColorStop(0, '#dcdbe6');
  himmel.addColorStop(1, '#f1f0f5');
  g.fillStyle = himmel;
  g.fillRect(0, 0, bredde, hoejde);
  const lag: [string, number, number][] = [['#e4e2ec', 70, 9], ['#d6d3e0', 52, 13], ['#c4c0d2', 36, 17]];
  lag.forEach(([farve, hoej, afstand], li) => {
    g.fillStyle = farve;
    for (let x = 0; x < bredde; x += afstand) {
      const h = hoej + Math.floor(hash(x, li * 7) * 30);
      const b = 6 + Math.floor(hash(x, li * 5 + 1) * 6);
      const fod = hoejde - 10 + li * 4;
      // Et spidst papirtræ: trekant i trin.
      for (let k = 0; k < h; k++) {
        const w = Math.max(1, Math.round((k / h) * b));
        g.fillRect(x - w, fod - h + k, w * 2 + 1, 1);
      }
      g.fillRect(x, fod, 1, 10);
    }
  });
  return c;
}

/** Tågen, der følger hovedpersonen: hvid og tæt i kanten, åben i midten, hvor lanternen lyser. Dither, ingen bløde kanter. */
export function tegnTaage(b: number, h: number, hul: number): HTMLCanvasElement {
  const c = lerred(b, h);
  const g = c.getContext('2d')!;
  const img = g.createImageData(b, h);
  const p = img.data;
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < b; x++) {
      const d = Math.hypot(x + 0.5 - b / 2, (y + 0.5 - h / 2) * 1.3) / hul;
      const s = Math.min(1, Math.max(0, (d - 0.55) / 0.9));
      const trin = Math.floor(s * 4 + BAY[(y & 3) * 4 + (x & 3)] / 16) / 4;
      if (trin <= 0) continue;
      const o = (y * b + x) * 4;
      p[o] = 244;
      p[o + 1] = 243;
      p[o + 2] = 250;
      p[o + 3] = Math.round(trin * 150);
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** En ny planke, der lige er skrevet tilbage. */
export const NY_PLANKE: Tegnkort = {
  raekker: ['TTTTTTTTTTTTTTTT', 'PPPPPPPkPPPPPPPk', 'PPPPPPPkPPPPPPPk', 'PPPPPPPkPPPPPPPk', 'kkkkkkkkkkkkkkkk'],
  palet: { T: '#e8cf9a', P: '#c9a46a', k: '#7a5a3a' },
};

const KLIPPE = { sne: hx('#f2f6fb'), sneSkygge: hx('#cdd9e8'), a: hx('#7d7f8c'), b: hx('#6a6c7a'), lys: hx('#9a9cab') };
const DYB = { a: hx('#3a4562'), b: hx('#2f3854'), streg: hx('#4c5878') };
const STENSPOR = hx('#9aa3b8');

/**
 * Rimbjergets bane (kapitel 4, 9. november 2026): grå klippe med sne på toppen, en mørk kløft under stien
 * og trin, ekkoet har gjort væk, som en svag, stiplet kant.
 */
function tegnBjergbane(bane: Bane): HTMLCanvasElement {
  const W = bane.bredde * BFELT;
  const H = bane.hoejde * BFELT;
  const c = lerred(W, H);
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const p = img.data;
  const saet = (X: number, Y: number, col: [number, number, number]) => {
    const o = (Y * W + X) * 4;
    p[o] = col[0];
    p[o + 1] = col[1];
    p[o + 2] = col[2];
    p[o + 3] = 255;
  };
  for (let ty = 0; ty < bane.hoejde; ty++)
    for (let tx = 0; tx < bane.bredde; tx++) {
      const t = bane.tegn(tx, ty);
      for (let py = 0; py < BFELT; py++)
        for (let px = 0; px < BFELT; px++) {
          const X = tx * BFELT + px;
          const Y = ty * BFELT + py;
          const r = hash(X, Y);
          if (erFast(t)) {
            const top = !erFast(bane.tegn(tx, ty - 1));
            if (top && py < 3) saet(X, Y, py === 2 && r < 0.4 ? KLIPPE.sneSkygge : KLIPPE.sne);
            else if (top && py < 5 && r < 0.3) saet(X, Y, KLIPPE.sneSkygge);
            else saet(X, Y, r > 0.96 ? KLIPPE.lys : hash(X >> 3, Y >> 2) < 0.5 ? KLIPPE.a : KLIPPE.b);
          } else if (t === '=') {
            if (py < 5) saet(X, Y, py === 0 ? PLANKE.top : py === 4 ? PLANKE.kant : X % 8 === 0 ? PLANKE.kant : PLANKE.a);
          } else if (t === 'v') {
            if ((py === 0 || py === 6) && (X >> 1) % 2 === 0) saet(X, Y, STENSPOR);
            if ((px === 0 || px === 15) && py < 7 && (Y >> 1) % 2 === 0) saet(X, Y, STENSPOR);
          } else if (t === '^') {
            if (py >= 11) saet(X, Y, py === 11 && r > 0.6 ? BLAEK.glans : r < 0.5 ? BLAEK.a : BLAEK.b);
          } else if (t === '~') {
            saet(X, Y, hash(X >> 3, Y >> 1) > 0.95 ? DYB.streg : r < 0.5 ? DYB.a : DYB.b);
          }
        }
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Baggrunden på Rimbjerget: lys, kold himmel og tre lag bjerge med sne på toppene. */
export function tegnBjergBaggrund(bredde: number, hoejde: number): HTMLCanvasElement {
  const c = lerred(bredde, hoejde);
  const g = c.getContext('2d')!;
  const himmel = g.createLinearGradient(0, 0, 0, hoejde);
  himmel.addColorStop(0, '#b9cbe6');
  himmel.addColorStop(1, '#e8eef6');
  g.fillStyle = himmel;
  g.fillRect(0, 0, bredde, hoejde);
  const lag: [string, number, number][] = [['#c9d3e4', 0.45, 90], ['#a3afc7', 0.6, 70], ['#7f8aa6', 0.75, 54]];
  lag.forEach(([farve, bund, afstand], li) => {
    for (let x0 = -afstand; x0 < bredde + afstand; x0 += afstand) {
      const top = Math.round(hoejde * (bund - 0.25) - hash(x0, li) * 30);
      const fod = Math.round(hoejde * bund + 40);
      const halv = Math.round(afstand * 0.7);
      for (let y = top; y < fod; y++) {
        const w = Math.round(((y - top) / (fod - top)) * halv);
        g.fillStyle = y - top < 10 ? '#f2f6fb' : farve;
        g.fillRect(x0 - w, y, w * 2 + 1, 1);
      }
    }
    g.fillStyle = farve;
    g.fillRect(0, Math.round(hoejde * bund + 40), bredde, hoejde);
  });
  return c;
}

/** En varde (en stak sten) markerer målet på Rimbjerget. */
export const VARDE: Tegnkort = {
  raekker: [
    '.....KKK......',
    '....KsssK.....',
    '....KGGGK.....',
    '...KGGgGGK....',
    '...KKKKKKK....',
    '..KsssssssK...',
    '..KGGGGgGGK...',
    '.KKKKKKKKKKK..',
    '.KssssssssssK.',
    'KGGGgGGGGGgGGK',
    'KGGGGGGgGGGGGK',
    'KKKKKKKKKKKKKK',
  ],
  palet: { K: '#2a2c38', G: '#8d8a86', g: '#6c6a68', s: '#f2f6fb' },
};

const REOL = { kant: hx('#5a3a28'), kantLys: hx('#8a6a45'), bag: hx('#2a2030'), skygge: hx('#1c1624') };
const RYGGE = ['#7a2e2e', '#2e4a6b', '#4e6a3a', '#8a6a2e', '#5a3a6b', '#6b4a2b', '#3a5a5a'].map(hx);
const KAELDERDYB = { a: hx('#0c0a14'), b: hx('#120f1c'), stoev: hx('#2a2438') };

/**
 * Reolerne i Fodnoternes kælder (kapitel 5): man klatrer på hylder fulde af bogrygge, og mellem dem er der et mørkt dyb.
 * Bogryggene er farvede streger uden bogstaver. Viskede hylder står som en svag, stiplet kant.
 */
function tegnArkivbane(bane: Bane): HTMLCanvasElement {
  const W = bane.bredde * BFELT;
  const H = bane.hoejde * BFELT;
  const c = lerred(W, H);
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const p = img.data;
  const saet = (X: number, Y: number, col: [number, number, number]) => {
    const o = (Y * W + X) * 4;
    p[o] = col[0];
    p[o + 1] = col[1];
    p[o + 2] = col[2];
    p[o + 3] = 255;
  };
  for (let ty = 0; ty < bane.hoejde; ty++)
    for (let tx = 0; tx < bane.bredde; tx++) {
      const t = bane.tegn(tx, ty);
      for (let py = 0; py < BFELT; py++)
        for (let px = 0; px < BFELT; px++) {
          const X = tx * BFELT + px;
          const Y = ty * BFELT + py;
          const r = hash(X, Y);
          if (erFast(t)) {
            const top = !erFast(bane.tegn(tx, ty - 1));
            if (top && py < 3) saet(X, Y, py === 0 ? REOL.kantLys : REOL.kant);
            else if (py === BFELT - 1 || py === 7) saet(X, Y, REOL.kant);
            else if (px === 0 || px === BFELT - 1) saet(X, Y, REOL.skygge);
            else {
              // Bogrygge: en farve pr. bog (2-3 pixel brede), lidt forskellig højde, mørkt bagved.
              const halv = py < 7 ? 0 : 1;
              const bog = Math.floor((X + halv * 3) / 3);
              const hoejde = 1 + Math.floor(hash(bog, ty * 2 + halv) * 3);
              const yInd = halv === 0 ? py - 3 : py - 8;
              if (yInd < hoejde) saet(X, Y, REOL.bag);
              else {
                const f = RYGGE[Math.floor(hash(bog, ty * 5 + halv) * RYGGE.length) % RYGGE.length];
                saet(X, Y, (X + halv * 3) % 3 === 0 ? REOL.skygge : r > 0.92 ? REOL.kantLys : f);
              }
            }
          } else if (t === '=') {
            if (py < 5) saet(X, Y, py === 0 ? PLANKE.top : py === 4 ? PLANKE.kant : X % 8 === 0 ? PLANKE.kant : PLANKE.a);
          } else if (t === 'v') {
            if ((py === 0 || py === 4) && (X >> 1) % 2 === 0) saet(X, Y, VISKET);
          } else if (t === '^') {
            if (py >= 11) saet(X, Y, py === 11 && r > 0.6 ? BLAEK.glans : r < 0.5 ? BLAEK.a : BLAEK.b);
          } else if (t === '~') {
            saet(X, Y, r > 0.985 ? KAELDERDYB.stoev : hash(X >> 2, Y >> 2) < 0.5 ? KAELDERDYB.a : KAELDERDYB.b);
          }
        }
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Baggrunden i reolerne: mørke vægge, fjerne reoler i to lag og et par svage lamper højt oppe. */
export function tegnArkivBaggrund(bredde: number, hoejde: number): HTMLCanvasElement {
  const c = lerred(bredde, hoejde);
  const g = c.getContext('2d')!;
  g.fillStyle = '#16121e';
  g.fillRect(0, 0, bredde, hoejde);
  const lag: [string, string, number, number][] = [['#221c2c', '#2a2236', 56, 0.18], ['#2c2436', '#362c42', 40, 0.32]];
  lag.forEach(([farve, hylde, bredd, top], li) => {
    for (let x0 = 0; x0 < bredde; x0 += bredd + 10) {
      const y0 = Math.round(hoejde * top + hash(x0, li) * 20);
      g.fillStyle = farve;
      g.fillRect(x0, y0, bredd, hoejde - y0);
      g.fillStyle = hylde;
      for (let y = y0 + 12; y < hoejde; y += 14) g.fillRect(x0, y, bredd, 2);
    }
  });
  // Svage lamper: en lille gul prik med en dithret glorie.
  for (let i = 0; i < Math.ceil(bredde / 180); i++) {
    const lx = Math.round(60 + i * 180 + hash(i, 4) * 60);
    const ly = Math.round(16 + hash(i, 8) * 20);
    for (let y = -10; y <= 10; y++)
      for (let x = -10; x <= 10; x++) {
        const d = Math.hypot(x, y);
        if (d < 10 && hash(lx + x, ly + y) > 0.35 + d / 14) {
          g.fillStyle = '#4a3e3a';
          g.fillRect(lx + x, ly + y, 1, 1);
        }
      }
    g.fillStyle = '#f6d98a';
    g.fillRect(lx - 1, ly - 1, 3, 3);
  }
  return c;
}
