// Gør et billede fra Gemini klar til spillet (26. november 2026):
// skærer til 16:9, skalerer ned til 320 x 180 (gennemsnit af hver blok) og farver om til masterpaletten.
// Brug: node scripts/billede-til-palet.mjs ind.png ud.png [--dither]
// Kun PNG. Gem billederne fra Gemini som PNG.
import fs from 'node:fs';
import { PNG } from 'pngjs';

const [ind, ud, ...valg] = process.argv.slice(2);
if (!ind || !ud) {
  console.error('Brug: node scripts/billede-til-palet.mjs ind.png ud.png [--dither]');
  process.exit(1);
}
const BREDDE = 320;
const HOEJDE = 180;
const DITHER = valg.includes('--dither');

// Masterpaletten læses direkte fra palet.ts, så der kun er ét sted at rette den.
const paletKilde = fs.readFileSync(new URL('../src/game/pixel/palet.ts', import.meta.url), 'utf8').split('export const ALLE')[0];
const PALET = [...new Set([...paletKilde.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0].toLowerCase()))];

const lin = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
function lab(r, g, b) {
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const P = PALET.map((h) => {
  const n = parseInt(h.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return { rgb, lab: lab(...rgb) };
});
const afstand = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
function to(lb) {
  let a = P[0];
  let b = P[1];
  for (const p of P) {
    if (afstand(p.lab, lb) < afstand(a.lab, lb)) [a, b] = [p, a];
    else if (afstand(p.lab, lb) < afstand(b.lab, lb)) b = p;
  }
  return [a, b];
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const kilde = PNG.sync.read(fs.readFileSync(ind));
// Skær til 16:9 fra midten.
let kw = kilde.width;
let kh = Math.round((kw * 9) / 16);
if (kh > kilde.height) {
  kh = kilde.height;
  kw = Math.round((kh * 16) / 9);
}
const kx = Math.floor((kilde.width - kw) / 2);
const ky = Math.floor((kilde.height - kh) / 2);

const resultat = new PNG({ width: BREDDE, height: HOEJDE });
for (let y = 0; y < HOEJDE; y++)
  for (let x = 0; x < BREDDE; x++) {
    const x0 = kx + Math.floor((x * kw) / BREDDE);
    const x1 = kx + Math.max(x0 - kx + 1, Math.floor(((x + 1) * kw) / BREDDE));
    const y0 = ky + Math.floor((y * kh) / HOEJDE);
    const y1 = ky + Math.max(y0 - ky + 1, Math.floor(((y + 1) * kh) / HOEJDE));
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let sy = y0; sy < y1; sy++)
      for (let sx = x0; sx < x1; sx++) {
        const i = (sy * kilde.width + sx) * 4;
        r += kilde.data[i];
        g += kilde.data[i + 1];
        b += kilde.data[i + 2];
        n++;
      }
    const lb = lab(r / n, g / n, b / n);
    const [a, nr2] = to(lb);
    let valgt = a;
    if (DITHER) {
      const da = Math.sqrt(afstand(a.lab, lb));
      const db = Math.sqrt(afstand(nr2.lab, lb));
      if (da / (da + db) > BAYER[(y % 4) * 4 + (x % 4)] * 0.9 + 0.05 && db < 0.08) valgt = nr2;
    }
    const o = (y * BREDDE + x) * 4;
    [resultat.data[o], resultat.data[o + 1], resultat.data[o + 2]] = valgt.rgb;
    resultat.data[o + 3] = 255;
  }
fs.writeFileSync(ud, PNG.sync.write(resultat));
console.log(`${ud}: ${BREDDE} x ${HOEJDE}, ${PALET.length} farver${DITHER ? ', dither' : ''}`);
