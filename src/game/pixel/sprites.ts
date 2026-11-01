/**
 * Pixelfigurer som tegnkort: hvert bogstav er en farve i paletten, punktum er gennemsigtigt.
 * Ren data og logik uden canvas, så det kan testes. Se docs/grafik.md for mål og palet.
 */
import { avatarDele } from '../../content';
import type { Avatar } from '../../engine/gem';

export type Tegnkort = { raekker: string[]; palet: Record<string, string> };
export type Retning = 'ned' | 'op' | 'hoejre' | 'venstre';

export function moerkere(hex: string, faktor = 0.72): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * faktor);
  const g = Math.round(((n >> 8) & 255) * faktor);
  const b = Math.round((n & 255) * faktor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------- Hovedpersonen (16 x 24) ----------
const TOP = ['......KKKK......', '....KKHHHHKK....', '...KHHHHHHHHK...', '..KHHHHHHHHHHK..'];
const TOP_HUE = ['......KKKK......', '....KKUUUUKK....', '...KUUUUUUUUK...', '..KUUUUUUUUUUK..'];
const HOVED: Record<Retning, string[]> = {
  ned: ['..KHHhSSSShHHK..', '..KHhSSSSSShHK..', '..KHhSESSESShK..', '..KHhSSSSSShHK..', '..KHhSSssSShHK..', '..KHHhSSSShHHK..'],
  op: ['..KHHHHHHHHHHK..', '..KHHHHHHHHHHK..', '..KHHHhhhhHHHK..', '..KHHHHHHHHHHK..', '..KHHHHHHHHHHK..', '..KHHHHHHHHHHK..'],
  hoejre: ['..KHHHHHhSSSK...', '..KHHHHhSSSSSK..', '..KHHHHhSSSESK..', '..KHHHHhSSSSSK..', '..KHHHHhSSSssK..', '..KHHHHHhSSSK...'],
  venstre: [],
};
const BRILLER: Record<Retning, string> = {
  ned: '..KHhGEGGEGShK..',
  op: '..KHHHhhhhHHHK..',
  hoejre: '..KHHHHhSGEGGK..',
  venstre: '',
};
const KROP = ['.KHHHHhhhhHHHHK.', '.KHHTTTTTTTTHHK.', '.KTTTTTTTTTTTTK.', '.KTtTTTTTTTTtTK.', '.KTtTTTTTTTTtTK.', '.KStTTTTTTTTtSK.', '..KTTTTTTTTTTK..', '..KtTTTTTTTTtK..'];
const BEN = [
  ['...KKPPKKPPKK...', '....KPPK.KPPK...', '....KPPK.KPPK...', '....KPPK.KPPK...', '...KBBBK.KBBBK..', '...KKKKK.KKKKK..'],
  ['...KKPPKKPPKK...', '....KPPK.KPPK...', '...KBBBK.KPPK...', '...KKKKK.KPPK...', '.........KBBBK..', '.........KKKKK..'],
  ['...KKPPKKPPKK...', '....KPPK.KPPK...', '....KPPK.KBBBK..', '....KPPK.KKKKK..', '...KBBBK........', '...KKKKK........'],
];

function farve(del: string, i: number): string {
  return avatarDele[del]?.farver?.[i] ?? '#888888';
}

/**
 * Hovedpersonen i pixel ud fra elevens avatarvalg (16 x 24). Venstre tegnes som spejlet højre.
 * Alle valg i avatardesigneren kan ses: hud, krop, øjne, mund, frisure, hårfarve, hovedbeklædning,
 * tøj, tøjfarve og tilbehør. Lanternen tegnes for sig af scenen og af designeren.
 * Grundfiguren bygges af rækkerne ovenfor, og valgene lægges på bagefter, pixel for pixel.
 */
export function avatarPixel(a: Avatar, retning: Retning, ramme: 0 | 1 | 2): Tegnkort {
  const r = retning === 'venstre' ? 'hoejre' : retning;
  const hud = farve('hud', a.hud);
  const haar = farve('haarfarve', a.haarfarve);
  const hovedFarve = farve('hovedfarve', a.hovedfarve);
  const toej = farve('toejfarve', a.toejfarve);
  const toerklaede = a.hoved === 1;
  const hue = a.hoved === 2 || a.hoved === 3;
  const hovedRaekker = [...HOVED[r]];
  if (a.tilbehoer === 1) hovedRaekker[2] = BRILLER[r];
  const ben = BEN[ramme].map((rk, i) => (a.toej === 2 && i < 2 ? rk.replace(/P/g, 'T') : rk));
  const g = [...(hue ? TOP_HUE : TOP), ...hovedRaekker, ...KROP, ...ben].map((rk) => rk.split(''));
  const saet = (x: number, y: number, c: string) => {
    if (y >= 0 && y < g.length && x >= 0 && x < 16) g[y][x] = c;
  };
  const er = (x: number, y: number, c: string) => g[y]?.[x] === c;
  // Rækker: 0-3 toppen, 4-9 hovedet, 10-17 kroppen, 18-23 benene.
  const H0 = 4;
  const K0 = 10;

  // Krop: smal, mellem eller bred. Omridset flyttes ind eller ud langs kroppen.
  if (a.krop !== 1)
    for (let y = K0; y < K0 + 8; y++) {
      const v = g[y].indexOf('K');
      const h = g[y].lastIndexOf('K');
      if (v < 0 || h <= v) continue;
      if (a.krop === 0 && h - v > 6) {
        saet(v, y, '.');
        saet(v + 1, y, 'K');
        saet(h, y, '.');
        saet(h - 1, y, 'K');
      } else if (a.krop === 2 && v > 0 && h < 15) {
        saet(v - 1, y, 'K');
        saet(v, y, g[y][v + 1] === 'S' ? 'S' : 'T');
        saet(h + 1, y, 'K');
        saet(h, y, g[y][h - 1] === 'S' ? 'S' : 'T');
      }
    }

  // Frisure. Under et tørklæde eller en hue vises kun det hår, der hænger ned.
  const fri = !toerklaede && !hue;
  // Hår på skuldrene findes kun ved langt hår, fletninger og hestehale.
  const langtHaar = a.haar === 1 || a.haar === 3 || a.haar === 5;
  if (!langtHaar && !toerklaede)
    for (const y of [K0, K0 + 1]) for (let x = 0; x < 16; x++) if (g[y][x] === 'H' || g[y][x] === 'h') g[y][x] = y === K0 ? 'T' : 'T';
  if (a.haar === 1 && !toerklaede) {
    // Langt: håret hænger ned langs siderne af kroppen.
    for (let y = K0 + 2; y < K0 + 5; y++) {
      saet(1, y, 'H');
      saet(14, y, r === 'hoejre' ? g[y][14] : 'H');
    }
  }
  if ((a.haar === 0 || a.haar === 2 || a.haar === 6) && fri && r !== 'op') {
    // Kort hår, krøller og knold: håret slutter ved ørerne, så siderne af ansigtet er bare.
    for (let y = H0 + 3; y < H0 + 6; y++) for (let x = 3; x < 13; x++) if (g[y][x] === 'H' || g[y][x] === 'h') g[y][x] = 'S';
  }
  if (a.haar === 2 && fri) {
    // Krøller: toppen bliver bulet.
    for (const x of [4, 7, 10]) saet(x, 0, 'K');
    for (let x = 3; x < 13; x += 2) if (er(x, 1, 'H')) saet(x, 1, 'h');
    for (let x = 4; x < 12; x += 2) if (er(x, 2, 'H')) saet(x, 2, 'h');
  }
  if (a.haar === 3 && !toerklaede) {
    // Fletninger: to fletninger, der hænger ned foran skuldrene.
    for (let y = K0; y < K0 + 5; y++) {
      const c = y % 2 ? 'H' : 'h';
      saet(2, y, c);
      if (r !== 'hoejre') saet(13, y, c);
    }
    saet(2, K0 + 5, 'U');
    if (r !== 'hoejre') saet(13, K0 + 5, 'U');
  }
  if (a.haar === 4 && fri) {
    // Afro: en stor, rund top, der går ud over hovedets kant.
    g[0] = '...KKKKKKKKKK...'.split('');
    g[1] = '..KHHhHHHHhHHK..'.split('');
    g[2] = '.KHHHHHhHHHHHHK.'.split('');
    g[3] = '.KHhHHHHHHHHhHK.'.split('');
    for (let y = H0; y < H0 + 4; y++) {
      saet(1, y, 'K');
      saet(2, y, 'H');
      if (r !== 'hoejre') {
        saet(14, y, 'K');
        saet(13, y, 'H');
      }
    }
  }
  if (a.haar === 5 && !toerklaede) {
    // Hestehale: en hale i den ene side.
    for (let y = 2; y < H0 + 5; y++) {
      saet(14, y, y === 2 ? 'K' : 'H');
      saet(15, y, 'K');
    }
    saet(13, 2, 'U');
  }
  if (a.haar === 6 && fri) {
    // Knold: en knold på toppen af hovedet.
    g[0] = '......KKKK......'.split('');
    g[1] = '.....KHhHHK.....'.split('');
    g[2] = '...KKKHHHHKKK...'.split('');
    g[3] = '..KHHHHHHHHHHK..'.split('');
  }
  if (a.haar === 7 && fri) {
    // Meget kort: kun en tynd stribe hår, og siderne af hovedet er hud.
    g[0] = '................'.split('');
    g[1] = '.....KKKKKK.....'.split('');
    g[2] = '....KHHHHHHK....'.split('');
    g[3] = '...KHhHHHHhHK...'.split('');
    for (let y = H0; y < H0 + 6; y++) for (const x of [3, 4, 11, 12]) if (g[y][x] === 'H' || g[y][x] === 'h') g[y][x] = 'S';
  }

  // Kasket: en skygge foran hovedet.
  if (a.hoved === 3) {
    if (r === 'ned') g[3] = '.KUUUUUUUUUUUUK.'.split('');
    if (r === 'hoejre') {
      saet(13, 3, 'U');
      saet(14, 3, 'U');
      saet(15, 3, 'K');
    }
  }

  // Ansigtet ses kun forfra.
  if (r === 'ned') {
    const oe = H0 + 2;
    // Med briller ligger øjnene allerede i brillerne.
    const egneOejne = a.tilbehoer !== 1;
    const m = H0 + 4;
    if (!egneOejne) {
      // Brillerne bestemmer øjnene.
    } else if (a.oejne === 1) {
      // Smalle
      for (const x of [6, 9]) saet(x, oe, 'S');
      for (const x of [5, 6, 9, 10]) saet(x, oe, 'E');
    } else if (a.oejne === 2) {
      // Glade: øjnene løftet lidt og røde kinder.
      for (const x of [6, 9]) {
        saet(x, oe, 'S');
        saet(x, oe - 1, 'E');
      }
      saet(5, oe, 'R');
      saet(10, oe, 'R');
    } else if (a.oejne === 3) {
      // Store: to pixel høje med et lys i.
      for (const x of [6, 9]) {
        saet(x, oe - 1, 'W');
        saet(x, oe, 'E');
      }
    }
    // Munden
    for (let x = 5; x < 11; x++) if (g[m][x] === 's') g[m][x] = 'S';
    if (a.mund === 0) {
      saet(7, m, 'M');
      saet(8, m, 'M');
      saet(6, m - 1, 's');
      saet(9, m - 1, 's');
    } else if (a.mund === 1) {
      for (let x = 6; x < 10; x++) saet(x, m, 'M');
      saet(5, m - 1, 's');
      saet(10, m - 1, 's');
    } else if (a.mund === 2) {
      saet(7, m, 's');
      saet(8, m, 's');
    } else {
      saet(7, m, 'M');
      saet(8, m, 'M');
      saet(7, m + 1, 'M');
      saet(8, m + 1, 'M');
    }
  }

  // Tøj
  if (a.toej === 0) {
    // T-shirt: bare arme.
    for (let y = K0 + 3; y < K0 + 5; y++)
      for (const x of [g[y].indexOf('K') + 1, g[y].lastIndexOf('K') - 1]) if (g[y][x] === 't' || g[y][x] === 'T') g[y][x] = 'S';
  } else if (a.toej === 1) {
    // Hættetrøje: en hætte om halsen og en lomme på maven.
    for (let x = 4; x < 12; x++) if (g[K0][x] !== 'K' && g[K0][x] !== '.') g[K0][x] = 't';
    for (let x = 6; x < 10; x++) saet(x, K0 + 5, 't');
  } else if (a.toej === 3) {
    // Kappe: hænger ned bag benene.
    for (let y = K0 + 1; y < K0 + 13; y++) {
      saet(0, y, 'K');
      saet(1, y, 't');
      saet(14, y, 't');
      saet(15, y, 'K');
      if (y >= K0 + 6) {
        saet(2, y, 't');
        saet(3, y, 't');
        saet(12, y, 't');
        saet(13, y, 't');
      }
    }
  }

  // Halstørklæde i hovedbeklædningens farve.
  if (a.tilbehoer === 2) {
    // Stribet, så det kan ses, selv om det har samme farve som trøjen.
    for (let x = 4; x < 12; x++) if (g[K0][x] !== 'K' && g[K0][x] !== '.') g[K0][x] = x % 2 ? 'U' : 'w';
    saet(r === 'hoejre' ? 6 : 10, K0 + 1, 'U');
    saet(r === 'hoejre' ? 6 : 10, K0 + 2, 'w');
    saet(r === 'hoejre' ? 6 : 10, K0 + 3, 'U');
  }

  return {
    raekker: g.map((rk) => rk.join('')),
    palet: {
      K: '#1b1b24',
      H: toerklaede ? hovedFarve : haar,
      h: moerkere(toerklaede ? hovedFarve : haar),
      U: hovedFarve,
      u: moerkere(hovedFarve),
      S: hud,
      s: moerkere(hud, 0.8),
      E: '#1b1b24',
      W: '#ffffff',
      w: '#f4efe0',
      R: '#e88a8a',
      M: '#8e3428',
      G: '#2a2f48',
      T: toej,
      t: moerkere(toej),
      P: '#2b3150',
      B: '#3a2a20',
    },
  };
}

// ---------- Andre figurer og ting ----------
export const FUGL: Tegnkort = {
  raekker: ['......K.........', '.....KWK........', '....KWWK........', '...KWWwK.....KK.', '..KWWWwK....KWEK', '.KWWWWWKKKKKWWK.', 'KWwWWWWWWWWWWK..', '.KKwwWWWWWWwK...', '...KKwwwwwwK....', '.....KKKKKK.....'],
  palet: { K: '#2a2f48', W: '#fbf6e8', w: '#d9d2bd', E: '#1b1b24' },
};

export const KLATTEN: Tegnkort = {
  raekker: ['......K.......', '......IK......', '.....IIIK.....', '.....IiII.....', '....IIiIIK....', '...KIIIIIIK...', '..KIIIIIIIIK..', '.KIIIOOIOOIIK.', '.KIIIOoIOoIIK.', '.KIIIIIIIIIIK.', '.KIiIIIIIIIIK.', '.KIiIIKKKIIIK.', '.KIIIIIIIIIIK.', 'KIIIIIIIIIIIIK', 'KIIIIIIIIIIIIK', '.KIIKIIIIKIIK.', '..KK.KKKK.KK..'],
  palet: { K: '#05060f', I: '#1a1e3c', i: '#3a4278', O: '#ffffff', o: '#0b0d1c' },
};

/** En voksen set forfra, fx Mor Lanterne. Farven er tøjets farve. */
export function voksen(toejFarve: string, haarFarve = '#9a9a9a', hudFarve = '#e0a982'): Tegnkort {
  return {
    raekker: [
      '.....KKKKK......', '....KHHHHHK.....', '....KHHHHHK.....', '...KHHHHHHHK....', '..KHHhSSSShHK...', '..KHhSSSSSShK...',
      '..KHhSESSESSK...', '..KHhSSSSSShK...', '..KHhSSssSShK...', '...KhSSSSShK....', '..KTTTTTTTTTK...', '.KTTTTTTTTTTTK..',
      '.KTtTTTTTTTtTK..', '.KStTTTTTTTtSK..', '.KTtTTTTTTTtTK..', '.KTTTTTTTTTTTK..', '.KTTTTTTTTTTTK..', '.KTtTTTTTTTtTK..',
      '.KTTTTTTTTTTTK..', '.KTTTTTTTTTTTK..', '.KTtTTTTTTTtTK..', '..KKKKKKKKKKK...', '...KBBK.KBBK....', '...KKKK.KKKK....',
    ],
    palet: { K: '#1b1b24', H: haarFarve, h: moerkere(haarFarve), S: hudFarve, s: moerkere(hudFarve, 0.8), E: '#1b1b24', T: toejFarve, t: moerkere(toejFarve), B: '#3a2a20' },
  };
}

export const SKILT: Tegnkort = {
  raekker: ['KKKKKKKKKKKKKKKK', 'KCCCCCCCCCCCCCCK', 'KCddddddddddCCCK', 'KCCCCCCCCCCCCCCK', 'KCdddddddCCCCCCK', 'KCCCCCCCCCCCCCCK', 'KCddddddddddddCK', 'KCCCCCCCCCCCCCCK', 'KKKKKKKWWKKKKKKK', '.......WW.......', '.......WW.......', '.......WW.......', '......KWWK......'],
  palet: { K: '#3a2a20', C: '#efe3c4', d: '#8f8a9e', W: '#6b4a2b' },
};
export const LANTERNE: Tegnkort = { raekker: ['..l..', '.lll.', 'lLLLl', 'lLLLl', 'lLLLl', '.lll.'], palet: { l: '#6b4a2b', L: '#ffe9a8' } };
export const BLADE: Tegnkort = { raekker: ['....eE..Ee....', '..eEEbEeEEbe..', '.eEbEEEEEbEEe.', 'eEEEbEEbEEEEEe'], palet: { e: '#8a7656', E: '#e0c995', b: '#a99068' } };
export const STOLPE: Tegnkort = { raekker: ['KK', 'WW', 'WW', 'WW', 'WW', 'WW', 'KK'], palet: { K: '#3a2a20', W: '#6b4a2b' } };
export const PLANKE: Tegnkort = { raekker: ['PPPPPPPP', 'pppppppp'], palet: { P: '#a07a4a', p: '#5a3a28' } };
/** Lille taleboble med tre prikker over den, der taler. Ingen bogstaver. */
export const TALEBOBLE: Tegnkort = {
  raekker: ['.KKKKKKKKK.', 'KWWWWWWWWWK', 'KWKWWKWWKWK', 'KWWWWWWWWWK', '.KKKKWKKKK.', '.....KK....'],
  palet: { K: '#2a2f48', W: '#fbf6e8' },
};
export const PIL: Tegnkort = { raekker: ['KKKKKKK', 'KYYYYYK', '.KYYYK.', '..KYK..', '...K...'], palet: { K: '#2a170f', Y: '#ffe9a8' } };

/** Papirtræ set skråt oppefra: tre lag, lys side til venstre og skygge til højre. */
export function papirtrae(h: number): Tegnkort {
  const hw = Math.round(h * 0.36);
  const w = hw * 2 + 1;
  const cx = hw;
  const rk: string[][] = Array.from({ length: h + 6 }, () => Array(w).fill('.'));
  const by = h + 5;
  for (let y = by - 5; y <= by; y++) for (let x = cx - 1; x <= cx + 1; x++) rk[y][x] = x === cx + 1 ? 'b' : 'B';
  for (const [bred, top, bund] of [[0.36, 0.62, 0.0], [0.28, 0.85, 0.36], [0.19, 1.0, 0.64]]) {
    const b = by - 4 - Math.round(h * bund);
    const t = by - 4 - Math.round(h * top);
    const ww = Math.round(h * bred);
    for (let y = t; y <= b; y++) {
      const half = Math.round(((y - t) / Math.max(1, b - t)) * ww);
      for (let x = cx - half; x <= cx + half; x++) {
        const kant = x === cx - half || x === cx + half || y === b;
        rk[y][x] = kant ? 'K' : x <= cx ? 'L' : 'S';
      }
    }
    for (let k = 1; k <= 2; k++) {
      const yy = Math.round(b - ((b - t) * k) / 3);
      const half = Math.round(((yy - t) / Math.max(1, b - t)) * ww) - 2;
      for (let x = cx - half; x <= cx - 2; x++) rk[yy][x] = 'l';
    }
  }
  return { raekker: rk.map((r) => r.join('')), palet: { B: '#4a3426', b: '#3a2a20', K: '#2a2f48', L: '#f4efe0', S: '#b9bfcf', l: '#a7aab8' } };
}

/** Fyrtårn med lampe øverst (18 x 52). Lampen sidder 7 pixel nede. */
export function fyrtaarn(): Tegnkort {
  const w = 18;
  const h = 52;
  const rk: string[][] = Array.from({ length: h }, () => Array(w).fill('.'));
  for (let y = 0; y < 4; y++) for (let x = 7 - y; x <= 10 + y; x++) rk[y][x] = 'R';
  for (let y = 4; y < 11; y++) for (let x = 5; x <= 12; x++) rk[y][x] = x === 5 || x === 12 ? 'K' : 'Y';
  for (let x = 2; x <= 15; x++) {
    rk[11][x] = 'K';
    rk[12][x] = 'W';
  }
  for (let y = 13; y < h; y++) {
    const t = (y - 13) / (h - 14);
    const hw = 3.5 + t * 3.5;
    const l = Math.round(8.5 - hw);
    const r = Math.round(8.5 + hw);
    const stribe = Math.floor((y - 13) / 7) % 2;
    for (let x = l; x <= r; x++) {
      const skygge = x > 8.5 + hw * 0.4;
      rk[y][x] = x === l || x === r ? 'K' : stribe ? (skygge ? 'r' : 'D') : skygge ? 'S' : 'L';
    }
  }
  for (let x = 6; x <= 11; x++) rk[h - 8][x] = 'K';
  for (let y = h - 7; y < h; y++) for (let x = 7; x <= 10; x++) rk[y][x] = 'b';
  return {
    raekker: rk.map((r) => r.join('')),
    palet: { R: '#7a2e1f', K: '#2a170f', Y: '#ffe9a8', W: '#6b4a2b', D: '#c0503e', r: '#8e3428', L: '#f4efe0', S: '#b9bfcf', b: '#3a2a20' },
  };
}

/** Den Ufærdige: en høj skygge med løse, ufærdige kanter og to blege øjne. */
export const SKYGGE: Tegnkort = {
  raekker: [
    '......k..k......', '.....kUUUUk.....', '....kUUUUUUk....', '....UUUUUUUU....', '...kUOOUUOOUk...', '...UUUUUUUUUU...',
    '...kUUUUUUUUk...', '....UUUkUUUU....', '...kUUUUUUUUk...', '..kUUUUUUUUUUk..', '..UUUUUUUUUUUU..', '.kUUUUUUUUUUUUk.',
    '.UUUUUUUUUUUUUU.', '.UUUUUUkUUUUUUU.', 'kUUUUUUUUUUUUUUk', 'UUUUUUUUUUUUUUUU', 'UUUUkUUUUUUkUUUU', 'UUUUUUUUUUUUUUUU',
    'kUUUUUUUUUUUUUUk', '.UUUUUUUUUUUUUU.', '.UUUkUUUUUUUUUU.', '.kUUUUUUUUkUUUk.', '..UUUUUUUUUUUU..', '..kUU.UUUU.UUk..',
    '...UU.UUUU.UU...', '...k...UU...k...', '.......kk.......', '................',
  ],
  palet: { U: '#07080f', k: '#3a3d55', O: '#e8f0ff' },
};
