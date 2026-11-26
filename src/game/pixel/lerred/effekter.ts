/**
 * Effekter på billeder: blegt, halvt tegnet, linjeret papir, partikler, vignet, tågebanker og sne.
 * Delt ud af lerred.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { glatStoej } from './grund';
import { lysTrin, hash, lerred, tegnkortTilLerred } from './grundlag';

/**
 * Viskeskoven (kapitel 3): farverne er ved at blive visket ud. Gør et billede blegt én gang, når det tegnes.
 * Et CSS-filter på lærredet ville blive regnet ud i hvert billede og koste for meget på en Chromebook (krav 8).
 */
export function blegt(c: HTMLCanvasElement, maengde = 0.6): HTMLCanvasElement {
  const g = c.getContext('2d')!;
  const d = g.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const graa = p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
    const lys = graa * 0.7 + 236 * 0.3;
    for (let k = 0; k < 3; k++) p[i + k] = Math.round(p[i + k] * (1 - maengde) + lys * maengde);
  }
  g.putImageData(d, 0, 0);
  return c;
}

/**
 * De halve lande (kapitel 7): store pletter af billedet er kun tegnet med blyant. Inde i en plet bliver
 * farverne til papir, og kun de mørke kanter står tilbage som streger. Pletterne følger glat støj, så kanterne er bløde.
 */
export function halvtTegnet(c: HTMLCanvasElement, andel = 0.45): HTMLCanvasElement {
  const g = c.getContext('2d')!;
  const d = g.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  const W = c.width;
  const lum = (i: number) => p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11;
  const kopi = new Float32Array(c.width * c.height);
  for (let i = 0, j = 0; i < p.length; i += 4, j++) kopi[j] = lum(i);
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < W; x++) {
      const v = glatStoej(x, y, 64, 3);
      if (v > andel + 0.08) continue;
      const i = (y * W + x) * 4;
      const l = kopi[y * W + x];
      const kant = Math.abs(l - (kopi[y * W + Math.min(W - 1, x + 1)] ?? l)) + Math.abs(l - (kopi[Math.min(c.height - 1, y + 1) * W + x] ?? l));
      // Overgangen: en smal stribe, hvor kun hver anden pixel er tegnet om (dither).
      if (v > andel && (x + y) % 2 === 0) continue;
      const streg = kant > 70 || l < 35;
      const f = streg ? [92, 86, 112] : hash(x >> 1, y >> 1) > 0.97 ? [214, 210, 224] : [236, 232, 242];
      p[i] = f[0];
      p[i + 1] = f[1];
      p[i + 2] = f[2];
    }
  g.putImageData(d, 0, 0);
  return c;
}

/** Den sidste side (kapitel 8): alt er kun tegnet med blyant på linjeret papir med en rød margen. */
export function linjeretPapir(c: HTMLCanvasElement): HTMLCanvasElement {
  halvtTegnet(c, 1.2);
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(120, 150, 210, 0.35)';
  for (let y = 22; y < c.height; y += 24) g.fillRect(0, y, c.width, 1);
  g.fillStyle = 'rgba(210, 90, 90, 0.45)';
  g.fillRect(40, 0, 1, c.height);
  return c;
}

