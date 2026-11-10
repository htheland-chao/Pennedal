/**
 * Titelskærmen (Henrik, 10. november 2026): en nat over Pennedal i pixelgrafik. Fyrtårnet på klippen, blæksøen med
 * månen i vandet, papirtræer og forrest det grønne hæfte, opslået på den sidste, tomme side. En lille skygge sidder
 * på kanten og venter. Ingen bogstaver i billedet: titlen og menuen er rigtig HTML ovenpå.
 * Tegnes én gang (320 x 180) og skaleres op med skarpe pixels.
 */
import { hash, lerred, tegnkortTilLerred } from './lerred';
import { LILLE_SKYGGE } from './sidstesiden';
import { fyrtaarn, papirtrae, type Tegnkort } from './sprites';

export const TITEL_B = 320;
export const TITEL_H = 180;
/** Hvor fyrtårnets lampe sidder i billedet (til lyskeglen i CSS), i pixel. */
export const FYR_LAMPE: [number, number] = [277, 71];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16;

function blit(g: CanvasRenderingContext2D, k: Tegnkort, x: number, bund: number) {
  const c = tegnkortTilLerred(k);
  g.drawImage(c, Math.round(x - c.width / 2), Math.round(bund - c.height));
}

export function tegnTitelScene(): HTMLCanvasElement {
  const c = lerred(TITEL_B, TITEL_H);
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, f: string) => {
    g.fillStyle = f;
    g.fillRect(x, y, 1, 1);
  };
  // Himlen: fire bånd med dither, fra dyb nat til en violet stribe ved horisonten.
  const himmel = ['#0b1026', '#141a3a', '#232650', '#3a2f5e', '#5a3f6e'];
  for (let y = 0; y < 120; y++)
    for (let x = 0; x < TITEL_B; x++) {
      const t = (y / 120) * (himmel.length - 1);
      const a = Math.floor(t);
      px(x, y, himmel[Math.min(himmel.length - 1, a + (t - a > bay(x, y) ? 1 : 0))]);
    }
  // Stjerner, nogle få med et kors.
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(hash(i, 1) * TITEL_B);
    const y = Math.floor(hash(i, 2) * 95);
    const lys = hash(i, 3) > 0.8;
    px(x, y, lys ? '#fff6d8' : hash(i, 4) > 0.5 ? '#c9d3f0' : '#8a92c0');
    if (lys && hash(i, 5) > 0.5) {
      px(x - 1, y, '#6a72a8');
      px(x + 1, y, '#6a72a8');
      px(x, y - 1, '#6a72a8');
      px(x, y + 1, '#6a72a8');
    }
  }
  // Månen med en blød glorie.
  const [mx, my] = [232, 34];
  for (let y = -26; y <= 26; y++)
    for (let x = -26; x <= 26; x++) {
      const d = Math.hypot(x, y);
      if (d <= 13) px(mx + x, my + y, hash(mx + x, my + y) > 0.88 || Math.hypot(x + 4, y - 3) < 3 || Math.hypot(x - 5, y + 4) < 2 ? '#e2d6b4' : '#f6ecd0');
      else if (d < 26 && bay(mx + x, my + y) < 0.5 - (d - 13) / 30) px(mx + x, my + y, '#4a4478');
    }
  // Fjerne bakker og en mellemste række med papirtræer i silhuet.
  for (let x = 0; x < TITEL_B; x++) {
    const h1 = Math.round(102 + Math.sin(x / 41) * 7 + Math.sin(x / 17 + 1) * 3);
    for (let y = h1; y < 130; y++) px(x, y, '#1e2246');
    const h2 = Math.round(116 + Math.sin(x / 29 + 2) * 6 + Math.sin(x / 11) * 2);
    for (let y = h2; y < 140; y++) px(x, y, '#18203a');
  }
  for (let i = 0; i < 16; i++) {
    const x = 6 + i * 13 + Math.floor(hash(i, 9) * 6);
    if (x > 200) continue;
    const t = papirtrae(10 + Math.floor(hash(i, 8) * 8));
    const silhuet: Tegnkort = { raekker: t.raekker, palet: Object.fromEntries(Object.keys(t.palet).map((k) => [k, '#151a32'])) };
    blit(g, silhuet, x, 124 + Math.floor(hash(i, 7) * 6));
  }
  // Blæksøen til højre med månen i vandet.
  for (let y = 132; y < TITEL_H; y++)
    for (let x = 150; x < TITEL_B; x++) {
      const kant = 150 + (y - 132) * 1.4;
      if (x < kant) continue;
      let f = hash(x >> 2, y >> 1) < 0.5 ? '#0f0e22' : '#141230';
      if (Math.abs(x - mx) < 10 - (y - 132) / 8 && (y + (x >> 2)) % 3 === 0) f = '#d8cfae';
      else if (hash(Math.floor(x / 6), y) > 0.95) f = '#4a4478';
      px(x, y, f);
    }
  // Klippen med fyrtårnet.
  for (let y = 112; y < 150; y++)
    for (let x = 250; x < 304; x++) {
      const top = 112 + Math.abs(x - 277) * 0.9;
      if (y >= top) px(x, y, hash(x >> 1, y >> 1) > 0.7 ? '#3a3448' : y < top + 2 ? '#5a5268' : '#2c2838');
    }
  blit(g, fyrtaarn(), 277, 116);
  // Bakken forrest med græs.
  for (let x = 0; x < TITEL_B; x++) {
    const top = Math.round(146 + Math.sin(x / 37) * 5 - Math.max(0, 40 - Math.abs(x - 120)) / 6);
    for (let y = top; y < TITEL_H; y++) {
      const d = y - top;
      if (x > 150 + (y - 132) * 1.4 && y > 150) continue;
      px(x, y, d < 1 ? '#4e7a52' : d < 3 && bay(x, y) < 0.5 ? '#3d6a4a' : hash(x, y) > 0.93 ? '#2f5a3e' : '#244a36');
    }
  }
  // Det grønne hæfte, opslået, med den sidste side tom.
  const hx = 96;
  const hy = 140;
  for (let y = 0; y < 22; y++)
    for (let x = -34; x <= 34; x++) {
      const bue = Math.round(Math.abs(x) / 9);
      const yy = hy + y - bue;
      if (y === 0 || Math.abs(x) === 34 || y === 21) px(hx + x, yy, '#1d1a2a');
      else if (x === 0) px(hx + x, yy, '#2f5a3e');
      else {
        px(hx + x, yy, x < 0 ? (y % 4 === 2 && x > -30 && x < -4 ? '#6a6480' : '#f4efe0') : y % 4 === 2 && x > 4 && x < 30 ? '#d6dbe6' : '#fffaf0');
      }
    }
  for (let x = -35; x <= 35; x++) for (let y = 22; y < 25; y++) px(hx + x, hy + y - Math.round(Math.abs(x) / 9), y === 24 ? '#1d1a2a' : '#4e7a52');
  // En blyant ved siden af hæftet.
  for (let i = 0; i < 24; i++) {
    px(140 + i, 160 - Math.floor(i / 3), i < 3 ? '#2a2433' : i < 5 ? '#e8c9a0' : '#e5c03a');
    px(140 + i, 161 - Math.floor(i / 3), i < 5 ? '#c9a46a' : '#b8902a');
  }
  // Skyggen sidder på kanten af den tomme side.
  blit(g, LILLE_SKYGGE, hx + 22, hy - 2);
  // Papirtræer forrest i hjørnerne.
  blit(g, papirtrae(30), 14, 182);
  blit(g, papirtrae(24), 34, 184);
  blit(g, papirtrae(26), 308, 186);
  return c;
}
