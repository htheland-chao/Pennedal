/** Tegner platformbaner set fra siden: byens tage om natten og Viskeskovens hvide sti. Kræver en browser. */
import { BFELT, erFast, type Bane } from '../bane';
import { ditherHimmel, halvtTegnet, hash, lerred } from './lerred';
import type { Tegnkort } from './sprites';
import { hx, TAG, MUR, PLANKE, BLAEK, VAND, SKOVBUND, TOMRUM, VISKET } from './banetegn/farver';
import { tegnArkivbane, tegnArkivBaggrund } from './banetegn/arkiv';
import { tegnSoebane, tegnSoeBaggrund } from './banetegn/soe';

export { tegnArkivBaggrund, tegnSoeBaggrund };

/** Banens forgrund: tage, mure, planker, blæk og vand. Tegnes én gang. Luft er gennemsigtig. */
export function tegnBane(bane: Bane, tema = ''): HTMLCanvasElement {
  if (tema === 'viskesti') return tegnSkovbane(bane);
  if (tema === 'rimbjerg') return tegnBjergbane(bane);
  if (tema === 'arkiv') return tegnArkivbane(bane);
  if (tema === 'blaeksoe') return tegnSoebane(bane);
  if (tema === 'halve') return halvtTegnet(tegnSkovbane(bane), 0.5);
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
  ditherHimmel(g, bredde, hoejde, ['#1a1e36', '#2a2f48', '#203a6b']);
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
    g.fillStyle = '#1a1e36';
    g.fillRect(x, hoejde - h, w, h);
    // Spidst tag.
    for (let k = 0; k < w / 2; k++) g.fillRect(x + k, hoejde - h - k / 1.5, w - 2 * k, 1);
    g.fillStyle = '#d9b56f';
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
    palet: { l: '#3a2a20', L: taendt ? '#ffe9a8' : '#4f4a57', s: '#6b4a2b' },
  };
}

/** Målet: en lem i et tag med lys bagved. */
export const MAAL: Tegnkort = {
  raekker: [
    'KKKKKKKKKKKKKK', 'KWWWWWWWWWWWWK', 'KWYYYYYYYYYYWK', 'KWYyyyyyyyyYWK', 'KWYyyyyyyyyYWK', 'KWYyyyyyyyyYWK',
    'KWYyyyyyyyyYWK', 'KWYYYYYYYYYYWK', 'KWWWWWWWWWWWWK', 'KKKKKKKKKKKKKK',
  ],
  palet: { K: '#222222', W: '#6b4a2b', Y: '#e5c03a', y: '#ffe9a8' },
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
  ditherHimmel(g, bredde, hoejde, ['#f4efe0']);
  const lag: [string, number, number][] = [['#c9dcf2', 70, 9], ['#b9bfcf', 52, 13], ['#a7aab8', 36, 17]];
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
  palet: { T: '#e0c995', P: '#c4ab7c', k: '#8a5a3a' },
};

const KLIPPE = { sne: hx('#f4efe0'), sneSkygge: hx('#c9dcf2'), a: hx('#8a8a8a'), b: hx('#6a6487'), lys: hx('#a7aab8') };
const DYB = { a: hx('#4f4a57'), b: hx('#2a2f48'), streg: hx('#5b5663') };
const STENSPOR = hx('#a7aab8');

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
  ditherHimmel(g, bredde, hoejde, ['#698fc1', '#c9dcf2']);
  const lag: [string, number, number][] = [['#c9dcf2', 0.45, 90], ['#a7aab8', 0.6, 70], ['#8a8a8a', 0.75, 54]];
  lag.forEach(([farve, bund, afstand], li) => {
    for (let x0 = -afstand; x0 < bredde + afstand; x0 += afstand) {
      const top = Math.round(hoejde * (bund - 0.25) - hash(x0, li) * 30);
      const fod = Math.round(hoejde * bund + 40);
      const halv = Math.round(afstand * 0.7);
      for (let y = top; y < fod; y++) {
        const w = Math.round(((y - top) / (fod - top)) * halv);
        g.fillStyle = y - top < 10 ? '#f4efe0' : farve;
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
  palet: { K: '#2a2f48', G: '#8a8a8a', g: '#716b60', s: '#f4efe0' },
};

/** Baggrunden over den halve bro: skovens bleg baggrund, men kun halvt tegnet. */
export function tegnHalvBaggrund(bredde: number, hoejde: number): HTMLCanvasElement {
  return halvtTegnet(tegnSkovBaggrund(bredde, hoejde), 0.55);
}
