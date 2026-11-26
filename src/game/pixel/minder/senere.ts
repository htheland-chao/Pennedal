/**
 * Anden halvdel af minderne (tilbageblik), 320 x 180, i samme rækkefølge som i historien.
 * Delt ud af minder.ts 16. november 2026. Fælles farver og hånden står i faelles.ts.
 */
import { hash, lerred } from '../lerred';
import { B, H, P, felt, haandMedBlyant } from './faelles';

/** Kapitel 5, Skyggen bliver tegnet: skrivebordet om aftenen, det grønne hæfte og en lille skygge på forsiden. Blyanten ligger stille. */
export function tegnSkyggen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.93 ? '#2a2f48' : '#1a1e36');
  // Lyskeglen fra lampen.
  for (let y = 20; y < 120; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot((x - 160) / 1.8, y - 120);
      if (d < 70) felt(g, x, y, 1, 1, '#4a3426');
      else if (d < 86 && (x + y) % 2 === 0) felt(g, x, y, 1, 1, '#2a2f48');
    }
  // Bordpladen.
  felt(g, 0, 120, B, 60, '#6b4a2b');
  for (let x = 0; x < B; x += 3) if (hash(x, 1) > 0.5) felt(g, x, 124 + Math.floor(hash(x, 2) * 40), 2, 1, '#6b3f27');
  // Hæftet, grønt omslag, åbent.
  felt(g, 70, 70, 180, 90, P.kontur);
  felt(g, 72, 72, 86, 86, P.papir);
  felt(g, 162, 72, 86, 86, P.papir);
  felt(g, 158, 72, 4, 86, '#3d7a57');
  for (let r = 0; r < 7; r++) felt(g, 78, 80 + r * 9, 70 - (r === 6 ? 40 : 0), 1, '#7a7468');
  // Skyggen tegnet på højre side: rund, med store øjne.
  for (let y = -16; y <= 16; y++) for (let x = -14; x <= 14; x++) if ((x * x) / 196 + (y * y) / 256 <= 1) felt(g, 205 + x, 112 + y, 1, 1, hash(x + 50, y) > 0.15 ? '#3a3560' : '#5b5663');
  for (const ox of [-6, 6]) {
    felt(g, 202 + ox, 104, 6, 6, P.papir);
    felt(g, 204 + ox, 106, 3, 3, '#222222');
  }
  // Blyanten ligger stille ved den sidste, korte linje.
  haandMedBlyant(g, 112, 126, 2);
  return c;
}

/** Skår 5a, Fodnoten i hæftet: en side med linjer og nederst en lille, lille skrift og en stjerne. */
export function tegnFodnotenIHaeftet(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.92 ? '#a99068' : '#c4ab7c');
  felt(g, 40, 6, 240, 168, P.kontur);
  felt(g, 41, 7, 238, 166, P.papir);
  felt(g, 41, 7, 6, 166, '#3d7a57');
  for (let r = 0; r < 11; r++) for (let k = 0; k < 5; k++) if (hash(r + 9, k) > 0.15) felt(g, 58 + k * 42, 18 + r * 11, 34, 2, '#4f4a57');
  // En streg over fodnoten.
  felt(g, 58, 145, 60, 1, '#7a7468');
  // Den lille skrift nederst.
  for (let k = 0; k < 14; k++) felt(g, 60 + k * 12, 152, 9, 1, '#4f4a57');
  for (let k = 0; k < 8; k++) felt(g, 60 + k * 12, 158, 9, 1, '#4f4a57');
  // Stjernen.
  const sx = 166;
  const sy = 156;
  felt(g, sx - 1, sy - 5, 3, 11, P.roed);
  felt(g, sx - 5, sy - 1, 11, 3, P.roed);
  felt(g, sx - 3, sy - 3, 2, 2, P.roed);
  felt(g, sx + 2, sy - 3, 2, 2, P.roed);
  felt(g, sx - 3, sy + 2, 2, 2, P.roed);
  felt(g, sx + 2, sy + 2, 2, 2, P.roed);
  return c;
}

