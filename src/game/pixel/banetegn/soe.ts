/**
 * Stenene over Blæksøen (kapitel 6): banen og baggrunden.
 * Delt ud af banetegn.ts 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { BFELT, erFast, type Bane } from '../../bane';
import { hash, lerred } from '../lerred';
import { hx, PLANKE, BLAEK, VISKET } from './farver';

const SOESTEN = { top: hx('#9a96a8'), a: hx('#6a6678'), b: hx('#5a5668'), mos: hx('#4f6f44'), fuge: hx('#3a3646') };
const BLAEKSOE = { a: hx('#0f0e1c'), b: hx('#15132a'), glimt: hx('#5a4f8a') };

/**
 * Stenene over Blæksøen (kapitel 6): grå sten med mos på toppen, sort blæk imellem.
 * Viskede sten står som en svag, stiplet kant.
 */
export function tegnSoebane(bane: Bane): HTMLCanvasElement {
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
            if (top && py < 2) saet(X, Y, py === 0 ? SOESTEN.top : r < 0.6 ? SOESTEN.mos : SOESTEN.top);
            else if ((X + (ty % 2) * 6) % 12 === 0 || Y % 8 === 7) saet(X, Y, SOESTEN.fuge);
            else saet(X, Y, hash(X >> 2, Y >> 2) < 0.5 ? SOESTEN.a : SOESTEN.b);
          } else if (t === '=') {
            if (py < 5) saet(X, Y, py === 0 ? PLANKE.top : py === 4 ? PLANKE.kant : X % 8 === 0 ? PLANKE.kant : PLANKE.a);
          } else if (t === 'v') {
            if ((py === 0 || py === 4) && (X >> 1) % 2 === 0) saet(X, Y, VISKET);
          } else if (t === '^') {
            if (py >= 11) saet(X, Y, py === 11 && r > 0.6 ? BLAEK.glans : r < 0.5 ? BLAEK.a : BLAEK.b);
          } else if (t === '~') {
            saet(X, Y, hash(Math.floor(X / 5), Y) > 0.95 ? BLAEKSOE.glimt : hash(X >> 2, Y >> 1) < 0.5 ? BLAEKSOE.a : BLAEKSOE.b);
          }
        }
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Baggrunden over Blæksøen: aftenhimmel, en lav bred på den anden side og et land, der kun er halvt tegnet. */
export function tegnSoeBaggrund(bredde: number, hoejde: number): HTMLCanvasElement {
  const c = lerred(bredde, hoejde);
  const g = c.getContext('2d')!;
  const himmel = g.createLinearGradient(0, 0, 0, hoejde);
  himmel.addColorStop(0, '#2a2442');
  himmel.addColorStop(0.6, '#5a4a7a');
  himmel.addColorStop(1, '#a0708a');
  g.fillStyle = himmel;
  g.fillRect(0, 0, bredde, hoejde);
  // De halve lande: bakker og træer, der kun er tegnet med en streg.
  const bund = Math.round(hoejde * 0.62);
  g.fillStyle = '#3a3050';
  for (let x = 0; x < bredde; x++) {
    const h = Math.round(10 + Math.sin(x / 37) * 6 + Math.sin(x / 13) * 3);
    g.fillRect(x, bund - h, 1, h);
  }
  g.fillStyle = '#c9c2d6';
  for (let x0 = 20; x0 < bredde; x0 += 70) {
    const h = 14 + Math.floor(hash(x0, 2) * 10);
    for (let y = 0; y < h; y++) g.fillRect(x0, bund - 8 - y, 1, 1);
    for (let i = 0; i < 8; i++) g.fillRect(x0 - 4 + i, bund - 8 - h + Math.abs(4 - i), 1, 1);
  }
  g.fillStyle = '#0f0e1c';
  g.fillRect(0, bund, bredde, hoejde - bund);
  return c;
}
