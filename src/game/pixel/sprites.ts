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
 * Hovedpersonen i pixel ud fra elevens avatarvalg. Venstre tegnes som spejlet højre.
 * Hudfarve, hårfarve, hovedbeklædning, tøjfarve, kjole og briller vises. Frisure, øjne og mund vises endnu ikke.
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
  return {
    raekker: [...(hue ? TOP_HUE : TOP), ...hovedRaekker, ...KROP, ...ben],
    palet: {
      K: '#1b1b24',
      H: toerklaede ? hovedFarve : haar,
      h: moerkere(toerklaede ? hovedFarve : haar),
      U: hovedFarve,
      S: hud,
      s: moerkere(hud, 0.8),
      E: '#1b1b24',
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
