/**
 * Anden halvdel af minderne (tilbageblik), 320 x 180, i samme rækkefølge som i historien.
 * Tegnet om 26. november 2026 sammen med tidlige.ts: ét tydeligt motiv, lys, omrids og skygge.
 */
import { B, H, faerdig, felt, nytMinde } from './faelles';
import { OMRIDS, ellipse, firkant, fyld, form, kapsel, lysfelt, ordlinjer, polygon, vignet } from './kit';
import { VAEG_AFTEN, VAEG_DAG, bordOppefra, bordplade, gulv, vaeg } from './rum';
import {
  AERME_BARN, AERME_BRUN, HUD, HUD_VOKSEN, PAPIR, TRAE, TRAE_LYS, boeger, bordlampe, doer, haandAaben,
  haandSkriver, haefteAabent, haefteLukket, papkasse, skyggen, vindue,
} from './ting';

const nyt = nytMinde;

/** Skrivebord set forfra med en skuffe. Returnerer skuffens kasse. */
function skrivebord(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, skuffeUd = 0) {
  form(g, firkant(x, y, w, 8, 1), TRAE_LYS);
  form(g, firkant(x + 6, y + 8, w - 12, h - 8), TRAE);
  const sx = x + w / 2 - 40;
  const sy = y + 14;
  if (skuffeUd > 0) {
    fyld(g, firkant(sx, sy, 80, 20), '#1b1b24');
    form(g, polygon([[sx - 6, sy + 20 + skuffeUd], [sx + 86, sy + 20 + skuffeUd], [sx + 80, sy + 20], [sx, sy + 20]]), TRAE, 1);
    form(g, firkant(sx - 6, sy + 20 + skuffeUd, 92, 18, 1), TRAE_LYS, 1);
    form(g, firkant(sx + 36, sy + 26 + skuffeUd, 20, 4, 1), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#e5c03a', lys: '#f0c45a' }, 1);
  } else {
    form(g, firkant(sx, sy, 80, 20, 1), TRAE_LYS, 1);
    form(g, firkant(sx + 30, sy + 8, 20, 4, 1), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#e5c03a', lys: '#f0c45a' }, 1);
  }
  return { sx, sy };
}

/** Skyggen bliver tegnet: sent om aftenen ved skrivebordet. En hånd tegner Skyggen på forsiden af det grønne hæfte. */
export function tegnSkyggen(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 100, VAEG_AFTEN, 70, 60, 230);
  bordplade(g, 100, 70, 100, 230);
  bordlampe(g, 56, 116);
  haefteLukket(g, 112, 108, 120, 66);
  form(g, firkant(146, 116, 52, 48, 2), PAPIR, 1);
  skyggen(g, 172, 138, 15, true);
  haandSkriver(g, 190, 150);
  vignet(g, '#1b1b24', 0.65);
  return faerdig(c, g);
}

/** Fodnoten i hæftet: nederst på siden står noget med meget lille skrift og en stjerne ved siden af. */
export function tegnFodnotenIHaeftet(): HTMLCanvasElement {
  const { c, g } = nyt();
  bordOppefra(g, 70, 30, 300);
  fyld(g, firkant(30, 8, 270, 172, 2), '#4a3426');
  form(g, firkant(26, 4, 270, 176, 2), { ...PAPIR, kontur: '#8a7656' }, 2);
  fyld(g, firkant(26, 4, 6, 176), '#3d7a57');
  ordlinjer(g, 46, 18, 220, 13, 9, '#7a7468', 6);
  // Fodnoten: en tynd streg og små ord.
  felt(g, 46, 140, 80, 1, '#a99068');
  ordlinjer(g, 46, 148, 150, 2, 5, '#2a2f48', 9, false);
  // Stjernen.
  const sx = 218;
  const sy = 151;
  form(g, polygon([[sx, sy - 9], [sx + 3, sy - 3], [sx + 9, sy - 2], [sx + 4, sy + 2], [sx + 6, sy + 9], [sx, sy + 5], [sx - 6, sy + 9], [sx - 4, sy + 2], [sx - 9, sy - 2], [sx - 3, sy - 3]]), { kontur: '#8e3428', skygge: '#c0503e', mid: '#e5c03a', lys: '#f0c45a' }, 1);
  haandSkriver(g, sx + 12, sy + 6);
  vignet(g, '#4a3426', 0.45);
  return faerdig(c, g);
}

/** Hvad skriver du? En vindueskarm i regnvejr, det grønne hæfte på knæene og hænder, der holder det lukket. */
export function tegnVindueskarmen(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, H, VAEG_DAG, 160, 60, 260);
  vindue(g, 30, 6, 260, 116, ['#6a6487', '#a7aab8', '#b9bfcf'], 60);
  form(g, firkant(0, 120, B, 12, 1), TRAE_LYS);
  form(g, firkant(0, 132, B, 48), TRAE);
  // Knæene i blå bukser og hæftet ovenpå.
  form(g, ellipse(116, 178, 44, 28), AERME_BARN);
  form(g, ellipse(206, 178, 44, 28), AERME_BARN);
  haefteLukket(g, 102, 128, 120, 44);
  haandAaben(g, 104, 156, -0.35, [56, H + 24], HUD, AERME_BARN, 1, 0.6);
  haandAaben(g, 220, 152, Math.PI + 0.35, [268, H + 24], HUD, AERME_BARN, 1, 0.6);
  vignet(g, '#5d5243', 0.45);
  return faerdig(c, g);
}

