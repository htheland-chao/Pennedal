/**
 * Første halvdel af minderne (tilbageblik), 320 x 180, i samme rækkefølge som i historien.
 * Delt ud af minder.ts 16. november 2026. Fælles farver og hånden står i faelles.ts.
 */
import { hash, lerred } from '../lerred';
import { B, H, P, felt, haandMedBlyant } from './faelles';

/** Blæk og regn: en rude med regn, lampens lys, en blækflaske og en hånd, der holder en blyant for hårdt. */
export function tegnBlaek(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Væggen i lampelys: lysest i midten.
  for (let y = 0; y < 112; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot(x - 170, y - 30) / 190 + hash(x, y) * 0.08;
      felt(g, x, y, 1, 1, d < 0.45 ? P.lys : d < 0.7 ? P.mellem : d < 0.95 ? P.moerk : P.skygge);
    }
  // Ruden med regn.
  felt(g, 22, 14, 92, 74, P.kontur);
  felt(g, 26, 18, 84, 66, '#a7aab8');
  for (let y = 18; y < 84; y++) if (y % 3 === 0) felt(g, 26, y, 84, 1, '#a7aab8');
  felt(g, 66, 18, 4, 66, P.kontur);
  felt(g, 26, 49, 84, 3, P.kontur);
  for (let i = 0; i < 70; i++) {
    const x = 26 + Math.floor(hash(i, 31) * 84);
    const y = 18 + Math.floor(hash(i, 32) * 60);
    felt(g, x, y, 1, 2 + Math.floor(hash(i, 33) * 4), hash(i, 34) > 0.5 ? '#c9dcf2' : '#b9bfcf');
  }
  // Bordpladen.
  felt(g, 0, 112, B, 68, P.skygge);
  felt(g, 0, 112, B, 3, P.moerk);
  for (let x = 0; x < B; x += 2) for (let y = 118; y < H; y += 7) if (hash(x, y) > 0.6) felt(g, x, y, 2, 1, '#8a7656');
  // Et ark papir på bordet.
  felt(g, 120, 120, 120, 52, P.papirSkygge);
  felt(g, 118, 118, 120, 52, P.papir);
  for (let r = 0; r < 5; r++) felt(g, 126, 126 + r * 9, 100, 1, P.linje);
  // Blækflasken.
  felt(g, 262, 92, 26, 26, P.kontur);
  felt(g, 263, 93, 24, 24, P.blaek);
  felt(g, 266, 96, 4, 14, '#6a6487');
  felt(g, 268, 84, 14, 9, P.kontur);
  felt(g, 269, 85, 12, 7, '#8a5a3a');
  // En lille blækplet på papiret.
  for (let i = 0; i < 18; i++) felt(g, 214 + Math.floor(hash(i, 41) * 8), 150 + Math.floor(hash(i, 42) * 6), 2, 2, P.blaek);
  haandMedBlyant(g, 178, 160);
  return c;
}

