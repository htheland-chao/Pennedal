/**
 * Ting, der går igen i minderne (26. november 2026): det grønne hæfte, Skyggen, hænder, lamper, vinduer,
 * døre, kasser og bøger. Alle tegnes med former fra kit.ts, så de får omrids, lys og skygge.
 */
import { felt } from './faelles';
import { OMRIDS, ellipse, firkant, fyld, form, forening, kapsel, lysfelt, ordlinjer, polygon, type Toner } from './kit';

export const HAEFTE: Toner = { kontur: OMRIDS, skygge: '#2f6448', mid: '#3d7a57', lys: '#4f9467', glans: '#5aa572' };
export const PAPIR: Toner = { kontur: '#8a7656', skygge: '#d9d2bd', mid: '#f3ead2', lys: '#f4efe0' };
export const TRAE: Toner = { kontur: OMRIDS, skygge: '#4a3426', mid: '#6b4a2b', lys: '#8a5a3a' };
export const TRAE_LYS: Toner = { kontur: OMRIDS, skygge: '#6b4a2b', mid: '#8a5a3a', lys: '#a96e48', glans: '#c98d63' };
export const PAP: Toner = { kontur: '#5d5243', skygge: '#a99068', mid: '#c4ab7c', lys: '#e0c995' };
export const HUD: Toner = { kontur: '#6b3f27', skygge: '#c98d63', mid: '#e0a982', lys: '#eec1a0', glans: '#f6d7c3' };
export const HUD_VOKSEN: Toner = { kontur: '#4a2b1b', skygge: '#a96e48', mid: '#c98d63', lys: '#e0a982' };
export const AERME_BARN: Toner = { kontur: '#1a1e36', skygge: '#203a6b', mid: '#245c99', lys: '#4f6fa8' };
export const AERME_VOKSEN: Toner = { kontur: '#1b1b24', skygge: '#3a3560', mid: '#6a6487', lys: '#a7aab8' };
export const AERME_BRUN: Toner = { kontur: OMRIDS, skygge: '#6b3f27', mid: '#8a5536', lys: '#a96e48' };
export const BLAEK = '#2a2f48';
export const ORDFARVE = '#7a7468';

/** Det grønne hæfte, lukket. Med skygge = en lille tegning af Skyggen på forsiden. */
export function haefteLukket(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, medSkygge = false) {
  fyld(g, firkant(x + 2, y + 2, w, h, 2), '#3a2a20');
  form(g, firkant(x + 3, y + 2, w - 3, h - 1, 1), PAPIR, 1);
  form(g, firkant(x, y, w - 2, h - 2, 2), HAEFTE);
  felt(g, x + 4, y + 1, 2, h - 4, '#2f6448');
  if (medSkygge) {
    const s = Math.min(w, h);
    form(g, firkant(x + w / 2 - s * 0.22, y + h * 0.18, s * 0.5, s * 0.5, 2), PAPIR, 1);
    skyggen(g, x + w / 2 + 1, y + h * 0.18 + s * 0.27, s * 0.17, true);
  }
}

/** Det grønne hæfte, opslået: to sider med ord. Returnerer sidernes kasser. */
export function haefteAabent(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ord: { venstre?: boolean; hoejre?: boolean } = { venstre: true, hoejre: true }) {
  fyld(g, firkant(x + 3, y + 3, w, h, 2), '#3a2a20');
  form(g, firkant(x, y, w, h, 2), HAEFTE);
  const sw = Math.floor((w - 8) / 2);
  const venstre: [number, number, number, number] = [x + 4, y + 3, sw, h - 6];
  const hoejre: [number, number, number, number] = [x + 4 + sw, y + 3, sw, h - 6];
  for (const [sx, sy, w2, h2] of [venstre, hoejre]) form(g, firkant(sx, sy, w2, h2), { skygge: '#d9d2bd', mid: '#f3ead2', lys: '#f4efe0' }, 2);
  // Folden i midten.
  felt(g, x + 3 + sw, y + 3, 1, h - 6, '#c4ab7c');
  felt(g, x + 4 + sw, y + 3, 2, h - 6, '#d9d2bd');
  felt(g, x + 2 + sw, y + 3, 1, h - 6, '#d9d2bd');
  const raekker = Math.floor((h - 20) / 7);
  if (ord.venstre) ordlinjer(g, venstre[0] + 6, y + 10, sw - 12, raekker, 7, ORDFARVE, 2);
  if (ord.hoejre) ordlinjer(g, hoejre[0] + 6, y + 10, sw - 12, raekker, 7, ORDFARVE, 5);
  return { venstre, hoejre };
}