/** Hjørnet bliver foldet: sent om aftenen, det åbne hæfte og hjørnet af siden, der bliver foldet ned. */
export function tegnFoldet(): HTMLCanvasElement {
  const { c, g } = nyt();
  bordOppefra(g, 60, 20, 280);
  const { hoejre } = haefteAabent(g, 26, 22, 252, 146, { venstre: true, hoejre: false });
  const [hx, hy, hw] = hoejre;
  ordlinjer(g, hx + 6, hy + 7, hw - 16, 5, 7, '#7a7468', 3, false);
  ordlinjer(g, hx + 6, hy + 46, 26, 1, 7, '#2a2f48', 8, false);
  // Det foldede hjørne øverst til højre.
  const kx = hx + hw;
  fyld(g, polygon([[kx - 30, hy], [kx, hy], [kx, hy + 30]]), '#4a3426');
  form(g, polygon([[kx - 30, hy], [kx, hy + 30], [kx - 30, hy + 30]]), { kontur: '#8a7656', skygge: '#c4ab7c', mid: '#d9d2bd', lys: '#f3ead2' }, 1);
  haandAaben(g, kx - 10, hy + 46, -Math.PI * 0.6, [B + 10, H + 20], HUD, AERME_BARN, 0.9, 0.5);
  vignet(g, '#1b1b24', 0.6);
  return faerdig(c, g);
}