/** Røde streger: en side fuld af ulæselige ord med røde streger hen over og en lille hånd, der vender siden. */
export function tegnStreger(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Bordet bagved.
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x >> 1, y >> 1) > 0.85 ? P.moerk : P.skygge);
  // Hæftet: grønt omslag under siden.
  felt(g, 54, 10, 214, 164, P.kontur);
  felt(g, 55, 11, 212, 162, '#4f9467');
  // Siden.
  felt(g, 64, 16, 194, 150, P.papirSkygge);
  felt(g, 62, 14, 194, 150, P.papir);
  // Ordene: korte grå streger, der ikke kan læses.
  for (let r = 0; r < 12; r++) {
    const y = 26 + r * 11;
    let x = 72 + Math.floor(hash(r, 51) * 8);
    while (x < 236) {
      const w = 6 + Math.floor(hash(x, r) * 18);
      if (x + w > 244) break;
      felt(g, x, y, w, 2, P.linje);
      x += w + 4;
    }
  }
  // Røde streger hen over nogle af ordene.
  const roedStreg = (x: number, y: number, l: number) => {
    for (let i = 0; i < l; i++) felt(g, x + i, y + Math.round(Math.sin(i / 3)), 1, 2, P.roed);
  };
  [[80, 26, 30], [150, 37, 40], [96, 59, 26], [180, 70, 36], [74, 92, 44], [140, 103, 30], [200, 125, 30], [100, 136, 24]].forEach(([x, y, l]) =>
    roedStreg(x, y, l),
  );
  // Hjørnet bliver løftet: en trekant af sidens bagside.
  for (let i = 0; i < 30; i++) {
    felt(g, 256 - i, 164 - 30 + i, i + 1, 1, P.papirSkygge);
    felt(g, 256 - i, 164 - 30 + i, 1, 1, P.linje);
  }
  // En lille hånd ved hjørnet.
  felt(g, 252, 140, 30, 22, P.kontur);
  felt(g, 253, 141, 28, 20, P.hud);
  felt(g, 253, 141, 28, 4, P.hudLys);
  for (let f = 0; f < 3; f++) {
    felt(g, 244, 140 + f * 6, 10, 5, P.kontur);
    felt(g, 245, 141 + f * 6, 9, 3, P.hud);
  }
  felt(g, 278, 136, 42, 34, P.kontur);
  felt(g, 279, 137, 41, 32, '#c98d63');
  return c;
}

/** Køkkenbordet: en ternet voksdug, et åbent grønt hæfte med en tegning af en skygge med store øjne og en glad hånd, der skriver. */
export function tegnKoekkenbord(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Væggen og lampens gule lys foroven.
  for (let y = 0; y < 44; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot(x - 160, y + 10) / 170 + hash(x, y) * 0.06;
      felt(g, x, y, 1, 1, d < 0.45 ? '#ffe9a8' : d < 0.75 ? P.lys : P.mellem);
    }
  // Voksdugen: tern i falmet rødt og creme, lidt i perspektiv (tættere tern forrest).
  for (let y = 44; y < H; y++) {
    const t = (y - 44) / (H - 44);
    const str = 8 + Math.floor(t * 10);
    for (let x = 0; x < B; x++) {
      const tx = Math.floor((x - 160) / str + 100);
      const ty = Math.floor((y - 44) / (6 + t * 8));
      const roed = (tx + ty) % 2 === 0;
      felt(g, x, y, 1, 1, roed ? (hash(x, y) > 0.9 ? '#c98d63' : '#e0a982') : hash(x, y) > 0.9 ? '#d9d2bd' : '#f3ead2');
    }
  }
  felt(g, 0, 44, B, 2, P.moerk);
  // Hæftet: grønt omslag og to åbne sider.
  felt(g, 66, 64, 190, 104, P.kontur);
  felt(g, 67, 65, 188, 102, '#4f9467');
  felt(g, 72, 68, 88, 96, P.papir);
  felt(g, 162, 68, 88, 96, P.papir);
  felt(g, 160, 68, 2, 96, P.papirSkygge);
  // Venstre side: barnets tegning af en skygge med store, runde øjne. En skæv, blød klat, der læner sig
  // til siden og løber ud i en tynd hale, som en skygge på en væg. Tegnet til Pennedal.
  for (let y = -24; y <= 26; y++)
    for (let x = -26; x <= 24; x++) {
      const skaev = x + y * 0.25;
      const krop = (skaev * skaev) / (20 * 20) + ((y + 4) * (y + 4)) / (24 * 24) <= 1;
      const hale = y > 8 && y < 26 && Math.abs(skaev + 14 + (y - 8) * 0.6) < 4 - (y - 8) / 6;
      if (krop || hale) felt(g, 116 + x, 112 + y, 1, 1, hash(x, y) > 0.93 ? '#5b5663' : '#4f4a57');
    }
  for (const ox of [-9, 9]) {
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) felt(g, 116 + ox + x, 104 + y, 1, 1, '#f4efe0');
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 4) felt(g, 116 + ox + x + 1, 105 + y, 1, 1, '#222222');
  }
  // Højre side: linjer med ord, der vælter lidt (streger, ingen bogstaver).
  for (let r = 0; r < 8; r++) {
    const y = 78 + r * 10;
    let x = 168;
    while (x < 240 && !(r === 7 && x > 200)) {
      const w = 5 + Math.floor(hash(x, r + 7) * 12);
      if (x + w > 244) break;
      const haeld = hash(x, r) > 0.6 ? 1 : 0;
      for (let i = 0; i < w; i++) felt(g, x + i, y + (i > w / 2 ? haeld : 0), 1, 2, '#7a7468');
      x += w + 4;
    }
  }
  haandMedBlyant(g, 214, 152, 2);
  return c;
}


