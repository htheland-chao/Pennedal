/**
 * Pixelgrafik til minderne (tilbageblik), 320 x 180. Kræver en browser.
 * Varme, falmede farver. Ingen ansigter, kun hænder, ting og rum (docs/historie.md).
 * Ingen bogstaver: ordene på siden er streger, man ikke kan læse (hensyn til ordblinde elever, regel 2).
 * Kornet og bevægelsen lægges ovenpå med CSS.
 */
import type { MindeId } from '../../content/minder';
import { hash, lerred, tegnkortTilLerred } from './lerred';
import type { Tegnkort } from './sprites';

const B = 320;
const H = 180;

type Farve = string;
function felt(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: Farve) {
  g.fillStyle = f;
  g.fillRect(x, y, w, h);
}

/** Varm og falmet, som et gammelt fotografi. */
const P = {
  lys: '#efe0bf',
  mellem: '#dcc59a',
  moerk: '#bf9f74',
  skygge: '#9a7b58',
  kontur: '#6e5440',
  hud: '#e3b991',
  hudLys: '#f1d2b0',
  hudSkygge: '#c2916c',
  knoer: '#f8eadb',
  papir: '#f6ecd6',
  papirSkygge: '#e2d3b2',
  linje: '#b9a78a',
  roed: '#c25446',
  blaek: '#3e3a5c',
};

/**
 * En knyttet hånd om en blyant, set forfra: fire fingre lagt om blyanten, tommelfingeren hen over.
 * Knoerne (W) er hvide, fordi hånden holder for hårdt.
 */
const HAAND: Tegnkort = {
  raekker: [
    '..........kyyk..........',
    '..........kyYk..........',
    '..........kyYk..........',
    '..........kyYk..........',
    '....kkkkkkkyYkkkkk......',
    '...kWhhhhhhhhhhhhhk.....',
    '..kWWhhhhhhhhttttttk....',
    '..kWhhhhhhhhtTTTTTTtk...',
    '..kkkkkkkkkktTTTTTTTtk..',
    '..kWhhhhhhhhhttttttttkaa',
    '..kWWhhhhhhhhhhhhhhhskaa',
    '..kkkkkkkkkkkkkkkkkkkkaa',
    '...kWhhhhhhhhhhhhhhskaaa',
    '...kWWhhhhhhhhhhhhsskaaa',
    '...kkkkkkkkkkkkkkkkkkaaa',
    '....kWhhhhhhhhhhhhskaaaa',
    '.....kkkkkkkkkkkkkkaaaaa',
    '..........kyYk.....aaaaa',
    '..........kggk..........',
    '..........kggk..........',
    '...........kk...........',
  ],
  palet: { k: '#6e5440', h: '#e3b991', s: '#c2916c', W: '#f8eadb', t: '#d9a87f', T: '#efcaa6', y: '#e0a93c', Y: '#f0c45a', g: '#e8c89a', a: '#8796ad' },
};

/** Tegner hånden med blyanten forstørret, med spidsen mod papiret i (x, y). */
function haandMedBlyant(g: CanvasRenderingContext2D, x: number, y: number, skala = 3) {
  const sprite = tegnkortTilLerred(HAAND);
  g.imageSmoothingEnabled = false;
  g.drawImage(sprite, x - 11.5 * skala, y - sprite.height * skala, sprite.width * skala, sprite.height * skala);
}

