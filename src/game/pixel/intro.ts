/**
 * Pixelgrafik til introen (320 x 180, samme mål som spillet). Kræver en browser.
 * Ingen bogstaver i grafikken: al tekst i introen er HTML (krav 1).
 * Billederne tegnes én gang. Bevægelse (regn, måner, skygge, lys) laves med CSS ovenpå,
 * så introen er let at køre på en Chromebook.
 */
import { hash, lerred } from './lerred';
import { bay } from './lerred/grundlag';
import type { Tegnkort } from './sprites';

export const INTRO_B = 320;
export const INTRO_H = 180;

type Farve = string;

function felt(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: Farve) {
  g.fillStyle = f;
  g.fillRect(x, y, w, h);
}

/** Lodret overgang mellem paletfarver med ordnet dither (Bayer 4 x 4), ingen bløde overgange. */
function trinGradient(g: CanvasRenderingContext2D, y0: number, y1: number, farver: Farve[]) {
  for (let y = y0; y < y1; y++) {
    const t = ((y - y0) / Math.max(1, y1 - y0 - 1)) * (farver.length - 1);
    const a = Math.floor(t);
    for (let x = 0; x < INTRO_B; x++) felt(g, x, y, 1, 1, farver[Math.min(farver.length - 1, a + (t - a > bay(x, y) ? 1 : 0))]);
  }
}

/** Et mørkt værelse en regnfuld aften: vindue, skrivebord og en skuffe. */
export function tegnVaerelse(skuffeAaben: boolean): HTMLCanvasElement {
  const c = lerred(INTRO_B, INTRO_H);
  const g = c.getContext('2d')!;
  trinGradient(g, 0, 140, ['#1b1b24', '#1a1e36']);
  // Tapet med svage striber.
  for (let x = 6; x < INTRO_B; x += 24) for (let y = 0; y < 140; y += 2) felt(g, x, y, 1, 1, '#2a2f48');
  // En hylde med bøger til venstre (ingen bogstaver på ryggene).
  felt(g, 26, 58, 62, 3, '#4a3426');
  [['#7a2e1f', 9], ['#245c99', 7], ['#3d7a57', 10], ['#8a7656', 6], ['#603979', 9], ['#7a2e1f', 8]].reduce((x, [f, h]) => {
    felt(g, x, 58 - (h as number) - 4, 5, (h as number) + 4, f as string);
    return x + 6;
  }, 30);
  felt(g, 70, 49, 12, 9, '#203a6b');
  // Gulv af brædder.
  trinGradient(g, 140, 180, ['#1b1b24', '#222222']);
  for (let y = 144; y < 180; y += 6) felt(g, 0, y, INTRO_B, 1, '#1b1b24');
  // Vinduet: ramme, nattehimmel, sprosser. Regnen lægges ovenpå med CSS.
  felt(g, 118, 18, 84, 74, '#3a2a20');
  for (let y = 22; y < 88; y++) felt(g, 122, y, 76, 1, y < 44 ? '#2a2f48' : y < 66 ? '#203a6b' : '#28467c');
  for (let i = 0; i < 18; i++) felt(g, 124 + Math.floor(hash(i, 9) * 72), 24 + Math.floor(hash(i, 4) * 30), 1, 1, '#698fc1');
  felt(g, 158, 22, 4, 66, '#3a2a20');
  felt(g, 122, 53, 76, 3, '#3a2a20');
  felt(g, 114, 90, 92, 5, '#4a3426');
  // Svagt lys fra vinduet på gulvet.
  for (let y = 146; y < 172; y++) for (let x = 132 + (y - 146); x < 196 + (y - 146); x++) if ((x + y) % 2 === 0) felt(g, x, y, 1, 1, '#2a2f48');
  // Skrivebordet.
  felt(g, 90, 112, 140, 8, '#6b3f27');
  felt(g, 90, 112, 140, 2, '#6b4a2b');
  felt(g, 96, 120, 10, 50, '#4a2b1b');
  felt(g, 214, 120, 10, 50, '#4a2b1b');
  felt(g, 150, 120, 64, 26, '#4a3426');
  // Skuffen.
  if (skuffeAaben) {
    felt(g, 150, 140, 66, 16, '#6b3f27');
    felt(g, 152, 141, 62, 4, '#222222');
    // Et grønt hjørne af noget i skuffen, kun et glimt.
    felt(g, 168, 141, 18, 3, '#3d7a57');
    felt(g, 168, 141, 18, 1, '#5aa572');
    felt(g, 180, 150, 6, 2, '#c4ab7c');
  } else {
    felt(g, 154, 126, 56, 16, '#6b3f27');
    felt(g, 154, 126, 56, 1, '#7a4e33');
    felt(g, 178, 133, 8, 2, '#c4ab7c');
  }
  // En blyant på bordet.
  felt(g, 112, 109, 14, 2, '#e5c03a');
  felt(g, 126, 109, 2, 2, '#f6d7c3');
  felt(g, 128, 109, 1, 2, '#222222');
  return c;
}