/** Skår 3a, Viskelæderet: det grønne hæfte på køkkenbordet, et gråt, tyndslidt sted på siden og et viskelæder med krummer. */
export function tegnViskelaeder(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Voksdugen tæt på: store, falmede tern.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < B; x++) {
      const roed = (Math.floor(x / 22) + Math.floor(y / 22)) % 2 === 0;
      felt(g, x, y, 1, 1, roed ? (hash(x, y) > 0.9 ? '#c98d63' : '#e0a982') : hash(x, y) > 0.9 ? '#d9d2bd' : '#f3ead2');
    }
  // Hæftet, åbent og skråt.
  felt(g, 40, 24, 220, 136, P.kontur);
  felt(g, 41, 25, 218, 134, '#4f9467');
  felt(g, 46, 28, 104, 128, P.papir);
  felt(g, 150, 28, 104, 128, P.papir);
  felt(g, 148, 28, 2, 128, P.papirSkygge);
  // Linjer med streger (ingen bogstaver). Ét sted er gnedet gråt og tyndt.
  for (let r = 0; r < 10; r++) {
    const y = 40 + r * 11;
    for (let x = 54; x < 142; x++) if (hash(x >> 3, r) > 0.25) felt(g, x, y, 1, 2, '#7a7468');
    for (let x = 158; x < 246; x++) if (hash((x >> 3) + 50, r) > 0.25 && !(r === 4 && x > 180 && x < 226)) felt(g, x, y, 1, 2, '#7a7468');
  }
  for (let y = 78; y < 96; y++)
    for (let x = 176; x < 230; x++) {
      const d = Math.hypot((x - 203) / 27, (y - 87) / 9);
      if (d < 1) felt(g, x, y, 1, 1, hash(x, y) > 0.5 ? '#d9d2bd' : '#c4ab7c');
    }
  // Et nyt, lettere ord skrevet ovenover.
  for (let x = 184; x < 214; x++) felt(g, x, 75, 1, 2, '#4f4a57');
  // Viskelæderet og krummerne.
  felt(g, 236, 112, 46, 22, P.kontur);
  felt(g, 237, 113, 44, 20, '#e595a9');
  felt(g, 259, 113, 22, 20, '#698fc1');
  for (let i = 0; i < 26; i++) felt(g, 186 + Math.floor(hash(i, 3) * 60), 98 + Math.floor(hash(i, 4) * 26), 2, 1, '#d9d2bd');
  return c;
}