/** Blæk og regn: en rude med regn, lampens lys, en blækflaske og en hånd, der holder en blyant for hårdt. */
function tegnBlaek(): HTMLCanvasElement {
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
  felt(g, 26, 18, 84, 66, '#8c9cb0');
  for (let y = 18; y < 84; y++) if (y % 3 === 0) felt(g, 26, y, 84, 1, '#97a6b8');
  felt(g, 66, 18, 4, 66, P.kontur);
  felt(g, 26, 49, 84, 3, P.kontur);
  for (let i = 0; i < 70; i++) {
    const x = 26 + Math.floor(hash(i, 31) * 84);
    const y = 18 + Math.floor(hash(i, 32) * 60);
    felt(g, x, y, 1, 2 + Math.floor(hash(i, 33) * 4), hash(i, 34) > 0.5 ? '#d3dce6' : '#b3c0cf');
  }
  // Bordpladen.
  felt(g, 0, 112, B, 68, P.skygge);
  felt(g, 0, 112, B, 3, P.moerk);
  for (let x = 0; x < B; x += 2) for (let y = 118; y < H; y += 7) if (hash(x, y) > 0.6) felt(g, x, y, 2, 1, '#8a6c4d');
  // Et ark papir på bordet.
  felt(g, 120, 120, 120, 52, P.papirSkygge);
  felt(g, 118, 118, 120, 52, P.papir);
  for (let r = 0; r < 5; r++) felt(g, 126, 126 + r * 9, 100, 1, P.linje);
  // Blækflasken.
  felt(g, 262, 92, 26, 26, P.kontur);
  felt(g, 263, 93, 24, 24, P.blaek);
  felt(g, 266, 96, 4, 14, '#5b5880');
  felt(g, 268, 84, 14, 9, P.kontur);
  felt(g, 269, 85, 12, 7, '#7a5a3e');
  // En lille blækplet på papiret.
  for (let i = 0; i < 18; i++) felt(g, 214 + Math.floor(hash(i, 41) * 8), 150 + Math.floor(hash(i, 42) * 6), 2, 2, P.blaek);
  haandMedBlyant(g, 178, 160);
  return c;
}

/** Røde streger: en side fuld af ulæselige ord med røde streger hen over og en lille hånd, der vender siden. */
function tegnStreger(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Bordet bagved.
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x >> 1, y >> 1) > 0.85 ? P.moerk : P.skygge);
  // Hæftet: grønt omslag under siden.
  felt(g, 54, 10, 214, 164, P.kontur);
  felt(g, 55, 11, 212, 162, '#6f8f62');
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
  felt(g, 279, 137, 41, 32, '#c98a6a');
  return c;
}

/** Køkkenbordet: en ternet voksdug, et åbent grønt hæfte med en tegning af en skygge med store øjne og en glad hånd, der skriver. */
function tegnKoekkenbord(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Væggen og lampens gule lys foroven.
  for (let y = 0; y < 44; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot(x - 160, y + 10) / 170 + hash(x, y) * 0.06;
      felt(g, x, y, 1, 1, d < 0.45 ? '#f6e3b0' : d < 0.75 ? P.lys : P.mellem);
    }
  // Voksdugen: tern i falmet rødt og creme, lidt i perspektiv (tættere tern forrest).
  for (let y = 44; y < H; y++) {
    const t = (y - 44) / (H - 44);
    const str = 8 + Math.floor(t * 10);
    for (let x = 0; x < B; x++) {
      const tx = Math.floor((x - 160) / str + 100);
      const ty = Math.floor((y - 44) / (6 + t * 8));
      const roed = (tx + ty) % 2 === 0;
      felt(g, x, y, 1, 1, roed ? (hash(x, y) > 0.9 ? '#c98b78' : '#d29a86') : hash(x, y) > 0.9 ? '#eadcc0' : '#f1e5cb');
    }
  }
  felt(g, 0, 44, B, 2, P.moerk);
  // Hæftet: grønt omslag og to åbne sider.
  felt(g, 66, 64, 190, 104, P.kontur);
  felt(g, 67, 65, 188, 102, '#6f8f62');
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
      if (krop || hale) felt(g, 116 + x, 112 + y, 1, 1, hash(x, y) > 0.93 ? '#5a5574' : '#4a4560');
    }
  for (const ox of [-9, 9]) {
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) felt(g, 116 + ox + x, 104 + y, 1, 1, '#f6ecd6');
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 4) felt(g, 116 + ox + x + 1, 105 + y, 1, 1, '#2b2433');
  }
  // Højre side: linjer med ord, der vælter lidt (streger, ingen bogstaver).
  for (let r = 0; r < 8; r++) {
    const y = 78 + r * 10;
    let x = 168;
    while (x < 240 && !(r === 7 && x > 200)) {
      const w = 5 + Math.floor(hash(x, r + 7) * 12);
      if (x + w > 244) break;
      const haeld = hash(x, r) > 0.6 ? 1 : 0;
      for (let i = 0; i < w; i++) felt(g, x + i, y + (i > w / 2 ? haeld : 0), 1, 2, '#7d7066');
      x += w + 4;
    }
  }
  haandMedBlyant(g, 214, 152, 2);
  return c;
}