/** Skyggen: en lille sort skikkelse med store, runde øjne. tegnet = som blyantstegning på papir. */
export function skyggen(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, tegnet = false) {
  const krop = forening(ellipse(cx, cy - r * 0.15, r, r * 0.95), ellipse(cx - r * 0.55, cy + r * 0.7, r * 0.35, r * 0.3), ellipse(cx + r * 0.05, cy + r * 0.78, r * 0.35, r * 0.28), ellipse(cx + r * 0.6, cy + r * 0.68, r * 0.35, r * 0.3));
  if (tegnet) fyld(g, krop, '#3a3560');
  else form(g, krop, { kontur: '#070912', skygge: '#1b1b24', mid: '#2a2f48', lys: '#3a3560' });
  const oe = Math.max(1.5, r * 0.3);
  for (const ox of [-0.38, 0.38]) {
    fyld(g, ellipse(cx + ox * r, cy - r * 0.2, oe, oe * 1.1), '#f4efe0');
    fyld(g, ellipse(cx + ox * r + oe * 0.3, cy - r * 0.15, oe * 0.5, oe * 0.55), '#070912');
  }
}

/** En hånd, der skriver: knyttet om en blyant med spidsen i (x, y). Armen kommer nede fra højre. */
export function haandSkriver(g: CanvasRenderingContext2D, x: number, y: number, hud: Toner = HUD, aerme: Toner = AERME_BARN, hvideKnoer = false) {
  form(g, kapsel(x + 34, y + 2, x + 90, y + 40, 11), aerme);
  form(g, kapsel(x + 4, y - 2, x + 22, y - 36, 2.2), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#f0c45a', lys: '#ffe9a8' });
  fyld(g, kapsel(x + 1, y + 1, x + 3, y - 2, 1), '#c4ab7c');
  felt(g, x, y, 1, 1, BLAEK);
  const knyt = forening(ellipse(x + 15, y - 14, 13, 10), ellipse(x + 26, y - 6, 10, 9));
  form(g, knyt, hud);
  // Fingrene som fire buer langs knyttet.
  for (let i = 0; i < 4; i++) {
    const fx = x + 5 + i * 5;
    const fy = y - 6 + i * 1.5;
    form(g, ellipse(fx, fy, 3.2, 3.6), { ...hud, glans: hvideKnoer ? '#f4efe0' : hud.glans });
    if (hvideKnoer) felt(g, Math.round(fx) - 1, Math.round(fy) - 2, 2, 2, '#f4efe0');
  }
  form(g, kapsel(x + 12, y - 21, x + 2, y - 15, 3.4), hud);
  form(g, kapsel(x + 34, y + 4, x + 38, y + 8, 9), aerme);
}

/**
 * En åben hånd med armen bagved. (x, y) er håndfladens midte, retning er vinklen, fingrene peger
 * (0 = mod højre, Math.PI = mod venstre). armTil er, hvor armen forsvinder ud af billedet.
 */
export function haandAaben(g: CanvasRenderingContext2D, x: number, y: number, retning: number, armTil: [number, number], hud: Toner = HUD, aerme: Toner = AERME_BARN, stoerrelse = 1, krum = 0) {
  const s = stoerrelse;
  const ux = Math.cos(retning);
  const uy = Math.sin(retning);
  const px = -uy;
  const py = ux;
  const hx = x - ux * 7 * s;
  const hy = y - uy * 7 * s;
  form(g, kapsel(hx, hy, armTil[0], armTil[1], 7.5 * s), aerme);
  form(g, kapsel(hx - ux * 1, hy - uy * 1, hx + px * 0, hy + py * 0, 6.2 * s), hud);
  const fingre = [-1.5, -0.5, 0.5, 1.5].map((i) => {
    const bx = x + ux * 4 * s + px * i * 3.6 * s;
    const by = y + uy * 4 * s + py * i * 3.6 * s;
    const l = (i === -1.5 || i === 1.5 ? 6.5 : 8.5) * s * (1 - krum * 0.5);
    return kapsel(bx, by, bx + ux * l + px * i * 0.6 * s, by + uy * l + py * i * 0.6 * s, 1.9 * s);
  });
  const tommel = kapsel(x - ux * 2 * s - px * 6 * s, y - uy * 2 * s - py * 6 * s, x + ux * 4 * s - px * 9.5 * s, y + uy * 4 * s - py * 9.5 * s, 2.1 * s);
  form(g, forening(ellipse(x, y, 7.5 * s, 7.5 * s), ...fingre, tommel), hud);
  form(g, kapsel(hx - ux * 3, hy - uy * 3, hx - ux * 5, hy - uy * 5, 7.8 * s), aerme);
}

/** Bordlampe med skærm. (x, y) er foden. lys = om pæren lyser. */
export function bordlampe(g: CanvasRenderingContext2D, x: number, y: number, lys = true) {
  form(g, ellipse(x, y, 12, 3.5), TRAE_LYS);
  form(g, kapsel(x, y - 2, x - 2, y - 30, 1.6), { kontur: OMRIDS, skygge: '#8a7656', mid: '#c4ab7c', lys: '#e0c995' });
  if (lys) fyld(g, ellipse(x - 2, y - 30, 7, 3), '#ffe9a8');
  form(g, polygon([[x - 12, y - 30], [x + 8, y - 30], [x + 2, y - 46], [x - 7, y - 46]]), { kontur: OMRIDS, skygge: '#c4ab7c', mid: '#e0c995', lys: '#f3ead2' });
}

/** Loftlampe med ledning. (x, y) er skærmens underkant. */
export function loftlampe(g: CanvasRenderingContext2D, x: number, y: number) {
  felt(g, x, 0, 1, y - 10, OMRIDS);
  fyld(g, ellipse(x, y, 10, 3), '#ffe9a8');
  form(g, polygon([[x - 16, y], [x + 16, y], [x + 6, y - 12], [x - 6, y - 12]]), { kontur: OMRIDS, skygge: '#a96e48', mid: '#c98d63', lys: '#e0a982' });
}

/** Vindue med karm og sprosser. himmel er glassets farver fra top til bund. Regn = skrå streger. */
export function vindue(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, himmel: string[], regn = 0, karm: Toner = TRAE_LYS) {
  form(g, firkant(x, y, w, h, 1), karm);
  const gl = firkant(x + 4, y + 4, w - 8, h - 8);
  lysfelt(g, gl, himmel, (_, py) => (py - y) / h);
  for (let i = 0; i < regn; i++) {
    const rx = x + 4 + ((i * 37) % (w - 10));
    const ry = y + 4 + ((i * 53) % (h - 14));
    for (let k = 0; k < 5; k++) felt(g, rx + Math.floor(k / 2), ry + k, 1, 1, k < 2 ? '#c9dcf2' : '#a7aab8');
  }
  form(g, firkant(x + Math.floor(w / 2) - 1, y + 3, 3, h - 6), karm, 1);
  form(g, firkant(x + 3, y + Math.floor(h / 2) - 1, w - 6, 3), karm, 1);
  form(g, firkant(x - 3, y + h - 2, w + 6, 5), karm, 1);
}

/** Dør med to fyldninger og håndtag. aaben 0 = lukket, 1 = helt åben (kun sprækken vises). */
export function doer(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, aaben = 0, lysISprækken: string[] = ['#e0c995', '#ffe9a8']) {
  form(g, firkant(x - 4, y - 4, w + 8, h + 4), TRAE);
  const spr = Math.round(w * aaben);
  if (spr > 0) lysfelt(g, firkant(x, y, spr, h), lysISprækken, (px) => 1 - (px - x) / Math.max(1, spr));
  const dx = x + spr;
  const dw = w - spr;
  form(g, firkant(dx, y, dw, h), TRAE_LYS);
  if (dw > 14) {
    form(g, firkant(dx + 5, y + 6, dw - 10, h * 0.38), { kontur: '#4a3426', skygge: '#a96e48', mid: '#8a5a3a', lys: '#6b4a2b' }, 1);
    form(g, firkant(dx + 5, y + h * 0.5, dw - 10, h * 0.42), { kontur: '#4a3426', skygge: '#a96e48', mid: '#8a5a3a', lys: '#6b4a2b' }, 1);
    form(g, ellipse(dx + (aaben > 0 ? 4 : dw - 5), y + h * 0.48, 2, 2), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#e5c03a', lys: '#f0c45a' });
  }
}

const BOGFARVER: Toner[] = [
  { kontur: OMRIDS, skygge: '#8e3428', mid: '#a83b33', lys: '#c0503e' },
  { kontur: OMRIDS, skygge: '#203a6b', mid: '#245c99', lys: '#4f6fa8' },
  { kontur: OMRIDS, skygge: '#8a7656', mid: '#c4ab7c', lys: '#e0c995' },
  { kontur: OMRIDS, skygge: '#3a3560', mid: '#603979', lys: '#6a6487' },
  { kontur: OMRIDS, skygge: '#6b3f27', mid: '#8a5536', lys: '#a96e48' },
];

/** En række bøger på højkant fra x til x + w, med bunden i y. */
export function boeger(g: CanvasRenderingContext2D, x: number, y: number, w: number, hMax = 26, frø = 0) {
  let bx = x;
  let i = frø;
  while (bx < x + w - 5) {
    const bw = 5 + ((i * 7) % 5);
    const bh = hMax - ((i * 5) % 8);
    form(g, firkant(bx, y - bh, Math.min(bw, x + w - bx), bh), BOGFARVER[i % BOGFARVER.length], 1);
    felt(g, bx + 1, y - bh + 4, bw - 2, 1, '#e0c995');
    bx += bw;
    i++;
  }
}

/** Papkasse set lidt oppefra, med flapper. (x, y) er øverste venstre hjørne af forsiden. */
export function papkasse(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  form(g, polygon([[x, y], [x + 10, y - 10], [x + w + 10, y - 10], [x + w, y]]), { kontur: '#5d5243', skygge: '#5d5243', mid: '#8a7656', lys: '#8a7656' }, 1);
  form(g, firkant(x, y, w, h), PAP);
  form(g, polygon([[x + w, y], [x + w + 10, y - 10], [x + w + 10, y + h - 10], [x + w, y + h]]), { kontur: '#5d5243', skygge: '#8a7656', mid: '#a99068', lys: '#a99068' }, 1);
  felt(g, x + w / 2 - 8, y + 2, 16, 2, '#a99068');
}

/** Blækflaske med prop. (x, y) er bunden i midten. */
export function blaekflaske(g: CanvasRenderingContext2D, x: number, y: number) {
  form(g, firkant(x - 10, y - 22, 20, 22, 4), { kontur: '#070912', skygge: '#1a1e36', mid: '#2a2f48', lys: '#3a3560', glans: '#6a6487' });
  form(g, firkant(x - 5, y - 30, 10, 9, 1), TRAE_LYS, 1);
  felt(g, x - 6, y - 17, 2, 8, '#6a6487');
}

/** En løs blyant fra (x1, y1) (spidsen) til (x2, y2). */
export function blyant(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  form(g, kapsel(x1, y1, x2, y2, 2.2), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#f0c45a', lys: '#ffe9a8' });
  form(g, kapsel(x2, y2, x2 + (x2 - x1) * 0.06, y2 + (y2 - y1) * 0.06, 2.4), { kontur: OMRIDS, skygge: '#c0392b', mid: '#e595a9', lys: '#e595a9' }, 1);
  felt(g, Math.round(x1), Math.round(y1), 2, 2, BLAEK);
}