/** Partiklernes små billeder, to rammer pr. art (den anden bruges til blade, der vender sig, og store fnug). */
export function partikelBilleder(art: string): [HTMLCanvasElement, HTMLCanvasElement] {
  const t = (raekker: string[], palet: Record<string, string>) => tegnkortTilLerred({ raekker, palet });
  switch (art) {
    case 'ildflue': {
      const c = t(['.g.', 'gYg', '.g.'], { Y: '#fff6b0', g: 'rgba(232, 216, 74, 0.55)' });
      return [c, c];
    }
    case 'blad':
      return [t(['PPp', '.pp'], { P: '#f4efe0', p: '#b9bfcf' }), t(['Pp', 'pp'], { P: '#f4efe0', p: '#b9bfcf' })];
    case 'fnug':
      return [t(['W'], { W: '#f8f8fc' }), t(['.W.', 'WwW', '.W.'], { W: 'rgba(248, 248, 252, 0.8)', w: '#ffffff' })];
    case 'regn': {
      const c = t(['W', 'W', 'w'], { W: 'rgba(250, 250, 255, 0.9)', w: 'rgba(250, 250, 255, 0.4)' });
      return [c, c];
    }
    case 'pollen': {
      const c = t(['Y'], { Y: '#f0c45a' });
      return [c, c];
    }
    default: {
      const c = t(['S'], { S: '#f3ead2' });
      return [c, c];
    }
  }
}

/** Vignetten til lyslaget: hvid i midten, mørkere mod hjørnerne i 4 trin med dither. Ganges på lyset. */
export function lavVignet(w: number, h: number, styrke: number, glat = false): HTMLCanvasElement {
  const c = lerred(w, h);
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  const p = img.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot((x + 0.5 - w / 2) / (w / 2), (y + 0.5 - h / 2) / (h / 2));
      const t = Math.min(1, Math.max(0, (d - 0.62) / 0.6));
      const s = glat ? t * t * (3 - 2 * t) : lysTrin(t, x, y);
      const v = Math.round(255 * (1 - styrke * s));
      const o = (y * w + x) * 4;
      p[o] = v;
      p[o + 1] = v;
      p[o + 2] = Math.min(255, v + Math.round(styrke * s * 18));
      p[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * Tågebanker (Viskeskoven, 9. november 2026): bløde, hvide skyer med dither i kanten, gennemsigtige imellem.
 * Billedet kan lægges side om side, fordi skyerne ikke rører kanterne til venstre og højre.
 */
export function lavTaagebanker(w: number, h: number, saed = 0): HTMLCanvasElement {
  const c = lerred(w, h);
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  const p = img.data;
  const skyer = Array.from({ length: 5 }, (_, i) => ({
    x: 30 + hash(i, saed) * (w - 60),
    y: 20 + hash(saed, i * 3) * (h - 40),
    rx: 40 + hash(i * 7, saed + 1) * 50,
    ry: 10 + hash(i * 5, saed + 2) * 12,
  }));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (const k of skyer) s = Math.max(s, 1 - Math.hypot((x - k.x) / k.rx, (y - k.y) / k.ry));
      const v = lysTrin(Math.min(1, s * 1.6), x, y);
      if (v <= 0) continue;
      const o = (y * w + x) * 4;
      p[o] = 246;
      p[o + 1] = 245;
      p[o + 2] = 252;
      p[o + 3] = Math.round(v * 170);
    }
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * Sne (Rimbjerget, 9. november 2026): græs bliver til sne, skovbund til mørk sten og stien til grå klippe.
 * Farverne vælges ud fra lysstyrken, så mønsteret i jorden bliver bevaret.
 */
export function sne(c: HTMLCanvasElement): HTMLCanvasElement {
  const g = c.getContext('2d')!;
  const d = g.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const [r, gr, b] = [p[i], p[i + 1], p[i + 2]];
    const lys = r * 0.3 + gr * 0.59 + b * 0.11;
    if (gr > r + 12 && gr > b) {
      // Græs: sne med blå skygger. Mørkt græs (skovbund) bliver til mørk sten.
      const v = lys < 70 ? lys * 1.1 + 40 : 196 + (lys - 70) * 0.55;
      p[i] = Math.min(255, v - 8);
      p[i + 1] = Math.min(255, v - 2);
      p[i + 2] = Math.min(255, v + 10);
    } else if (r > b + 15) {
      // Sti og jord: grå klippe.
      const v = lys * 0.9 + 20;
      p[i] = v;
      p[i + 1] = v + 3;
      p[i + 2] = v + 12;
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}