/** Skår 3a, Viskelæderet: det grønne hæfte på køkkenbordet, et gråt, tyndslidt sted på siden og et viskelæder med krummer. */
function tegnViskelaeder(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Voksdugen tæt på: store, falmede tern.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < B; x++) {
      const roed = (Math.floor(x / 22) + Math.floor(y / 22)) % 2 === 0;
      felt(g, x, y, 1, 1, roed ? (hash(x, y) > 0.9 ? '#c98b78' : '#d29a86') : hash(x, y) > 0.9 ? '#eadcc0' : '#f1e5cb');
    }
  // Hæftet, åbent og skråt.
  felt(g, 40, 24, 220, 136, P.kontur);
  felt(g, 41, 25, 218, 134, '#6f8f62');
  felt(g, 46, 28, 104, 128, P.papir);
  felt(g, 150, 28, 104, 128, P.papir);
  felt(g, 148, 28, 2, 128, P.papirSkygge);
  // Linjer med streger (ingen bogstaver). Ét sted er gnedet gråt og tyndt.
  for (let r = 0; r < 10; r++) {
    const y = 40 + r * 11;
    for (let x = 54; x < 142; x++) if (hash(x >> 3, r) > 0.25) felt(g, x, y, 1, 2, '#7d7066');
    for (let x = 158; x < 246; x++) if (hash((x >> 3) + 50, r) > 0.25 && !(r === 4 && x > 180 && x < 226)) felt(g, x, y, 1, 2, '#7d7066');
  }
  for (let y = 78; y < 96; y++)
    for (let x = 176; x < 230; x++) {
      const d = Math.hypot((x - 203) / 27, (y - 87) / 9);
      if (d < 1) felt(g, x, y, 1, 1, hash(x, y) > 0.5 ? '#d9cfbb' : '#cfc4ae');
    }
  // Et nyt, lettere ord skrevet ovenover.
  for (let x = 184; x < 214; x++) felt(g, x, 75, 1, 2, '#4e4660');
  // Viskelæderet og krummerne.
  felt(g, 236, 112, 46, 22, P.kontur);
  felt(g, 237, 113, 44, 20, '#e8a8a8');
  felt(g, 259, 113, 22, 20, '#7d9cc8');
  for (let i = 0; i < 26; i++) felt(g, 186 + Math.floor(hash(i, 3) * 60), 98 + Math.floor(hash(i, 4) * 26), 2, 1, '#e3cfc8');
  return c;
}