/** Klatten på siden: en stor blækklat midt på siden, der har fået ben og små øjne, og fyldepennen ved siden af. */
export function tegnKlattenPaaSiden(): HTMLCanvasElement {
  const { c, g } = nyt();
  bordOppefra(g, 160, 60, 300);
  fyld(g, firkant(56, 8, 216, 172, 2), '#4a3426');
  form(g, firkant(52, 4, 216, 176, 2), PAPIR, 2);
  for (let y = 18; y < 176; y += 10) felt(g, 62, y, 196, 1, '#c9dcf2');
  // Klatten: en rund klat med små stænk omkring.
  const klat = [ellipse(160, 84, 30, 24), ellipse(138, 72, 12, 12), ellipse(184, 70, 11, 10), ellipse(182, 98, 12, 10), ellipse(140, 100, 11, 9)];
  for (const k of klat) fyld(g, k, '#070912');
  for (const k of klat) form(g, k, { skygge: '#070912', mid: '#1b1b24', lys: '#2a2f48' }, 2);
  for (const [sx, sy, r] of [[114, 58, 3], [204, 54, 2.5], [210, 112, 3], [120, 118, 2], [168, 46, 2]] as [number, number, number][]) fyld(g, ellipse(sx, sy, r, r), '#1b1b24');
  // Ben og øjne, tegnet med pen.
  for (const bx of [148, 172]) {
    felt(g, bx, 106, 2, 18, '#1b1b24');
    felt(g, bx - 3, 123, 6, 2, '#1b1b24');
  }
  for (const ox of [150, 170]) {
    fyld(g, ellipse(ox, 80, 5, 5.5), '#f4efe0');
    fyld(g, ellipse(ox + 1.5, 81, 2.4, 2.6), '#070912');
  }
  // Fyldepennen.
  form(g, kapsel(214, 150, 286, 122, 4), { kontur: '#070912', skygge: '#1a1e36', mid: '#2a2f48', lys: '#4f4a57' });
  form(g, polygon([[214, 146], [214, 154], [202, 154]]), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#e5c03a', lys: '#f0c45a' }, 1);
  vignet(g, '#4a3426', 0.4);
  return faerdig(c, g);
}

/** Kassen ved døren: et ryddet værelse, en kasse med bøger, der skal gives væk, og noget grønt øverst. */
export function tegnKassenVedDoeren(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 120, VAEG_DAG, 220, 40, 260);
  gulv(g, 120, ['#6b4a2b', '#8a5a3a', '#a96e48', '#c98d63'], 200, 120, 240, 100);
  doer(g, 36, 22, 62, 98);
  // Den tomme skrivebordsskuffe ude til højre.
  skrivebord(g, 240, 70, 90, 50, 12);
  // Kassen med bøger og hæftet øverst.
  boeger(g, 114, 118, 70, 26, 1);
  papkasse(g, 106, 116, 86, 50);
  haefteLukket(g, 120, 96, 52, 18);
  vignet(g, '#5d5243', 0.4);
  return faerdig(c, g);
}

/** Nogen ved skuffen: eftermiddag, skuffen er trukket ud, og to hænder leder mellem papirerne. */
export function tegnSoeskendet(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 70, VAEG_DAG, 60, 10, 260);
  form(g, firkant(10, 66, 300, 10, 1), TRAE_LYS);
  form(g, firkant(20, 76, 280, 104), TRAE);
  // Skuffen set lidt oppefra med papirer i.
  form(g, firkant(50, 92, 220, 76, 2), TRAE, 1);
  lysfelt(g, firkant(56, 98, 208, 60), ['#1b1b24', '#3a2a20', '#4a3426'], (_, y) => (y - 98) / 60);
  for (const [px, py, pw, ph, v] of [[64, 104, 70, 46, 0], [120, 100, 80, 50, 1], [184, 108, 70, 44, 2], [96, 120, 60, 34, 3]] as number[][])
    form(g, polygon([[px + v * 2, py], [px + pw, py + v], [px + pw - v, py + ph], [px, py + ph - v * 2]]), PAPIR, 1);
  ordlinjer(g, 128, 108, 60, 5, 6, '#a99068', 2, false);
  form(g, firkant(50, 156, 220, 18, 1), TRAE_LYS, 1);
  form(g, firkant(146, 162, 28, 4, 1), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#e5c03a', lys: '#f0c45a' }, 1);
  const aerme = { kontur: OMRIDS, skygge: '#7a2e1f', mid: '#8e3428', lys: '#a83b33' };
  haandAaben(g, 110, 120, Math.PI * 0.6, [70, -30], HUD, aerme, 1.1, 0.4);
  haandAaben(g, 212, 124, Math.PI * 0.4, [250, -30], HUD, aerme, 1.1, 0.4);
  vignet(g, '#5d5243', 0.45);
  return faerdig(c, g);
}