/** Skår 5b, Hvad skriver du?: vindueskarmen, regn på ruden og et lukket, grønt hæfte på knæene. Ingen ansigter. */
export function tegnVindueskarmen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Ruden: grå himmel med regndråber.
  felt(g, 0, 0, B, 120, '#a7aab8');
  for (let y = 0; y < 120; y++) for (let x = 0; x < B; x++) if (hash(x, y) > 0.985) felt(g, x, y, 1, 3, '#c9dcf2');
  // Vinduesrammen.
  felt(g, 0, 0, B, 6, '#d9d2bd');
  felt(g, 156, 0, 8, 120, '#d9d2bd');
  felt(g, 0, 114, B, 10, '#d9d2bd');
  // Karmen og væggen.
  felt(g, 0, 124, B, 56, '#c4ab7c');
  for (let y = 124; y < H; y++) for (let x = 0; x < B; x++) if (hash(x + 3, y) > 0.95) felt(g, x, y, 1, 1, '#a99068');
  // Knæene under et tæppe og det lukkede hæfte.
  felt(g, 90, 120, 140, 44, P.kontur);
  felt(g, 92, 122, 136, 40, '#a96e48');
  felt(g, 120, 110, 80, 24, P.kontur);
  felt(g, 122, 112, 76, 20, '#3d7a57');
  felt(g, 122, 112, 76, 2, '#5aa572');
  // Hænderne holder hæftet lukket.
  felt(g, 112, 116, 14, 12, P.hud);
  felt(g, 194, 116, 14, 12, P.hud);
  felt(g, 112, 126, 14, 2, P.hudSkygge);
  felt(g, 194, 126, 14, 2, P.hudSkygge);
  return c;
}

/** Kapitel 6, Hjørnet bliver foldet: en side i det grønne hæfte, hvor det øverste hjørne er foldet ned. Det er sent. */
export function tegnFoldet(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.94 ? '#2a2f48' : '#1a1e36');
  // Bordet i lampens lys.
  for (let y = 60; y < H; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot((x - 160) / 1.7, y - 120);
      felt(g, x, y, 1, 1, d < 80 ? '#6b4a2b' : d < 96 && (x + y) % 2 === 0 ? '#6b3f27' : '#3a2a20');
    }
  // Siden.
  felt(g, 90, 30, 140, 130, P.kontur);
  felt(g, 92, 32, 136, 126, P.papir);
  felt(g, 92, 32, 4, 126, '#3d7a57');
  for (let r = 0; r < 9; r++) felt(g, 104, 46 + r * 11, r === 8 ? 40 : 110, 2, '#4f4a57');
  // Det foldede hjørne: en trekant, der er bøjet ned over siden.
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 30 - y; x++) {
      felt(g, 228 - x, 32 + y, 1, 1, '#1a1e36');
      if (x < 30 - y - 1) felt(g, 198 + y, 32 + x, 1, 1, x + y > 26 ? P.kontur : '#d9d2bd');
    }
  for (let i = 0; i < 30; i++) felt(g, 198 + i, 32 + i, 1, 1, P.kontur);
  // En finger, der holder hjørnet nede.
  felt(g, 214, 36, 16, 8, P.hud);
  felt(g, 214, 43, 16, 2, P.hudSkygge);
  felt(g, 226, 36, 4, 8, P.hudLys);
  return c;
}