/** Skår 3b, Hæftet på gulvet: et tomt klasseværelse, stole oppe på bordene og et grønt hæfte på gulvet. En voksen hånd. */
function tegnHaeftetPaaGulvet(): HTMLCanvasElement {
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
  felt(g, 212, 12, 86, 46, '#f6e3b0');
  felt(g, 254, 12, 2, 46, P.kontur);
  // Borde med stole på hovedet.
  for (const bx of [20, 120]) {
    felt(g, bx, 72, 80, 8, P.kontur);
    felt(g, bx + 1, 73, 78, 6, '#c9a46a');
    for (const lx of [bx + 4, bx + 72]) felt(g, lx, 80, 4, 40, P.kontur);
    // Stolen oppe på bordet.
    felt(g, bx + 18, 46, 44, 6, P.kontur);
    felt(g, bx + 19, 47, 42, 4, '#8a6a45');
    for (const sx of [bx + 22, bx + 54]) felt(g, sx, 52, 3, 20, P.kontur);
  }
  // Hæftet på gulvet under bordet.
  felt(g, 150, 136, 54, 34, P.kontur);
  felt(g, 151, 137, 52, 32, '#6f8f62');
  // Skyggen med store øjne på forsiden.
  for (let y = -8; y <= 8; y++) for (let x = -10; x <= 10; x++) if ((x * x) / 100 + (y * y) / 64 <= 1) felt(g, 177 + x, 153 + y, 1, 1, '#4a4560');
  for (const ox of [-4, 4]) {
    felt(g, 176 + ox, 149, 3, 3, '#f6ecd6');
    felt(g, 177 + ox, 150, 1, 1, '#2b2433');
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
  felt(g, 231, 93, 29, 14, '#6b7a8f');
  return c;
}


/** Godnathistorien (kapitel 4): et mørkt værelse, lampen på natbordet, en åben bog og en dyne. Intet ansigt. */
function tegnGodnat(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.93 ? '#262a44' : '#1d2038');
  // Lampens lys: en varm kegle med dither.
  for (let y = 40; y < H; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot((x - 92) / 120, (y - 60) / 110);
      if (d < 1 && hash(x, y) > d * 0.9) felt(g, x, y, 1, 1, d < 0.5 ? '#5a4a3e' : '#3e3640');
    }
  // Natbord og lampe.
  felt(g, 60, 110, 64, 70, P.kontur);
  felt(g, 61, 111, 62, 68, '#6b4a30');
  felt(g, 86, 74, 12, 36, P.kontur);
  felt(g, 88, 76, 8, 34, '#c9a46a');
  felt(g, 70, 50, 44, 26, P.kontur);
  felt(g, 72, 52, 40, 22, '#f6d98a');
  // Sengen og dynen.
  felt(g, 130, 104, 190, 76, P.kontur);
  felt(g, 131, 105, 188, 75, '#6f86b0');
  for (let x = 131; x < 319; x += 12) felt(g, x, 105, 1, 75, '#5f74a0');
  felt(g, 140, 92, 70, 20, P.kontur);
  felt(g, 141, 93, 68, 18, '#e8e4dc');
  // Den åbne bog på dynen.
  felt(g, 210, 118, 76, 40, P.kontur);
  felt(g, 212, 120, 35, 36, P.papir);
  felt(g, 249, 120, 35, 36, P.papir);
  for (let r = 0; r < 5; r++) {
    felt(g, 216, 126 + r * 6, 26, 1, '#7d7066');
    felt(g, 253, 126 + r * 6, 26, 1, '#7d7066');
  }
  // En lille skygge med store øjne, som drømmen tegner i luften.
  for (let y = -10; y <= 10; y++) for (let x = -12; x <= 12; x++) if ((x * x) / 144 + (y * y) / 100 <= 1 && hash(x + 300, y) > 0.25) felt(g, 252 + x, 50 + y, 1, 1, '#3a3560');
  for (const ox of [-5, 5]) {
    felt(g, 250 + ox, 46, 4, 4, '#f6ecd6');
    felt(g, 251 + ox, 47, 2, 2, '#2b2433');
  }
  return c;
}

/** Skår 4a, Skyggen i margenen: et regnehæfte med tern og tal-streger og en lille skygge tegnet i margenen. */
function tegnSkyggenIMargenen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.92 ? '#b89870' : '#c9a87a');
  felt(g, 30, 10, 260, 160, P.kontur);
  felt(g, 31, 11, 258, 158, P.papir);
  // Tern.
  for (let x = 31; x < 289; x += 8) felt(g, x, 11, 1, 158, '#d6dbe6');
  for (let y = 11; y < 169; y += 8) felt(g, 31, y, 258, 1, '#d6dbe6');
  // Margenlinjen.
  felt(g, 230, 11, 2, 158, '#d98a8a');
  // Tal-streger i lange rækker.
  for (let r = 0; r < 14; r++) for (let k = 0; k < 7; k++) if (hash(r, k) > 0.2) felt(g, 44 + k * 26, 20 + r * 10, 16, 2, '#4e4660');
  // En visket skygge og en ny, tegnet igen ved siden af.
  for (let y = -9; y <= 9; y++) for (let x = -8; x <= 8; x++) if ((x * x) / 64 + (y * y) / 81 <= 1) felt(g, 250 + x, 60 + y, 1, 1, hash(x, y) > 0.6 ? '#bdb6ac' : P.papir);
  for (let y = -9; y <= 9; y++) for (let x = -8; x <= 8; x++) if ((x * x) / 64 + (y * y) / 81 <= 1) felt(g, 262 + x, 110 + y, 1, 1, '#3a3560');
  for (const ox of [-3, 3]) {
    felt(g, 261 + ox, 106, 3, 3, '#f6ecd6');
    felt(g, 262 + ox, 107, 1, 1, '#2b2433');
  }
  return c;
}

