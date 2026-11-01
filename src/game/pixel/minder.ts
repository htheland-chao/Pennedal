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

const TEGN: Record<MindeId, () => HTMLCanvasElement> = { blaek: tegnBlaek, streger: tegnStreger, koekkenbord: tegnKoekkenbord };

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