/** Regnstriber til vinduet. Højden er dobbelt, så den kan rulle i en uendelig løkke. */
export function tegnRegn(): HTMLCanvasElement {
  const c = lerred(76, 132);
  const g = c.getContext('2d')!;
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(hash(i, 1) * 76);
    const y = Math.floor(hash(i, 2) * 66);
    const l = 3 + Math.floor(hash(i, 3) * 4);
    for (const dy of [0, 66]) felt(g, x, y + dy, 1, l, hash(i, 5) > 0.5 ? '#a7aab8' : '#698fc1');
  }
  return c;
}

const PAPIR = ['#f3ead2', '#f6d7c3', '#e0c995'];

/** Pennedal om natten set fra en bakke: papirtræer, floden og fyrtårnet langt væk. Månerne er separate lag. */
export function tegnLand(): HTMLCanvasElement {
  const c = lerred(INTRO_B, INTRO_H);
  const g = c.getContext('2d')!;
  trinGradient(g, 0, 120, ['#1a1e36', '#2a2f48', '#3a3560']);
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(hash(i, 11) * INTRO_B);
    const y = Math.floor(hash(i, 12) * 90);
    felt(g, x, y, 1, 1, hash(i, 13) > 0.7 ? '#ffe9a8' : '#c9dcf2');
  }
  // Bakker i tre lag.
  const bakke = (top: number, amp: number, frek: number, f: Farve, fase: number) => {
    for (let x = 0; x < INTRO_B; x++) {
      const y = Math.round(top + Math.sin(x / frek + fase) * amp + Math.sin(x / (frek / 2.7)) * amp * 0.3);
      felt(g, x, y, 1, INTRO_H - y, f);
    }
  };
  bakke(104, 8, 40, '#2a2f48', 0);
  // Fyrtårnet langt væk på den bageste bakke.
  felt(g, 262, 74, 6, 26, '#f3ead2');
  felt(g, 262, 80, 6, 3, '#a83b33');
  felt(g, 262, 90, 6, 3, '#a83b33');
  felt(g, 260, 70, 10, 4, '#3a2a20');
  felt(g, 263, 71, 4, 2, '#ffe9a8');
  bakke(122, 7, 28, '#2a2f48', 1.3);
  // Floden.
  for (let y = 136; y < 146; y++)
    for (let x = 0; x < INTRO_B; x++) {
      const bue = Math.round(Math.sin(x / 30) * 3);
      if (y + bue >= 138 && y + bue < 144) felt(g, x, y, 1, 1, hash(x >> 1, y) > 0.92 ? '#698fc1' : '#28467c');
    }
  bakke(150, 5, 22, '#24503a', 2.1);
  // Papirtræer: hvide trekanter med foldelinjer.
  const trae = (x: number, bund: number, h: number) => {
    felt(g, x - 1, bund - 4, 2, 4, '#6b3f27');
    for (let r = 0; r < h; r++) {
      const w = Math.floor((r / h) * (h * 0.55)) + 1;
      for (let dx = -w; dx <= w; dx++) {
        const f = dx < 0 ? PAPIR[0] : dx === 0 ? PAPIR[2] : PAPIR[1];
        felt(g, x + dx, bund - 4 - h + r, 1, 1, f);
      }
      if (r % 5 === 4) felt(g, x - w, bund - 4 - h + r, w * 2 + 1, 1, PAPIR[2]);
    }
  };
  [[24, 156, 22], [52, 160, 16], [88, 158, 26], [208, 160, 18], [236, 157, 24], [296, 160, 20], [128, 128, 10], [176, 126, 12]].forEach(
    ([x, b, h]) => trae(x, b, h),
  );
  return c;
}