/** Skår 4b, Døren på klem: et mørkt værelse, en stribe lys fra døren og en åben skuffe. Ingen ansigter. */
function tegnDoerenPaaKlem(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.93 ? '#262a44' : '#1d2038');
  // Døren på klem med lys bag.
  felt(g, 30, 20, 70, 160, P.kontur);
  felt(g, 32, 22, 20, 158, '#f6d98a');
  felt(g, 52, 22, 46, 158, '#4a3a2e');
  // Lysstriben hen over gulvet.
  for (let y = 150; y < H; y++) {
    const w = 20 + (y - 150) * 2;
    for (let x = 32; x < 32 + w; x++) if (hash(x, y) > (x - 32) / (w + 10)) felt(g, x, y, 1, 1, '#8a7650');
  }
  // En skygge af en person i døråbningen (kun en mørk form).
  felt(g, 34, 60, 16, 90, '#3e3a48');
  felt(g, 36, 44, 12, 16, '#3e3a48');
  // Skrivebordet og den åbne skuffe.
  felt(g, 170, 90, 130, 14, P.kontur);
  felt(g, 171, 91, 128, 12, '#8a6a45');
  felt(g, 180, 104, 110, 40, P.kontur);
  felt(g, 181, 105, 108, 38, '#6b4a30');
  felt(g, 196, 140, 80, 22, P.kontur);
  felt(g, 197, 141, 78, 20, '#7d5a3a');
  felt(g, 230, 148, 12, 4, '#c9a46a');
  return c;
}

/** Kapitel 5, Skyggen bliver tegnet: skrivebordet om aftenen, det grønne hæfte og en lille skygge på forsiden. Blyanten ligger stille. */
function tegnSkyggen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.93 ? '#2c2a40' : '#24223a');
  // Lyskeglen fra lampen.
  for (let y = 20; y < 120; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot((x - 160) / 1.8, y - 120);
      if (d < 70) felt(g, x, y, 1, 1, '#4a3e40');
      else if (d < 86 && (x + y) % 2 === 0) felt(g, x, y, 1, 1, '#3a3240');
    }
  // Bordpladen.
  felt(g, 0, 120, B, 60, '#6b4a30');
  for (let x = 0; x < B; x += 3) if (hash(x, 1) > 0.5) felt(g, x, 124 + Math.floor(hash(x, 2) * 40), 2, 1, '#5a3d27');
  // Hæftet, grønt omslag, åbent.
  felt(g, 70, 70, 180, 90, P.kontur);
  felt(g, 72, 72, 86, 86, P.papir);
  felt(g, 162, 72, 86, 86, P.papir);
  felt(g, 158, 72, 4, 86, '#4e7a52');
  for (let r = 0; r < 7; r++) felt(g, 78, 80 + r * 9, 70 - (r === 6 ? 40 : 0), 1, '#7d7066');
  // Skyggen tegnet på højre side: rund, med store øjne.
  for (let y = -16; y <= 16; y++) for (let x = -14; x <= 14; x++) if ((x * x) / 196 + (y * y) / 256 <= 1) felt(g, 205 + x, 112 + y, 1, 1, hash(x + 50, y) > 0.15 ? '#3a3560' : '#55507a');
  for (const ox of [-6, 6]) {
    felt(g, 202 + ox, 104, 6, 6, P.papir);
    felt(g, 204 + ox, 106, 3, 3, '#2b2433');
  }
  // Blyanten ligger stille ved den sidste, korte linje.
  haandMedBlyant(g, 112, 126, 2);
  return c;
}