/** Kassen på biblioteket: reoler bagved, en kasse med gamle bøger på disken og en stor, rolig hånd, der løfter noget grønt op. */
export function tegnKassenPaaBiblioteket(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 104, VAEG_DAG, 160, 30, 280);
  for (const hy of [36, 70, 104]) {
    form(g, firkant(0, hy, B, 5), TRAE, 1);
    boeger(g, 2, hy, B - 4, 28, hy);
  }
  form(g, firkant(0, 104, B, 10, 1), TRAE_LYS);
  form(g, firkant(0, 114, B, 66), TRAE);
  boeger(g, 52, 114, 96, 24, 3);
  papkasse(g, 44, 112, 110, 52);
  haefteLukket(g, 160, 76, 62, 40, true);
  haandAaben(g, 192, 122, -Math.PI * 0.5, [236, H + 20], HUD_VOKSEN, AERME_BRUN, 1.3, 0.75);
  vignet(g, '#5d5243', 0.4);
  return faerdig(c, g);
}

/** Skyggen på vejen: mange år senere, et busvindue, en våd vej udenfor og en lille skygge, der glider hen over den. */
export function tegnSkyggenPaaVejen(): HTMLCanvasElement {
  const { c, g } = nyt();
  lysfelt(g, firkant(0, 0, B, H), ['#2a2f48', '#3a3560', '#4f4a57'], (_, y) => y / H);
  // Udsigten: grå himmel, træer og vejen.
  const ud = firkant(24, 16, 272, 120, 8);
  lysfelt(g, ud, ['#a7aab8', '#b9bfcf', '#c9dcf2'], (_, y) => 1 - (y - 16) / 70);
  for (let i = 0; i < 9; i++) {
    const tx = 30 + i * 32 + ((i * 7) % 11);
    form(g, polygon([[tx, 84], [tx + 9, 50 + ((i * 5) % 12)], [tx + 18, 84]]), { skygge: '#356c4d', mid: '#468a60', lys: '#5aa572' }, 2);
  }
  fyld(g, firkant(24, 84, 272, 6), '#7a7468');
  lysfelt(g, firkant(24, 90, 272, 46), ['#4f4a57', '#5b5663', '#716b60'], (_, y) => (y - 90) / 46);
  for (let x = 30; x < 290; x += 30) felt(g, x, 112, 16, 2, '#f3ead2');
  fyld(g, ellipse(170, 108, 12, 5), '#2a2f48');
  skyggen(g, 170, 100, 7);
  // Regndråber på ruden og vinduets ramme.
  for (let i = 0; i < 40; i++) felt(g, 30 + ((i * 53) % 260), 20 + ((i * 31) % 110), 1, 3, '#c9dcf2');
  const ramme = { kontur: '#070912', skygge: '#1b1b24', mid: '#2a2f48', lys: '#4f4a57' };
  form(g, firkant(16, 8, 288, 6, 3), ramme, 1);
  form(g, firkant(16, 134, 288, 10, 3), ramme, 1);
  form(g, firkant(156, 12, 6, 126), ramme, 1);
  // Sædet foran.
  form(g, firkant(-10, 150, 180, 40, 10), { kontur: '#070912', skygge: '#203a6b', mid: '#245c99', lys: '#4f6fa8' });
  vignet(g, '#070912', 0.5);
  return faerdig(c, g);
}

/** Skuffen: det grønne hæfte bliver skubbet ind i skuffen så hårdt, at den smækker. */
export function tegnSkuffen(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 60, VAEG_DAG, 260, 0, 280);
  const { sx, sy } = skrivebord(g, 20, 56, 280, 124, 18);
  haefteLukket(g, sx + 4, sy + 14, 58, 22);
  haandAaben(g, sx + 72, sy + 32, Math.PI * 1.45, [sx + 120, H + 30], HUD, AERME_BARN, 1.2, 0.2);
  // Små streger, der viser, at skuffen smækker.
  for (const [lx, ly, l] of [[sx - 18, sy + 26, 10], [sx - 22, sy + 36, 14], [sx - 18, sy + 46, 10]] as number[][]) felt(g, lx, ly, l, 2, '#3a2a20');
  vignet(g, '#5d5243', 0.45);
  return faerdig(c, g);
}

