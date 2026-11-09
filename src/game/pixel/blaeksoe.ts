/**
 * Blæksøen (kapitel 6, 9. november 2026): Krusedullerne, Postsneglen, et brev og Klattens hytte af krøllede sider.
 * Tegnet til Pennedal. Ingen bogstaver: brevene og siderne har kun streger, man ikke kan læse.
 */
import { hash } from './lerred';
import type { Tegnkort } from './sprites';

/** En Krusedulle: chefens kludder. En sort, krøllet streg, der har fået øjne og ikke kan finde ud af, hvad den skal være. */
export const KRUSEDULLE: Tegnkort = {
  raekker: [
    '.....KKKK.......',
    '...KK....KK.....',
    '..K..KKK...K....',
    '.K..K...K...K...',
    '.K.K.WW.WWK.K...',
    'K..K.WE.WEK..K..',
    'K..K......K..K..',
    'K...K.KKK.K..K..',
    '.K...K...K..K...',
    '.K....KKK..K..K.',
    '..K.......K..K.K',
    '...KK...KK..K...',
    '.....KKK...K....',
    '....K..K..K.....',
    '...K....KK......',
    '..K.............',
  ],
  palet: { K: '#14121f', W: '#f4efe0', E: '#14121f' },
};

/** Postsneglen: en langsom snegl med et hus af sammenrullet papir og en lille postsæk. */
export const POSTSNEGL: Tegnkort = {
  raekker: [
    '..........KKKK....',
    '........KKPPPPKK..',
    '.......KPPpppPPPK.',
    '......KPpPPPPPpPPK',
    '......KPpPKKKPpPPK',
    '.KK...KPpPKPKPpPPK',
    'KEEK..KPPpPPPpPPPK',
    'KEEK...KPPpppPPPK.',
    '.KSK....KKPPPPKK..',
    '.KSSK.KBBKKKKK....',
    '.KSSSKBbBBKSSSK...',
    '..KSSSKBBKSSSSSKK.',
    '..KSSSSSSSSSSSSSSK',
    '...KKKKKKKKKKKKKK.',
  ],
  palet: { K: '#2a2433', P: '#efe3c4', p: '#b9a78a', E: '#1b1b24', S: '#9ab08a', B: '#a0703f', b: '#c9a46a' },
};

/** Et brev, der er faldet i søen: en lille, våd konvolut uden bogstaver. */
export const BREV: Tegnkort = {
  raekker: ['KKKKKKKKKK', 'KWwWWWWwWK', 'KWWwWWwWWK', 'KWWWwwWWWK', 'KWWWWWWWWK', 'KWWWWWWbbK', 'KKKKKKKKKK'],
  palet: { K: '#3a3550', W: '#f4efe0', w: '#c9c2d6', b: '#2a2e58' },
};

/**
 * Klattens hytte: vægge og tag af krøllede sider med streger, en rund dør af blæk og et lille vindue med lys.
 * 44 x 36. Fodpunktet er midt under døren. Tegnes med kode, så siderne krøller forskelligt.
 */
export function hytte(): Tegnkort {
  const B = 44;
  const H = 36;
  const rk: string[] = [];
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < B; x++) {
      const tag = y < 16;
      // Taget: en trekant af sider, der overlapper.
      const tagBredde = Math.round((y / 16) * 22) + 2;
      const iTag = tag && Math.abs(x - 21.5) <= tagBredde;
      const iVaeg = !tag && x >= 4 && x < 40;
      const skorsten = x >= 30 && x < 35 && y >= 2 && y < 12;
      let c = '.';
      if (skorsten) c = y === 2 || x === 30 || x === 34 ? 'K' : y < 4 ? 'b' : 'p';
      if (iTag) {
        const kant = Math.abs(x - 21.5) > tagBredde - 1 || y === 15;
        const side = Math.floor((x + (y % 4 < 2 ? 0 : 3)) / 6);
        c = kant ? 'K' : hash(side, Math.floor(y / 4)) > 0.5 ? 'P' : 'Q';
        if (!kant && y % 4 === 3) c = 'p';
        if (!kant && hash(x, y) > 0.9) c = 's';
      }
      if (iVaeg) {
        const kant = x === 4 || x === 39 || y === H - 1;
        const side = Math.floor((x - 4) / 7);
        c = kant ? 'K' : hash(side, 3) > 0.5 ? 'P' : 'Q';
        // Streger, som man ikke kan læse.
        if (!kant && (y - 17) % 3 === 0 && (x - 4) % 7 > 0 && (x - 4) % 7 < 6 && hash(x >> 1, y) > 0.3) c = 's';
        if (!kant && (x - 4) % 7 === 0) c = 'p';
        // Døren: rund top, blæk.
        const dx = x - 21.5;
        const iDoer = Math.abs(dx) <= 4.5 && (y >= 26 || (y >= 22 && dx * dx + (y - 26) * (y - 26) <= 22));
        if (iDoer) c = Math.abs(dx) > 3.5 || (y < 26 && dx * dx + (y - 26) * (y - 26) > 13) ? 'K' : y === 30 && dx > 1 ? 'y' : 'D';
        // Vinduet med varmt lys.
        if (x >= 9 && x <= 16 && y >= 20 && y <= 26) c = x === 9 || x === 16 || y === 20 || y === 26 || x === 12 || y === 23 ? 'K' : 'L';
        // En klat blæk, der er løbet ned ad væggen.
        if (x >= 31 && x <= 33 && y >= 18 && y <= 18 + Math.floor(hash(x, 9) * 8)) c = 'b';
      }
      r += c;
    }
    rk.push(r);
  }
  return {
    raekker: rk,
    palet: { K: '#1d1a2a', P: '#efe6d0', Q: '#ddd2b8', p: '#b9ad94', s: '#7d7590', D: '#1a1e3c', y: '#c9a46a', L: '#ffd98a', b: '#14162e' },
  };
}
