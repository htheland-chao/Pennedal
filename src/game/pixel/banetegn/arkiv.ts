/**
 * Reolerne i Fodnoternes kælder (kapitel 5): banen og baggrunden.
 * Delt ud af banetegn.ts 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { BFELT, erFast, type Bane } from '../../bane';
import { hash, lerred } from '../lerred';
import { hx, PLANKE, BLAEK, VISKET } from './farver';

const REOL = { kant: hx('#6b3f27'), kantLys: hx('#8a7656'), bag: hx('#222222'), skygge: hx('#1b1b24') };
const RYGGE = ['#7a2e1f', '#28467c', '#356c4d', '#8a7656', '#603979', '#6b4a2b', '#2a5a40'].map(hx);
const KAELDERDYB = { a: hx('#070912'), b: hx('#1b1b24'), stoev: hx('#2a2f48') };

/**
 * Reolerne i Fodnoternes kælder (kapitel 5): man klatrer på hylder fulde af bogrygge, og mellem dem er der et mørkt dyb.
 * Bogryggene er farvede streger uden bogstaver. Viskede hylder står som en svag, stiplet kant.
 */
export function tegnArkivbane(bane: Bane): HTMLCanvasElement {
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
  g.fillStyle = '#070912';
  g.fillRect(0, 0, bredde, hoejde);
  const lag: [string, string, number, number][] = [['#1b1b24', '#2a2f48', 56, 0.18], ['#2a2f48', '#3a3560', 40, 0.32]];
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
          g.fillStyle = '#4a3426';
          g.fillRect(lx + x, ly + y, 1, 1);
        }
      }
    g.fillStyle = '#ffe9a8';
    g.fillRect(lx - 1, ly - 1, 3, 3);
  }
  return c;
}