/** Skår 6a, Klatten på siden: en side med en stor blækklat, der har fået tegnet ben og små øjne på. Fyldepennen ligger ved siden af. */
export function tegnKlattenPaaSiden(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.92 ? '#a99068' : '#c4ab7c');
  felt(g, 50, 8, 220, 164, P.kontur);
  felt(g, 51, 9, 218, 162, P.papir);
  for (let r = 0; r < 13; r++) if (r < 4 || r > 9) felt(g, 64, 20 + r * 12, 190, 1, '#c9dcf2');
  // Klatten: en rund klat med sprøjt omkring.
  for (let y = -26; y <= 26; y++)
    for (let x = -30; x <= 30; x++) {
      const v = Math.atan2(y, x);
      const r = 22 + Math.sin(v * 5) * 3 + Math.sin(v * 9 + 1) * 2;
      if (Math.hypot(x, y * 1.1) <= r) felt(g, 160 + x, 92 + y, 1, 1, '#1a1e36');
    }
  for (const [x, y, r] of [[112, 70, 4], [205, 112, 3], [196, 60, 2], [124, 120, 3]])
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) felt(g, x + xx, y + yy, 1, 1, '#1a1e36');
  // Øjnene og benene, tegnet med blyant.
  for (const ox of [-8, 8]) {
    felt(g, 156 + ox, 84, 7, 7, '#f4efe0');
    felt(g, 158 + ox, 86, 3, 3, '#070912');
  }
  for (const ox of [-10, 8]) {
    felt(g, 160 + ox, 114, 2, 16, '#4f4a57');
    felt(g, 160 + ox - 2, 129, 6, 2, '#4f4a57');
  }
  // Fyldepennen.
  for (let i = 0; i < 70; i++) felt(g, 230 - i, 160 - Math.floor(i * 0.35), 4, 3, i < 12 ? '#c4ab7c' : '#2a2f48');
  return c;
}

/** Skår 6b, Kassen ved døren: en papkasse med bøger ved en dør, og øverst noget grønt. Ingen ansigter. */
export function tegnKassenVedDoeren(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, y < 130 ? (hash(x, y) > 0.95 ? '#c4ab7c' : '#e0c995') : (x + (y >> 2) * 3) % 24 === 0 ? '#7a4e33' : '#a96e48');
  // Døren.
  felt(g, 40, 10, 84, 122, P.kontur);
  felt(g, 44, 14, 76, 118, '#a99068');
  felt(g, 52, 24, 60, 40, '#a96e48');
  felt(g, 52, 74, 60, 50, '#a96e48');
  felt(g, 108, 76, 6, 6, '#e5c03a');
  // Kassen.
  felt(g, 150, 92, 120, 70, P.kontur);
  felt(g, 152, 94, 116, 66, '#c4ab7c');
  felt(g, 152, 94, 116, 4, '#e0c995');
  felt(g, 140, 86, 20, 10, '#a99068');
  felt(g, 260, 86, 20, 10, '#a99068');
  // Bøger, der stikker op, og øverst det grønne hæfte.
  const ryg = ['#c0503e', '#2c6fbb', '#7b4bb3', '#e5c03a', '#3d7a57'];
  for (let i = 0; i < 9; i++) felt(g, 160 + i * 11, 72 + (i % 3) * 4, 9, 24, ryg[i % ryg.length]);
  felt(g, 186, 64, 60, 12, P.kontur);
  felt(g, 187, 65, 58, 10, '#3d7a57');
  felt(g, 187, 65, 58, 2, '#5aa572');
  return c;
}

/** Kapitel 7, Søskendet: en åben skuffe i et skrivebord og to hænder, der leder mellem papirerne. Ingen ansigter. */
export function tegnSoeskendet(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.94 ? '#c4ab7c' : '#e0c995');
  // Skrivebordet.
  felt(g, 30, 40, 260, 20, P.kontur);
  felt(g, 32, 42, 256, 16, '#8a7656');
  felt(g, 40, 60, 240, 120, P.kontur);
  felt(g, 42, 62, 236, 118, '#6b4a2b');
  // Den åbne skuffe.
  felt(g, 70, 96, 180, 70, P.kontur);
  felt(g, 72, 98, 176, 66, '#8a5a3a');
  felt(g, 80, 104, 160, 50, '#4a3426');
  // Papirer i skuffen, men intet grønt.
  for (const [x, y, w, h, f] of [[90, 110, 50, 30, P.papir], [130, 116, 60, 26, P.papirSkygge], [190, 108, 40, 34, P.papir]] as const) felt(g, x, y, w, h, f);
  for (let r = 0; r < 3; r++) felt(g, 94, 116 + r * 7, 40, 1, P.linje);
  // To hænder, der leder.
  for (const [x, y] of [[110, 100], [196, 98]] as const) {
    felt(g, x, y, 22, 14, P.hud);
    felt(g, x, y + 12, 22, 2, P.hudSkygge);
    felt(g, x + 4, y - 6, 5, 8, P.hud);
    felt(g, x + 11, y - 7, 5, 9, P.hud);
  }
  return c;
}