/** En måne som eget lag, så den kan slukke. */
export function tegnMaane(r: number, farve: Farve): HTMLCanvasElement {
  const c = lerred(r * 2 + 1, r * 2 + 1);
  const g = c.getContext('2d')!;
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r + r * 0.8)
        felt(g, x + r, y + r, 1, 1, x * x + y * y > (r - 1) * (r - 1) + r * 0.8 || (x > r / 3 && y > -r / 3 && hash(x, y) > 0.6) ? '#e0c995' : farve);
  return c;
}

/** Kælderen under skolebiblioteket: kartoteksskabet. Lyset i den nederste skuffe er et eget lag. */
export function tegnKaelder(): HTMLCanvasElement {
  const c = lerred(INTRO_B, INTRO_H);
  const g = c.getContext('2d')!;
  // Stenvæg.
  for (let y = 0; y < 150; y++)
    for (let x = 0; x < INTRO_B; x++) {
      const raekke = Math.floor(y / 10);
      const fuge = y % 10 === 9 || (x + (raekke % 2) * 12) % 24 === 23;
      felt(g, x, y, 1, 1, fuge ? '#070912' : hash(Math.floor((x + (raekke % 2) * 12) / 24), raekke) > 0.5 ? '#1b1b24' : '#222222');
    }
  trinGradient(g, 150, 180, ['#1b1b24', '#070912']);
  // Kartoteksskabet: mange små skuffer.
  felt(g, 112, 40, 96, 112, '#3a2a20');
  felt(g, 112, 40, 96, 3, '#4a3426');
  for (let r = 0; r < 6; r++)
    for (let k = 0; k < 4; k++) {
      const x = 117 + k * 22;
      const y = 47 + r * 17;
      felt(g, x, y, 20, 14, '#6b3f27');
      felt(g, x, y, 20, 1, '#6b4a2b');
      felt(g, x + 8, y + 6, 4, 2, '#c4ab7c');
    }
  // Spindelvæv i hjørnet.
  for (let i = 0; i < 14; i++) felt(g, i, i, 1, 1, '#2a2f48');
  for (let i = 0; i < 10; i++) felt(g, i * 2, 4, 1, 1, '#2a2f48');
  // Støv på gulvet.
  for (let i = 0; i < 40; i++) felt(g, Math.floor(hash(i, 21) * INTRO_B), 152 + Math.floor(hash(i, 22) * 26), 1, 1, '#222222');
  return c;
}

/** Studiets mærke: en fjerpen i et blækhus. Ingen bogstaver. */
export const STUDIE_MAERKE: Tegnkort = {
  raekker: [
    '..............ww',
    '.............wWw',
    '............wWw.',
    '...........wWw..',
    '..........wWw...',
    '.........wWw....',
    '........wWw.....',
    '.......wWw......',
    '......kwk.......',
    '....kkkKkkk.....',
    '...kbbbbbbbk....',
    '...kbBbbbbbk....',
    '...kbbbbbbbk....',
    '...kbbbbbbbk....',
    '....kkkkkkk.....',
    '................',
  ],
  palet: { w: '#e0c995', W: '#f3ead2', k: '#222222', K: '#1b1b24', b: '#28467c', B: '#698fc1' },
};