/** Skår 3b, Hæftet på gulvet: et tomt klasseværelse, stole oppe på bordene og et grønt hæfte på gulvet. En voksen hånd. */
export function tegnHaeftetPaaGulvet(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Væg og gulv.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < B; x++) {
      if (y < 70) felt(g, x, y, 1, 1, hash(x, y) > 0.92 ? P.mellem : P.lys);
      else felt(g, x, y, 1, 1, (Math.floor(x / 40) + (y > 120 ? 1 : 0)) % 2 === 0 ? (hash(x, y) > 0.9 ? P.moerk : P.mellem) : hash(x, y) > 0.9 ? P.skygge : P.moerk);
    }
  // Vinduet med eftermiddagslys.
  felt(g, 210, 10, 90, 50, P.kontur);
  felt(g, 212, 12, 86, 46, '#ffe9a8');
  felt(g, 254, 12, 2, 46, P.kontur);
  // Borde med stole på hovedet.
  for (const bx of [20, 120]) {
    felt(g, bx, 72, 80, 8, P.kontur);
    felt(g, bx + 1, 73, 78, 6, '#c4ab7c');
    for (const lx of [bx + 4, bx + 72]) felt(g, lx, 80, 4, 40, P.kontur);
    // Stolen oppe på bordet.
    felt(g, bx + 18, 46, 44, 6, P.kontur);
    felt(g, bx + 19, 47, 42, 4, '#8a7656');
    for (const sx of [bx + 22, bx + 54]) felt(g, sx, 52, 3, 20, P.kontur);
  }
  // Hæftet på gulvet under bordet.
  felt(g, 150, 136, 54, 34, P.kontur);
  felt(g, 151, 137, 52, 32, '#4f9467');
  // Skyggen med store øjne på forsiden.
  for (let y = -8; y <= 8; y++) for (let x = -10; x <= 10; x++) if ((x * x) / 100 + (y * y) / 64 <= 1) felt(g, 177 + x, 153 + y, 1, 1, '#4f4a57');
  for (const ox of [-4, 4]) {
    felt(g, 176 + ox, 149, 3, 3, '#f4efe0');
    felt(g, 177 + ox, 150, 1, 1, '#222222');
  }
  // En voksen hånd, der rækker ned efter det.
  felt(g, 196, 104, 40, 26, P.kontur);
  felt(g, 197, 105, 38, 24, P.hud);
  felt(g, 197, 105, 38, 5, P.hudLys);
  for (let f = 0; f < 4; f++) {
    felt(g, 198 + f * 9, 129, 8, 12, P.kontur);
    felt(g, 199 + f * 9, 129, 6, 11, P.hud);
  }
  felt(g, 230, 92, 30, 16, P.kontur);
  felt(g, 231, 93, 29, 14, '#7a7468');
  return c;
}


/** Godnathistorien (kapitel 4): et mørkt værelse, lampen på natbordet, en åben bog og en dyne. Intet ansigt. */
export function tegnGodnat(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.93 ? '#2a2f48' : '#1a1e36');
  // Lampens lys: en varm kegle med dither.
  for (let y = 40; y < H; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot((x - 92) / 120, (y - 60) / 110);
      if (d < 1 && hash(x, y) > d * 0.9) felt(g, x, y, 1, 1, d < 0.5 ? '#5d5243' : '#4a3426');
    }
  // Natbord og lampe.
  felt(g, 60, 110, 64, 70, P.kontur);
  felt(g, 61, 111, 62, 68, '#6b4a2b');
  felt(g, 86, 74, 12, 36, P.kontur);
  felt(g, 88, 76, 8, 34, '#c4ab7c');
  felt(g, 70, 50, 44, 26, P.kontur);
  felt(g, 72, 52, 40, 22, '#ffe9a8');
  // Sengen og dynen.
  felt(g, 130, 104, 190, 76, P.kontur);
  felt(g, 131, 105, 188, 75, '#698fc1');
  for (let x = 131; x < 319; x += 12) felt(g, x, 105, 1, 75, '#4f6fa8');
  felt(g, 140, 92, 70, 20, P.kontur);
  felt(g, 141, 93, 68, 18, '#f3ead2');
  // Den åbne bog på dynen.
  felt(g, 210, 118, 76, 40, P.kontur);
  felt(g, 212, 120, 35, 36, P.papir);
  felt(g, 249, 120, 35, 36, P.papir);
  for (let r = 0; r < 5; r++) {
    felt(g, 216, 126 + r * 6, 26, 1, '#7a7468');
    felt(g, 253, 126 + r * 6, 26, 1, '#7a7468');
  }
  // En lille skygge med store øjne, som drømmen tegner i luften.
  for (let y = -10; y <= 10; y++) for (let x = -12; x <= 12; x++) if ((x * x) / 144 + (y * y) / 100 <= 1 && hash(x + 300, y) > 0.25) felt(g, 252 + x, 50 + y, 1, 1, '#3a3560');
  for (const ox of [-5, 5]) {
    felt(g, 250 + ox, 46, 4, 4, '#f4efe0');
    felt(g, 251 + ox, 47, 2, 2, '#222222');
  }
  return c;
}

