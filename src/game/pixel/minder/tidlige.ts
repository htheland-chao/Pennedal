/**
 * Første halvdel af minderne (tilbageblik), 320 x 180, i samme rækkefølge som i historien.
 * Tegnet om 26. november 2026 (Henrik: de gamle var svære at se, hvad forestillede): ét tydeligt motiv,
 * lys fra lampen, omrids og skygge. Værktøjet står i kit.ts, tingene i ting.ts og baggrundene i rum.ts.
 */
import { B, H, faerdig, felt, nytMinde } from './faelles';
import { OMRIDS, ellipse, firkant, fyld, form, lysfelt, ordlinjer, polygon, vignet } from './kit';
import { NAT, VAEG_AFTEN, VAEG_DAG, bordOppefra, bordplade, gulv, lysstribe, vaeg, voksdug } from './rum';
import {
  AERME_BARN, AERME_VOKSEN, HUD, HUD_VOKSEN, PAPIR, TRAE, TRAE_LYS, blaekflaske, blyant, bordlampe, doer, haandAaben, haandSkriver,
  haefteAabent, haefteLukket, loftlampe, skyggen, vindue,
} from './ting';

const nyt = nytMinde;

/** Blæk og regn: aften, regn på ruden, lampen over bordet og en hånd, der holder blyanten så hårdt, at knoerne bliver hvide. */
export function tegnBlaek(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 112, VAEG_AFTEN, 180, 30, 210);
  vindue(g, 22, 18, 84, 74, ['#1a1e36', '#2a2f48', '#3a3560'], 34);
  loftlampe(g, 180, 30);
  bordplade(g, 112, 180, 112);
  fyld(g, firkant(106, 124, 132, 52), '#4a3426');
  form(g, firkant(102, 120, 132, 52), PAPIR, 1);
  ordlinjer(g, 110, 128, 110, 4, 7, '#7a7468', 3);
  blaekflaske(g, 272, 136);
  fyld(g, ellipse(150, 162, 4, 2), '#2a2f48');
  haandSkriver(g, 150, 158, HUD, AERME_BARN, true);
  vignet(g, '#1b1b24', 0.7);
  return faerdig(c, g);
}

/** Røde streger: en side med blyantsord og røde streger hen over, og en lille hånd, der vender siden. */
export function tegnStreger(): HTMLCanvasElement {
  const { c, g } = nyt();
  bordOppefra(g, 120, 60);
  const { venstre, hoejre } = haefteAabent(g, 28, 12, 252, 150);
  for (const [sx, sy, sw] of [venstre, hoejre])
    for (let r = 0; r < 8; r++) {
      if ((r * 5 + sx) % 3 === 0) continue;
      const y = sy + 7 + r * 14;
      const x0 = sx + 8 + ((r * 13) % 20);
      const l = 24 + ((r * 17 + sx) % 40);
      for (let i = 0; i < l && x0 + i < sx + sw - 6; i++) felt(g, x0 + i, y + Math.round(Math.sin(i / 2.5)), 1, 2, '#c0392b');
    }
  // Det nederste hjørne af højre side bliver løftet.
  const [hx, hy, hw, hh] = hoejre;
  const kx = hx + hw;
  const ky = hy + hh;
  fyld(g, polygon([[kx - 34, ky], [kx, ky - 30], [kx, ky]]), '#2f6448');
  form(g, polygon([[kx - 34, ky], [kx, ky - 30], [kx - 22, ky - 22]]), { kontur: '#8a7656', skygge: '#c4ab7c', mid: '#d9d2bd', lys: '#f3ead2' }, 1);
  haandAaben(g, kx - 12, ky - 20, Math.PI * 1.15, [B + 20, H + 10], HUD, AERME_BARN, 0.85, 0.4);
  vignet(g, '#3a2a20', 0.5);
  return faerdig(c, g);
}

/** Køkkenbordet: voksdug, gult lampelys, det grønne hæfte med en tegning af Skyggen og en glad hånd, der skriver. */
export function tegnKoekkenbord(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 46, ['#8a7656', '#c4ab7c', '#e0c995', '#f3ead2', '#ffe9a8'], 160, 30, 200);
  loftlampe(g, 160, 30);
  voksdug(g, 46, 160, 40);
  const { venstre, hoejre } = haefteAabent(g, 62, 66, 196, 104, { hoejre: true });
  skyggen(g, venstre[0] + venstre[2] / 2, venstre[1] + venstre[3] / 2 - 2, 22, true);
  haandSkriver(g, hoejre[0] + 50, hoejre[1] + 62);
  vignet(g, '#8a7656', 0.45);
  return faerdig(c, g);
}

