/** Tegner platformbaner set fra siden: byens tage om natten. Kræver en browser. */
import { BFELT, erFast, type Bane } from '../bane';
import { hash, lerred } from './lerred';
import type { Tegnkort } from './sprites';

const hx = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

const TAG = { a: hx('#b0413e'), b: hx('#8e3428'), kant: hx('#7a2e1f'), lys: hx('#c9604c') };
const MUR = { a: hx('#8a6a45'), b: hx('#7a5c3e'), fuge: hx('#5a3a28'), bjaelke: hx('#4a3426') };
const PLANKE = { top: hx('#c9a46a'), a: hx('#a07a4a'), kant: hx('#5a3a28') };
const BLAEK = { a: hx('#141629'), b: hx('#1d2140'), glans: hx('#4f6fa8') };
const VAND = { a: hx('#14203f'), b: hx('#1a2a52'), krus: hx('#2c3f73') };

/** Banens forgrund: tage, mure, planker, blæk og vand. Tegnes én gang. Luft er gennemsigtig. */
export function tegnBane(bane: Bane): HTMLCanvasElement {
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