/** Skår 7a, Kassen på biblioteket: en disk, en kasse med bøger og en stor hånd, der holder det grønne hæfte. */
export function tegnKassenPaaBiblioteket(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, y < 70 ? (x % 40 < 2 ? '#4a3426' : hash(x, y) > 0.9 ? '#c0503e' : '#8a7656') : '#e0c995');
  // Disken.
  felt(g, 0, 120, B, 60, P.kontur);
  felt(g, 0, 122, B, 58, '#a96e48');
  // Kassen.
  felt(g, 60, 80, 110, 44, P.kontur);
  felt(g, 62, 82, 106, 40, '#c4ab7c');
  const ryg = ['#c0503e', '#2c6fbb', '#7b4bb3', '#e5c03a'];
  for (let i = 0; i < 8; i++) felt(g, 66 + i * 12, 70, 10, 14, ryg[i % 4]);
  // Hånden med hæftet.
  felt(g, 200, 70, 70, 46, P.kontur);
  felt(g, 202, 72, 66, 42, '#3d7a57');
  felt(g, 202, 72, 66, 3, '#5aa572');
  felt(g, 192, 96, 26, 22, P.hud);
  felt(g, 192, 116, 26, 3, P.hudSkygge);
  felt(g, 210, 92, 14, 6, P.hud);
  return c;
}

/** Skår 7b, Skyggen på vejen: et busvindue med regnstriber, en vej og en lille skygge, der glider forbi. */
export function tegnSkyggenPaaVejen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  felt(g, 0, 0, B, H, '#2a2f48');
  // Vinduet.
  felt(g, 30, 20, 260, 130, '#222222');
  for (let y = 24; y < 146; y++)
    for (let x = 34; x < 286; x++) {
      const f = y < 90 ? (hash(x >> 3, y >> 3) > 0.5 ? '#a7aab8' : '#b9bfcf') : y < 96 ? '#7a7468' : '#5b5663';
      felt(g, x, y, 1, 1, f);
    }
  // Vejen med striber.
  for (let x = 40; x < 280; x += 30) felt(g, x, 120, 16, 3, '#f3ead2');
  // Skyggen på vejen: rund med to små, lyse øjne.
  for (let y = -8; y <= 8; y++) for (let x = -10; x <= 10; x++) if ((x * x) / 100 + (y * y) / 64 <= 1) felt(g, 180 + x, 108 + y, 1, 1, '#2a2f48');
  for (const ox of [-4, 4]) felt(g, 180 + ox, 105, 2, 2, '#f4efe0');
  // Regnstriber på ruden.
  for (let i = 0; i < 40; i++) felt(g, 40 + Math.floor(hash(i, 3) * 240), 26 + Math.floor(hash(i, 5) * 100), 1, 6, '#c9dcf2');
  // Vinduesrammen.
  felt(g, 158, 20, 4, 130, '#222222');
  return c;
}

/** Kapitel 8, Skuffen: en hånd skubber det grønne hæfte ind i en skuffe. Ingen ansigter. */
export function tegnSkuffen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.94 ? '#c4ab7c' : '#e0c995');
  // Skrivebordet forfra med en halvt lukket skuffe.
  felt(g, 20, 30, 280, 150, P.kontur);
  felt(g, 22, 32, 276, 146, '#6b4a2b');
  felt(g, 60, 80, 200, 60, P.kontur);
  felt(g, 62, 82, 196, 56, '#8a7656');
  felt(g, 70, 90, 180, 14, '#3a2a20');
  felt(g, 150, 118, 20, 6, '#e5c03a');
  // Hæftet, der forsvinder ind i skuffen.
  felt(g, 110, 76, 80, 18, P.kontur);
  felt(g, 111, 77, 78, 16, '#3d7a57');
  felt(g, 111, 77, 78, 2, '#5aa572');
  // Hånden, der skubber.
  felt(g, 186, 70, 30, 22, P.hud);
  felt(g, 186, 90, 30, 3, P.hudSkygge);
  felt(g, 182, 74, 8, 10, P.hud);
  return c;
}