/** Viskelæderet: det åbne hæfte, et ord, der er visket ud så mange gange, at papiret er gråt, og viskelæderet. */
export function tegnViskelaeder(): HTMLCanvasElement {
  const { c, g } = nyt();
  voksdug(g, 0, 160, 0);
  const { hoejre } = haefteAabent(g, 20, 14, 280, 156);
  const [hx, hy] = hoejre;
  // Det slidte sted: gråt, tyndt papir med krummer omkring.
  lysfelt(g, ellipse(hx + 64, hy + 66, 34, 10), ['#f3ead2', '#d9d2bd', '#b9bfcf', '#a7aab8'], (x, y) => 1 - Math.hypot((x - hx - 64) / 34, (y - hy - 66) / 10));
  for (let i = 0; i < 14; i++) fyld(g, ellipse(hx + 30 + ((i * 41) % 80), hy + 82 + ((i * 17) % 18), 1.6, 1.2), '#e595a9');
  // Det nye ord, skrevet ved siden af.
  felt(g, hx + 104, hy + 66, 22, 1, '#2a2f48');
  felt(g, hx + 104, hy + 67, 22, 1, '#7a7468');
  // Viskelæderet i en hånd.
  haandAaben(g, hx + 92, hy + 104, Math.PI * 1.25, [B + 20, H + 20], HUD, AERME_BARN, 1, 0.6);
  form(g, firkant(hx + 70, hy + 84, 13, 9, 1), { kontur: OMRIDS, skygge: '#c0503e', mid: '#e595a9', lys: '#f6d7c3' }, 1);
  form(g, firkant(hx + 83, hy + 84, 9, 9, 1), { kontur: OMRIDS, skygge: '#245c99', mid: '#4f6fa8', lys: '#698fc1' }, 1);
  vignet(g, '#a96e48', 0.4);
  return faerdig(c, g);
}

/** En pult med en stol, der står på hovedet ovenpå. */
function pultMedStol(g: CanvasRenderingContext2D, x: number, y: number, w: number) {
  for (const bx of [x + 4, x + w - 8]) form(g, firkant(bx, y, 4, 40), TRAE, 1);
  form(g, firkant(x, y - 6, w, 7, 1), TRAE_LYS);
  // Stolen: sædet ligger på bordet, benene peger op.
  form(g, firkant(x + 8, y - 12, w - 16, 6, 1), TRAE);
  for (const bx of [x + 10, x + w - 14]) form(g, firkant(bx, y - 40, 4, 29), TRAE, 1);
  form(g, firkant(x + 8, y - 44, w - 16, 5, 1), TRAE_LYS, 1);
  // Ryglænet hænger ned foran bordet.
  for (const bx of [x + 12, x + w - 16]) form(g, firkant(bx, y + 1, 4, 18), TRAE, 1);
  form(g, firkant(x + 10, y + 12, w - 20, 8, 1), TRAE_LYS, 1);
}

/** Hæftet på gulvet: et tomt klasseværelse, stole på bordene, det grønne hæfte under et bord og en voksen hånd, der samler det op. */
export function tegnHaeftetPaaGulvet(): HTMLCanvasElement {
  const { c, g } = nyt();
  vaeg(g, 0, 104, VAEG_DAG, 250, 20, 260);
  vindue(g, 200, 14, 100, 66, ['#c9dcf2', '#f4efe0'], 0);
  gulv(g, 104, ['#6b4a2b', '#8a5a3a', '#a96e48', '#c98d63'], 250, 104, 260);
  pultMedStol(g, 18, 112, 70);
  pultMedStol(g, 110, 116, 76);
  // Skyggen fra bordet og hæftet under det.
  lysfelt(g, firkant(104, 156, 92, 14), ['#6b4a2b', '#8a5a3a'], () => 0.2);
  haefteLukket(g, 150, 150, 40, 26, true);
  haandAaben(g, 202, 160, Math.PI * 1.02, [B + 20, 150], HUD_VOKSEN, AERME_VOKSEN, 1.25, 0.5);
  vignet(g, '#5d5243', 0.4);
  return faerdig(c, g);
}