/** Skår 5a, Fodnoten i hæftet: en side med linjer og nederst en lille, lille skrift og en stjerne. */
function tegnFodnotenIHaeftet(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.92 ? '#b89870' : '#c9a87a');
  felt(g, 40, 6, 240, 168, P.kontur);
  felt(g, 41, 7, 238, 166, P.papir);
  felt(g, 41, 7, 6, 166, '#4e7a52');
  for (let r = 0; r < 11; r++) for (let k = 0; k < 5; k++) if (hash(r + 9, k) > 0.15) felt(g, 58 + k * 42, 18 + r * 11, 34, 2, '#4e4660');
  // En streg over fodnoten.
  felt(g, 58, 145, 60, 1, '#7d7066');
  // Den lille skrift nederst.
  for (let k = 0; k < 14; k++) felt(g, 60 + k * 12, 152, 9, 1, '#4e4660');
  for (let k = 0; k < 8; k++) felt(g, 60 + k * 12, 158, 9, 1, '#4e4660');
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
function tegnVindueskarmen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  // Ruden: grå himmel med regndråber.
  felt(g, 0, 0, B, 120, '#7d8aa0');
  for (let y = 0; y < 120; y++) for (let x = 0; x < B; x++) if (hash(x, y) > 0.985) felt(g, x, y, 1, 3, '#c3ccd8');
  // Vinduesrammen.
  felt(g, 0, 0, B, 6, '#e8e0d0');
  felt(g, 156, 0, 8, 120, '#e8e0d0');
  felt(g, 0, 114, B, 10, '#e8e0d0');
  // Karmen og væggen.
  felt(g, 0, 124, B, 56, '#c9b48e');
  for (let y = 124; y < H; y++) for (let x = 0; x < B; x++) if (hash(x + 3, y) > 0.95) felt(g, x, y, 1, 1, '#b39d77');
  // Knæene under et tæppe og det lukkede hæfte.
  felt(g, 90, 120, 140, 44, P.kontur);
  felt(g, 92, 122, 136, 40, '#9a6a5a');
  felt(g, 120, 110, 80, 24, P.kontur);
  felt(g, 122, 112, 76, 20, '#4e7a52');
  felt(g, 122, 112, 76, 2, '#6a9a6c');
  // Hænderne holder hæftet lukket.
  felt(g, 112, 116, 14, 12, P.hud);
  felt(g, 194, 116, 14, 12, P.hud);
  felt(g, 112, 126, 14, 2, P.hudSkygge);
  felt(g, 194, 126, 14, 2, P.hudSkygge);
  return c;
}

/** Kapitel 6, Hjørnet bliver foldet: en side i det grønne hæfte, hvor det øverste hjørne er foldet ned. Det er sent. */
function tegnFoldet(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.94 ? '#2c2a40' : '#24223a');
  // Bordet i lampens lys.
  for (let y = 60; y < H; y++)
    for (let x = 0; x < B; x++) {
      const d = Math.hypot((x - 160) / 1.7, y - 120);
      felt(g, x, y, 1, 1, d < 80 ? '#6b4a30' : d < 96 && (x + y) % 2 === 0 ? '#5a3d27' : '#3a2a20');
    }
  // Siden.
  felt(g, 90, 30, 140, 130, P.kontur);
  felt(g, 92, 32, 136, 126, P.papir);
  felt(g, 92, 32, 4, 126, '#4e7a52');
  for (let r = 0; r < 9; r++) felt(g, 104, 46 + r * 11, r === 8 ? 40 : 110, 2, '#4e4660');
  // Det foldede hjørne: en trekant, der er bøjet ned over siden.
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 30 - y; x++) {
      felt(g, 228 - x, 32 + y, 1, 1, '#24223a');
      if (x < 30 - y - 1) felt(g, 198 + y, 32 + x, 1, 1, x + y > 26 ? P.kontur : '#e2d3b2');
    }
  for (let i = 0; i < 30; i++) felt(g, 198 + i, 32 + i, 1, 1, P.kontur);
  // En finger, der holder hjørnet nede.
  felt(g, 214, 36, 16, 8, P.hud);
  felt(g, 214, 43, 16, 2, P.hudSkygge);
  felt(g, 226, 36, 4, 8, P.hudLys);
  return c;
}

