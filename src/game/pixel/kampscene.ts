/**
 * Kampscenen (3. november 2026): en slette set skråt fra siden, væsner til venstre og holdet til højre.
 * 320 x 180 som resten af spillet. Tegnes én gang pr. kamp. Ingen bogstaver (docs/grafik.md).
 */
import { blegt, hash, lerred, sne, tegnkortTilLerred } from './lerred';
import { granMedSne } from './rimbjerg';
import { papirtrae, type Tegnkort } from './sprites';

export const KAMP_B = 320;
export const KAMP_H = 180;

const hx = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => BAYER[(y % 4) * 4 + (x % 4)] / 16;

const HIMMEL = ['#c9dcf2', '#dde6ee', '#f3ead2'].map(hx);
const HIMMEL_MOERK = ['#2a2f48', '#3a3a5e', '#4f4a6e'].map(hx);
const GRAES = ['#3d7a57', '#468a60', '#356c4d', '#4f9467'].map(hx);
const STRAA = hx('#5aa572');
const LYSNING = ['#4f9467', '#5aa572'].map(hx);
const SKYGGE = hx('#24503a');
const HORISONT = 74;

/** Baggrunden. moerk giver en truende himmel (uhygge), mild en lysere udgave. */
export function tegnKampBaggrund(tema: string, moerk: boolean): HTMLCanvasElement {
  const c = lerred(KAMP_B, KAMP_H);
  const g = c.getContext('2d')!;
  const d = g.createImageData(KAMP_B, KAMP_H);
  const p = d.data;
  const saet = (x: number, y: number, f: [number, number, number]) => {
    const i = (y * KAMP_B + x) * 4;
    p[i] = f[0];
    p[i + 1] = f[1];
    p[i + 2] = f[2];
    p[i + 3] = 255;
  };
  if (tema === 'arkiv') return tegnArkivKamp(c, moerk);
  const himmel = moerk ? HIMMEL_MOERK : HIMMEL;
  for (let y = 0; y < KAMP_H; y++)
    for (let x = 0; x < KAMP_B; x++) {
      if (y < HORISONT) {
        // Tre bånd med dither imellem, ingen bløde overgange.
        const t = (y / HORISONT) * (himmel.length - 1);
        const a = Math.floor(t);
        saet(x, y, himmel[Math.min(himmel.length - 1, a + (t - a > bay(x, y) ? 1 : 0))]);
        continue;
      }
      // Græs med en lysere lysning i midten, hvor kampen står.
      const dx = (x - 160) / 150;
      const dy = (y - 128) / 42;
      const lysning = dx * dx + dy * dy < 1;
      const h = hash(x, y);
      let f = GRAES[Math.floor(h * GRAES.length) % GRAES.length];
      if (lysning) f = LYSNING[(h > 0.55 ? 1 : 0) as 0 | 1];
      if (!lysning && h > 0.93) f = STRAA;
      if (y > 168 && bay(x, y) < (y - 168) / 14) f = SKYGGE;
      saet(x, y, f);
    }
  g.putImageData(d, 0, 0);
  // Rimbjerget: sne i stedet for græs, og graner med sne langs horisonten.
  const bjerg = tema === 'rimbjerg';
  if (bjerg) sne(c);
  // Papirtræer langs horisonten.
  for (let i = 0; i < 14; i++) {
    const h = 22 + Math.floor(hash(i, 7) * 12);
    const trae = tegnkortTilLerred(bjerg ? granMedSne(h) : papirtrae(h));
    g.drawImage(trae, Math.round(i * 24 - 6 + hash(i, 3) * 10), HORISONT + 6 - trae.height);
  }
  if (tema === 'viskeskov') blegt(c, moerk ? 0.25 : 0.5);
  return c;
}

/**
 * Kampen i Fodnoternes kælder (kapitel 5): et stengulv med en lyskreds i midten og reoler langs den bagerste væg.
 * moerk gør væggen mørkere (uhygge).
 */
function tegnArkivKamp(c: HTMLCanvasElement, moerk: boolean): HTMLCanvasElement {
  const g = c.getContext('2d')!;
  const d = g.createImageData(KAMP_B, KAMP_H);
  const p = d.data;
  const VAEG = (moerk ? ['#16121e', '#1e1828'] : ['#2a2236', '#332a40']).map(hx);
  const STEN = ['#4a4452', '#544c5c', '#3e3946'].map(hx);
  const LYS = ['#6a6070', '#7a6e7a'].map(hx);
  const FUGE = hx('#2a2530');
  const RYGGE = ['#7a2e2e', '#2e4a6b', '#4e6a3a', '#8a6a2e', '#5a3a6b'].map(hx);
  for (let y = 0; y < KAMP_H; y++)
    for (let x = 0; x < KAMP_B; x++) {
      const i = (y * KAMP_B + x) * 4;
      let f: [number, number, number];
      if (y < HORISONT) {
        // Reoler: hylder hver 12. pixel med bogrygge, mørke stolper imellem.
        const stolpe = x % 64 < 3;
        const hylde = y % 12 >= 10;
        if (stolpe || hylde || y < 8) f = VAEG[0];
        else {
          const bog = Math.floor(x / 3);
          const top = 1 + Math.floor(hash(bog, Math.floor(y / 12)) * 4);
          f = y % 12 < top ? VAEG[1] : x % 3 === 0 ? VAEG[0] : RYGGE[Math.floor(hash(bog, 3 + Math.floor(y / 12)) * RYGGE.length) % RYGGE.length];
        }
      } else {
        // Stenfliser med fuger og en lyskreds, hvor kampen står.
        const dx = (x - 160) / 150;
        const dy = (y - 128) / 42;
        const lys = dx * dx + dy * dy < 1;
        const raekke = Math.floor((y - HORISONT) / 10);
        const fuge = (y - HORISONT) % 10 === 9 || (x + raekke * 8) % 20 === 0;
        const h = hash(x, y);
        f = fuge ? FUGE : lys ? LYS[h > 0.6 ? 1 : 0] : STEN[Math.floor(h * STEN.length) % STEN.length];
        if (y > 168 && bay(x, y) < (y - 168) / 14) f = FUGE;
      }
      p[i] = f[0];
      p[i + 1] = f[1];
      p[i + 2] = f[2];
      p[i + 3] = 255;
    }
  g.putImageData(d, 0, 0);
  return c;
}

/** Markøren: en gylden pennespids, der peger på det valgte væsen (9 x 7). */
export const MARKOER: Tegnkort = {
  raekker: ['KKKK.....', 'KyYYKK...', 'KYYYYYKK.', 'KYYkkkkYK', 'KYYYYYKK.', 'KyYYKK...', 'KKKK.....'],
  palet: { K: '#2a170f', Y: '#f0c45a', y: '#ffe9a8', k: '#7a2e1f' },
};

/** Pladsen til hvert væsen (venstre side) og hvert medlem af holdet (højre side), som fodpunkt i 320 x 180. */
export const FJENDE_PLADS: [number, number][][] = [
  [[78, 132]],
  [[66, 112], [96, 150]],
  [[58, 104], [92, 128], [62, 156]],
];
export const HOLD_PLADS: [number, number][] = [
  [238, 116],
  [262, 138],
  [236, 160],
];