/** Godnathistorien: et mørkt værelse, lampen på natbordet, en bog i et par voksne hænder og en drøm om Skyggen. */
export function tegnGodnat(): HTMLCanvasElement {
  const { c, g } = nyt();
  lysfelt(g, firkant(0, 0, B, H), [...NAT, '#4a3426', '#8a7656', '#c4ab7c'], (x, y) => Math.max(0.12 + (1 - y / H) * 0.12, 1.15 - Math.hypot(x - 52, (y - 70) * 1.2) / 120));
  // Natbordet og lampen.
  form(g, firkant(20, 112, 66, 68), TRAE_LYS);
  form(g, firkant(26, 132, 54, 18, 1), TRAE, 1);
  bordlampe(g, 52, 112);
  // Sengen: pude og dyne.
  form(g, firkant(96, 118, 240, 70, 6), TRAE);
  form(g, firkant(104, 112, 70, 26, 8), PAPIR);
  form(g, polygon([[110, 140], [330, 128], [330, 190], [100, 190]]), { kontur: '#1a1e36', skygge: '#203a6b', mid: '#28467c', lys: '#4f6fa8' });
  for (let x = 130; x < B; x += 26) felt(g, x, 140 - Math.round((x - 110) * 0.055), 1, 50, '#203a6b');
  // Bogen i lyset, holdt af en voksen.
  haandAaben(g, 160, 136, -Math.PI * 0.4, [130, H + 20], HUD_VOKSEN, AERME_VOKSEN, 1, 0.7);
  form(g, polygon([[150, 132], [186, 122], [222, 132], [222, 108], [186, 98], [150, 108]]), { kontur: OMRIDS, skygge: '#d9d2bd', mid: '#f3ead2', lys: '#f4efe0' }, 1);
  felt(g, 186, 99, 1, 28, '#c4ab7c');
  ordlinjer(g, 156, 112, 24, 3, 5, '#a99068', 1, false);
  ordlinjer(g, 192, 108, 24, 3, 5, '#a99068', 4, false);
  haandAaben(g, 228, 130, -Math.PI * 0.62, [250, H + 20], HUD_VOKSEN, AERME_VOKSEN, 1, 0.7);
  // Drømmen: små bobler op mod Skyggen.
  for (const [bx, by, br] of [[224, 92, 3], [236, 76, 4.5], [248, 62, 6]] as [number, number, number][]) form(g, ellipse(bx, by, br, br), { kontur: '#3a3560', skygge: '#2a2f48', mid: '#2a2f48', lys: '#6a6487' }, 1);
  form(g, ellipse(276, 40, 26, 22), { kontur: '#6a6487', skygge: '#2a2f48', mid: '#2a2f48', lys: '#3a3560' }, 1);
  skyggen(g, 276, 40, 12);
  vignet(g, '#070912', 0.6);
  return faerdig(c, g);
}

/** Skyggen i margenen: et ternet hæfte til matematik med tal i rækker og en lille Skygge ude i margenen. */
export function tegnSkyggenIMargenen(): HTMLCanvasElement {
  const { c, g } = nyt();
  bordOppefra(g, 60, 20, 300, ['#6b4a2b', '#8a5a3a', '#a96e48', '#c98d63', '#e0a982']);
  fyld(g, firkant(42, 14, 240, 160, 2), '#4a3426');
  form(g, firkant(38, 10, 240, 160, 2), PAPIR, 1);
  for (let x = 44; x < 274; x += 6) felt(g, x, 12, 1, 156, '#c9dcf2');
  for (let y = 16; y < 168; y += 6) felt(g, 40, y, 236, 1, '#c9dcf2');
  felt(g, 226, 12, 1, 156, '#e595a9');
  // Tallene: små streger i søjler, som regnestykker.
  for (let r = 0; r < 11; r++)
    for (let k = 0; k < 6; k++) if ((r * 7 + k * 3) % 5 !== 0) felt(g, 50 + k * 28, 22 + r * 12, 3 + ((r + k) % 3) * 4, 2, '#2a2f48');
  // Den udviskede Skygge og den nye.
  lysfelt(g, ellipse(252, 46, 11, 11), ['#f3ead2', '#d9d2bd', '#b9bfcf'], () => 0.6);
  skyggen(g, 251, 104, 10, true);
  blyant(g, 262, 130, 300, 168);
  vignet(g, '#4a3426', 0.4);
  return faerdig(c, g);
}

/** Døren på klem: et mørkt værelse, en stribe lys fra døren hen over gulvet, en skikkelse i døråbningen og skrivebordet med skuffen. */
export function tegnDoerenPaaKlem(): HTMLCanvasElement {
  const { c, g } = nyt();
  lysfelt(g, firkant(0, 0, B, 128), NAT, (x, y) => 0.55 - Math.hypot(x - 60, y - 70) / 400);
  gulv(g, 128, ['#070912', '#1a1e36', '#2a2f48'], 60, 128, 260, 60);
  doer(g, 34, 22, 52, 106, 0.38, ['#c4ab7c', '#e0c995', '#ffe9a8']);
  // Skikkelsen i sprækken: et mørkt omrids mod lyset.
  fyld(g, ellipse(43, 46, 5, 6), '#1b1b24');
  fyld(g, firkant(37, 52, 13, 76, 4), '#1b1b24');
  lysstribe(g, [[34, 128], [54, 128], [300, 180], [150, 180]]);
  // Skrivebordet i lysstriben.
  form(g, firkant(196, 84, 106, 8, 1), TRAE_LYS);
  form(g, firkant(204, 92, 90, 44), TRAE);
  form(g, firkant(214, 100, 70, 16, 1), TRAE_LYS, 1);
  form(g, firkant(244, 106, 10, 3, 1), { kontur: OMRIDS, skygge: '#d9b56f', mid: '#e5c03a', lys: '#f0c45a' }, 1);
  form(g, firkant(208, 136, 6, 20), TRAE, 1);
  form(g, firkant(284, 136, 6, 20), TRAE, 1);
  vignet(g, '#070912', 0.6);
  return faerdig(c, g);
}