/** Skår 6a, Klatten på siden: en side med en stor blækklat, der har fået tegnet ben og små øjne på. Fyldepennen ligger ved siden af. */
function tegnKlattenPaaSiden(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.92 ? '#b89870' : '#c9a87a');
  felt(g, 50, 8, 220, 164, P.kontur);
  felt(g, 51, 9, 218, 162, P.papir);
  for (let r = 0; r < 13; r++) if (r < 4 || r > 9) felt(g, 64, 20 + r * 12, 190, 1, '#d6dbe6');
  // Klatten: en rund klat med sprøjt omkring.
  for (let y = -26; y <= 26; y++)
    for (let x = -30; x <= 30; x++) {
      const v = Math.atan2(y, x);
      const r = 22 + Math.sin(v * 5) * 3 + Math.sin(v * 9 + 1) * 2;
      if (Math.hypot(x, y * 1.1) <= r) felt(g, 160 + x, 92 + y, 1, 1, '#1a1e3c');
    }
  for (const [x, y, r] of [[112, 70, 4], [205, 112, 3], [196, 60, 2], [124, 120, 3]])
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) felt(g, x + xx, y + yy, 1, 1, '#1a1e3c');
  // Øjnene og benene, tegnet med blyant.
  for (const ox of [-8, 8]) {
    felt(g, 156 + ox, 84, 7, 7, '#ffffff');
    felt(g, 158 + ox, 86, 3, 3, '#0b0d1c');
  }
  for (const ox of [-10, 8]) {
    felt(g, 160 + ox, 114, 2, 16, '#4e4660');
    felt(g, 160 + ox - 2, 129, 6, 2, '#4e4660');
  }
  // Fyldepennen.
  for (let i = 0; i < 70; i++) felt(g, 230 - i, 160 - Math.floor(i * 0.35), 4, 3, i < 12 ? '#c9a46a' : '#2a2e58');
  return c;
}

/** Skår 6b, Kassen ved døren: en papkasse med bøger ved en dør, og øverst noget grønt. Ingen ansigter. */
function tegnKassenVedDoeren(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, y < 130 ? (hash(x, y) > 0.95 ? '#c8b896' : '#d6c6a2') : (x + (y >> 2) * 3) % 24 === 0 ? '#7a5636' : '#9a7048');
  // Døren.
  felt(g, 40, 10, 84, 122, P.kontur);
  felt(g, 44, 14, 76, 118, '#b98b5a');
  felt(g, 52, 24, 60, 40, '#a97d50');
  felt(g, 52, 74, 60, 50, '#a97d50');
  felt(g, 108, 76, 6, 6, '#e5c03a');
  // Kassen.
  felt(g, 150, 92, 120, 70, P.kontur);
  felt(g, 152, 94, 116, 66, '#c9a46a');
  felt(g, 152, 94, 116, 4, '#e0c995');
  felt(g, 140, 86, 20, 10, '#b08a50');
  felt(g, 260, 86, 20, 10, '#b08a50');
  // Bøger, der stikker op, og øverst det grønne hæfte.
  const ryg = ['#c0503e', '#2c6fbb', '#7b4bb3', '#e5c03a', '#3d7a57'];
  for (let i = 0; i < 9; i++) felt(g, 160 + i * 11, 72 + (i % 3) * 4, 9, 24, ryg[i % ryg.length]);
  felt(g, 186, 64, 60, 12, P.kontur);
  felt(g, 187, 65, 58, 10, '#4e7a52');
  felt(g, 187, 65, 58, 2, '#6a9a6c');
  return c;
}

/** Kapitel 7, Søskendet: en åben skuffe i et skrivebord og to hænder, der leder mellem papirerne. Ingen ansigter. */
function tegnSoeskendet(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, hash(x, y) > 0.94 ? '#c8b896' : '#d6c6a2');
  // Skrivebordet.
  felt(g, 30, 40, 260, 20, P.kontur);
  felt(g, 32, 42, 256, 16, '#8a6a45');
  felt(g, 40, 60, 240, 120, P.kontur);
  felt(g, 42, 62, 236, 118, '#6b4a30');
  // Den åbne skuffe.
  felt(g, 70, 96, 180, 70, P.kontur);
  felt(g, 72, 98, 176, 66, '#7d5a3a');
  felt(g, 80, 104, 160, 50, '#4a3424');
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
function tegnKassenPaaBiblioteket(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  for (let y = 0; y < H; y++) for (let x = 0; x < B; x++) felt(g, x, y, 1, 1, y < 70 ? (x % 40 < 2 ? '#5a3a28' : hash(x, y) > 0.9 ? '#c0503e' : '#8a6a45') : '#d6c6a2');
  // Disken.
  felt(g, 0, 120, B, 60, P.kontur);
  felt(g, 0, 122, B, 58, '#9a7048');
  // Kassen.
  felt(g, 60, 80, 110, 44, P.kontur);
  felt(g, 62, 82, 106, 40, '#c9a46a');
  const ryg = ['#c0503e', '#2c6fbb', '#7b4bb3', '#e5c03a'];
  for (let i = 0; i < 8; i++) felt(g, 66 + i * 12, 70, 10, 14, ryg[i % 4]);
  // Hånden med hæftet.
  felt(g, 200, 70, 70, 46, P.kontur);
  felt(g, 202, 72, 66, 42, '#4e7a52');
  felt(g, 202, 72, 66, 3, '#6a9a6c');
  felt(g, 192, 96, 26, 22, P.hud);
  felt(g, 192, 116, 26, 3, P.hudSkygge);
  felt(g, 210, 92, 14, 6, P.hud);
  return c;
}