/** Skår 4a, Skyggen i margenen: et regnehæfte med tern og tal-streger og en lille skygge tegnet i margenen. */
export function tegnSkyggenIMargenen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.92 ? '#a99068' : '#c4ab7c');
  felt(g, 30, 10, 260, 160, P.kontur);
  felt(g, 31, 11, 258, 158, P.papir);
  // Tern.
  for (let x = 31; x < 289; x += 8) felt(g, x, 11, 1, 158, '#c9dcf2');
  for (let y = 11; y < 169; y += 8) felt(g, 31, y, 258, 1, '#c9dcf2');
  // Margenlinjen.
  felt(g, 230, 11, 2, 158, '#e595a9');
  // Tal-streger i lange rækker.
  for (let r = 0; r < 14; r++) for (let k = 0; k < 7; k++) if (hash(r, k) > 0.2) felt(g, 44 + k * 26, 20 + r * 10, 16, 2, '#4f4a57');
  // En visket skygge og en ny, tegnet igen ved siden af.
  for (let y = -9; y <= 9; y++) for (let x = -8; x <= 8; x++) if ((x * x) / 64 + (y * y) / 81 <= 1) felt(g, 250 + x, 60 + y, 1, 1, hash(x, y) > 0.6 ? '#b9bfcf' : P.papir);
  for (let y = -9; y <= 9; y++) for (let x = -8; x <= 8; x++) if ((x * x) / 64 + (y * y) / 81 <= 1) felt(g, 262 + x, 110 + y, 1, 1, '#3a3560');
  for (const ox of [-3, 3]) {
    felt(g, 261 + ox, 106, 3, 3, '#f4efe0');
    felt(g, 262 + ox, 107, 1, 1, '#222222');
  }
  return c;
}

/** Skår 4b, Døren på klem: et mørkt værelse, en stribe lys fra døren og en åben skuffe. Ingen ansigter. */
export function tegnDoerenPaaKlem(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.93 ? '#2a2f48' : '#1a1e36');
  // Døren på klem med lys bag.
  felt(g, 30, 20, 70, 160, P.kontur);
  felt(g, 32, 22, 20, 158, '#ffe9a8');
  felt(g, 52, 22, 46, 158, '#4a3426');
  // Lysstriben hen over gulvet.
  for (let y = 150; y < H; y++) {
    const w = 20 + (y - 150) * 2;
    for (let x = 32; x < 32 + w; x++) if (hash(x, y) > (x - 32) / (w + 10)) felt(g, x, y, 1, 1, '#8a7656');
  }
  // En skygge af en person i døråbningen (kun en mørk form).
  felt(g, 34, 60, 16, 90, '#3a3560');
  felt(g, 36, 44, 12, 16, '#3a3560');
  // Skrivebordet og den åbne skuffe.
  felt(g, 170, 90, 130, 14, P.kontur);
  felt(g, 171, 91, 128, 12, '#8a7656');
  felt(g, 180, 104, 110, 40, P.kontur);
  felt(g, 181, 105, 108, 38, '#6b4a2b');
  felt(g, 196, 140, 80, 22, P.kontur);
  felt(g, 197, 141, 78, 20, '#8a5a3a');
  felt(g, 230, 148, 12, 4, '#c4ab7c');
  return c;
}