/** Skår 7b, Skyggen på vejen: et busvindue med regnstriber, en vej og en lille skygge, der glider forbi. */
function tegnSkyggenPaaVejen(): HTMLCanvasElement {
  const c = lerred(B, H);
  const g = c.getContext('2d')!;
  felt(g, 0, 0, B, H, '#3a3a4a');
  // Vinduet.
  felt(g, 30, 20, 260, 130, '#22222e');
  for (let y = 24; y < 146; y++)
    for (let x = 34; x < 286; x++) {
      const f = y < 90 ? (hash(x >> 3, y >> 3) > 0.5 ? '#9aa8c0' : '#a8b4ca') : y < 96 ? '#6a7a5a' : '#5a5a66';
      felt(g, x, y, 1, 1, f);
    }
  // Vejen med striber.
  for (let x = 40; x < 280; x += 30) felt(g, x, 120, 16, 3, '#e8e4dc');
  // Skyggen på vejen: rund med to små, lyse øjne.
  for (let y = -8; y <= 8; y++) for (let x = -10; x <= 10; x++) if ((x * x) / 100 + (y * y) / 64 <= 1) felt(g, 180 + x, 108 + y, 1, 1, '#2a2840');
  for (const ox of [-4, 4]) felt(g, 180 + ox, 105, 2, 2, '#f6ecd6');
  // Regnstriber på ruden.
  for (let i = 0; i < 40; i++) felt(g, 40 + Math.floor(hash(i, 3) * 240), 26 + Math.floor(hash(i, 5) * 100), 1, 6, '#c3ccd8');
  // Vinduesrammen.
  felt(g, 158, 20, 4, 130, '#22222e');
  return c;
}

const TEGN: Record<MindeId, () => HTMLCanvasElement> = { blaek: tegnBlaek, streger: tegnStreger, koekkenbord: tegnKoekkenbord, skaar3a: tegnViskelaeder, skaar3b: tegnHaeftetPaaGulvet, godnat: tegnGodnat, skaar4a: tegnSkyggenIMargenen, skaar4b: tegnDoerenPaaKlem, skyggen: tegnSkyggen, skaar5a: tegnFodnotenIHaeftet, skaar5b: tegnVindueskarmen, foldet: tegnFoldet, skaar6a: tegnKlattenPaaSiden, skaar6b: tegnKassenVedDoeren, soeskendet: tegnSoeskendet, skaar7a: tegnKassenPaaBiblioteket, skaar7b: tegnSkyggenPaaVejen };

const cache = new Map<MindeId, string | null>();
/** Billedet til et minde som data-URL. Uden canvas (fx i enhedstests) bliver det null, og mindet vises kun som tekst. */
export function mindeBillede(id: MindeId): string | null {
  if (!cache.has(id)) {
    try {
      cache.set(id, TEGN[id]().toDataURL('image/png'));
    } catch {
      cache.set(id, null);
    }
  }
  return cache.get(id) ?? null;
}

let korn: string | null | undefined;
/** Fint pixelkorn, som et gammelt fotografi. Lægges ovenpå og flyttes lidt med CSS. */
export function kornBillede(): string | null {
  if (korn !== undefined) return korn;
  try {
    const c = lerred(B, H);
    const g = c.getContext('2d')!;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < B; x++) {
        const v = hash(x * 7 + 3, y * 13 + 1);
        if (v > 0.95) felt(g, x, y, 1, 1, 'rgba(255, 250, 235, 0.4)');
        else if (v < 0.04) felt(g, x, y, 1, 1, 'rgba(90, 66, 48, 0.25)');
      }
    korn = c.toDataURL('image/png');
  } catch {
    korn = null;
  }
  return korn;
}
