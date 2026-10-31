/**
 * Indendørs steder: skolebiblioteket og kælderen. Gulv og vægge tegnes én gang pr. sted,
 * møbler bliver figurer med dybde, så hovedpersonen kan gå bag om dem. Kræver en browser.
 */
import { FELT, type Kort } from '../kort';
import { hash, lerred, lysTrin } from './lerred';
import type { Tegnkort } from './sprites';

const hx = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const rgb = (c: [number, number, number]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

export type Gulv = 'trae' | 'sten';

const TRAE = { a: hx('#b98b5a'), b: hx('#a97d50'), fuge: hx('#8a6340'), knast: hx('#7a5636') };
const STEN = { a: hx('#7a7468'), b: hx('#716b60'), fuge: hx('#4a453e'), plet: hx('#8a8476') };
const TAEPPE = { a: hx('#7a2e1f'), b: hx('#8e3428'), kant: hx('#c9a24a'), moenster: hx('#e0c995') };
const VAEG = { a: hx('#8a5a3a'), b: hx('#7a4e33'), panel: hx('#5a3a28'), liste: hx('#3a2a20') };
const STENVAEG = { a: hx('#5b5663'), b: hx('#4f4a57'), fuge: hx('#332f3a') };
const MOERK = hx('#3a2a20');
const MOERK2 = hx('#2a170f');
const BOGFARVER = ['#c0503e', '#2f7a6b', '#2c6fbb', '#e5c03a', '#7b4bb3', '#e0c995', '#8e3428', '#3d7a57'].map(hx);

/** Et kort er indendørs, hvis det har mørke ydervægge (K). */
export const erInde = (kort: Kort) => {
  for (let y = 0; y < kort.hoejde; y++) for (let x = 0; x < kort.bredde; x++) if (kort.tegn(x, y) === 'K') return true;
  return false;
};

/** Gulv, vægge, vinduer og tæppe. */
export function tegnRum(kort: Kort, gulv: Gulv): HTMLCanvasElement {
  const W = kort.bredde * FELT;
  const H = kort.hoejde * FELT;
  const c = lerred(W, H);
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const p = img.data;
  const vaegHoejde = (tx: number) => {
    let n = 0;
    while ('VvW'.includes(kort.tegn(tx, n)) && n < kort.hoejde) n++;
    return n;
  };
  for (let ty = 0; ty < kort.hoejde; ty++)
    for (let tx = 0; tx < kort.bredde; tx++) {
      const t = kort.tegn(tx, ty);
      const sidsteVaegRaekke = ty === vaegHoejde(tx) - 1;
      for (let py = 0; py < FELT; py++)
        for (let px = 0; px < FELT; px++) {
          const X = tx * FELT + px;
          const Y = ty * FELT + py;
          const r = hash(X, Y);
          let col: [number, number, number];
          if (t === 'K' || t === 'd') col = (px + py) % 7 === 0 ? MOERK2 : MOERK;
          else if (t === 'V' || t === 'v') {
            if (sidsteVaegRaekke && py >= 8) col = py === 8 ? VAEG.liste : px % 8 === 0 ? VAEG.liste : VAEG.panel;
            else col = X % 6 < 3 ? VAEG.a : VAEG.b;
          } else if (t === 'W') {
            // Kældervæg af kampesten i forskudte rækker.
            const raekke = Math.floor(Y / 6);
            const fx = (X + (raekke % 2) * 5) % 10;
            col = Y % 6 === 5 || fx === 0 ? STENVAEG.fuge : hash(raekke, Math.floor((X + (raekke % 2) * 5) / 10)) < 0.5 ? STENVAEG.a : STENVAEG.b;
            if (sidsteVaegRaekke && py >= 14) col = STENVAEG.fuge;
          } else if (gulv === 'sten') {
            // Store fliser, én pr. felt, med fuger og enkelte revner. Ikke murstensmønster som væggen.
            const flise = hash(tx * 3 + 1, ty * 5 + 2);
            col = px === 15 || py === 15 ? STEN.fuge : flise < 0.5 ? STEN.a : STEN.b;
            if (px === 0 || py === 0) col = STEN.plet;
            if (flise > 0.8 && px === py + 3 && px > 4 && px < 13) col = STEN.fuge;
            if (r > 0.992) col = STEN.plet;
          } else {
            // Gulv af planker.
            const raekke = Math.floor(Y / 4);
            const forskyd = (raekke * 7) % 16;
            col = Y % 4 === 3 ? TRAE.fuge : (X + forskyd) % 16 === 0 ? TRAE.fuge : hash(raekke, Math.floor((X + forskyd) / 16)) < 0.5 ? TRAE.a : TRAE.b;
            if (r > 0.995) col = TRAE.knast;
          }
          if (t === 't') {
            const kant =
              (kort.tegn(tx - 1, ty) !== 't' && px < 2) ||
              (kort.tegn(tx + 1, ty) !== 't' && px > 13) ||
              (kort.tegn(tx, ty - 1) !== 't' && py < 2) ||
              (kort.tegn(tx, ty + 1) !== 't' && py > 13);
            col = kant ? TAEPPE.kant : (px + py) % 8 === 0 || (px - py + 16) % 8 === 0 ? TAEPPE.moenster : r < 0.5 ? TAEPPE.a : TAEPPE.b;
          }
          const o = (Y * W + X) * 4;
          p[o] = col[0];
          p[o + 1] = col[1];
          p[o + 2] = col[2];
          p[o + 3] = 255;
        }
    }
  g.putImageData(img, 0, 0);
  // Vinduer: to felter brede.
  for (const v of vinduer(kort)) {
    const x = v.tx * FELT + 3;
    const w = 26;
    const y = 3;
    const h = 22;
    g.fillStyle = '#3a2a20';
    g.fillRect(x - 2, y - 2, w + 4, h + 4);
    g.fillStyle = '#9ec3e6';
    g.fillRect(x, y, w, h);
    g.fillStyle = '#cfe3f5';
    for (let i = 0; i < 6; i++) g.fillRect(x + 4 + i, y + 2 + i * 2, 2, 2);
    g.fillStyle = '#3a2a20';
    g.fillRect(x + w / 2 - 1, y, 2, h);
    g.fillRect(x, y + h / 2 - 1, w, 2);
    g.fillStyle = '#6b4a2b';
    g.fillRect(x - 3, y + h + 1, w + 6, 2);
  }
  return c;
}

/** Venstre felt i hvert vindue i den øverste række. */
export function vinduer(kort: Kort): { tx: number }[] {
  const ud: { tx: number }[] = [];
  for (let tx = 0; tx < kort.bredde; tx++) if (kort.tegn(tx, 0) === 'v' && kort.tegn(tx - 1, 0) !== 'v') ud.push({ tx });
  return ud;
}

/** En reol fyldt med bøger. I kælderen er bøgerne mørkere og støvede. */
export function reol(hoejde: number, gammel = false): HTMLCanvasElement {
  const w = 16;
  const c = lerred(w, hoejde);
  const g = c.getContext('2d')!;
  g.fillStyle = '#3a2a20';
  g.fillRect(0, 0, w, hoejde);
  g.fillStyle = gammel ? '#4a3426' : '#6b4a2b';
  g.fillRect(1, 1, w - 2, hoejde - 2);
  const hylder = Math.floor((hoejde - 3) / 7);
  for (let i = 0; i < hylder; i++) {
    const y0 = 2 + i * 7;
    g.fillStyle = '#2a170f';
    g.fillRect(2, y0, w - 4, 6);
    let x = 2;
    while (x < w - 2) {
      const bw = hash(x * 3 + i, hoejde + i * 5) < 0.3 ? 2 : 1;
      if (hash(x + i * 11, hoejde * 3 + (gammel ? 7 : 0)) > (gammel ? 0.3 : 0.12)) {
        const fc = BOGFARVER[Math.floor(hash(x * 7 + i, i * 13 + hoejde) * BOGFARVER.length)];
        const bh = 4 + Math.floor(hash(x, i * 3 + hoejde) * 2);
        const f = gammel ? 0.6 : 1;
        g.fillStyle = rgb([Math.round(fc[0] * f), Math.round(fc[1] * f), Math.round(fc[2] * f)]);
        g.fillRect(x, y0 + 6 - bh, Math.min(bw, w - 2 - x), bh);
      }
      x += bw;
    }
    g.fillStyle = gammel ? '#5a4a3a' : '#8a6a45';
    g.fillRect(1, y0 + 6, w - 2, 1);
  }
  if (gammel) {
    // Spindelvæv i det øverste hjørne.
    g.fillStyle = '#b9bfcf';
    for (let i = 0; i < 5; i++) g.fillRect(w - 2 - i, 1 + i, 1, 1);
    g.fillRect(w - 6, 1, 5, 1);
    g.fillRect(w - 2, 1, 1, 5);
  }
  return c;
}

/** Bordplade set skråt oppefra med en forkant. */
export function bordflade(bredde: number, dybde: number, top: string, front: string): HTMLCanvasElement {
  const c = lerred(bredde, dybde + 6);
  const g = c.getContext('2d')!;
  g.fillStyle = '#2a170f';
  g.fillRect(0, 0, bredde, dybde + 6);
  g.fillStyle = top;
  g.fillRect(1, 1, bredde - 2, dybde - 2);
  g.fillStyle = '#c9a46a';
  g.fillRect(1, 1, bredde - 2, 1);
  g.fillStyle = front;
  g.fillRect(1, dybde, bredde - 2, 5);
  for (let x = 6; x < bredde - 4; x += 10) {
    g.fillStyle = '#5a3a28';
    g.fillRect(x, dybde + 1, 1, 4);
  }
  return c;
}

/** Trappe. Ned: trinene bliver mørkere. Op: lyset kommer oppefra. */
export function trappe(op: boolean): HTMLCanvasElement {
  const c = lerred(16, 22);
  const g = c.getContext('2d')!;
  g.fillStyle = '#1a0e09';
  g.fillRect(0, 0, 16, 22);
  const farver = ['#6b4a2b', '#5a3a28', '#4a3426', '#3a2a20', '#2a170f'];
  if (op) farver.reverse();
  for (let i = 0; i < 5; i++) {
    g.fillStyle = farver[i];
    g.fillRect(1, 2 + i * 4, 14, 3);
  }
  g.fillStyle = '#8a6a45';
  g.fillRect(0, 0, 1, 22);
  g.fillRect(15, 0, 1, 22);
  g.fillStyle = '#c9a46a';
  g.fillRect(0, 0, 16, 1);
  return c;
}

export const PLANTE: Tegnkort = {
  raekker: ['...g.gg..', '..gGgGgg.', '.gGgGGgGg', '..gGgGgg.', '...gGg...', '..KKKKK..', '..KppppK.', '..KppppK.', '...KKKK..'],
  palet: { g: '#2f6448', G: '#4f9467', K: '#5a3a28', p: '#a0522d' },
};

export const LOGBOG: Tegnkort = {
  raekker: ['.KKKKKKKKKK.', 'KPPPPKPPPPPK', 'KPllPKPllPPK', 'KPPPPKPPPPPK', 'KPllPKPlllPK', 'KPPPPKPPPPPK', '.KKKKKKKKKK.'],
  palet: { K: '#5a3a28', P: '#f4efe0', l: '#8f8a9e' },
};

/** Hr. Holm: gråt hår, briller og brun cardigan over en lys skjorte. */
export const HOLM: Tegnkort = {
  raekker: [
    '................', '.....KKKKK......', '....KHHHHHK.....', '...KHHhhhHHK....', '..KHhSSSSShHK...', '..KHSSSSSSSHK...',
    '..KHGEGSGEGHK...', '..KhSSSSSSShK...', '..KhSSssSSShK...', '...KSSSSSSSK....', '..KTTTWWWTTTK...', '.KTTTTWWWTTTTK..',
    '.KTtTTWWWTTtTK..', '.KStTTWWWTTtSK..', '.KTtTTTTTTTtTK..', '.KTTTTTTTTTTTK..', '..KPPPPPPPPPK...', '..KPPPPKPPPPK...',
    '..KPPPK.KPPPK...', '..KPPPK.KPPPK...', '..KPPPK.KPPPK...', '..KBBBK.KBBBK...', '..KKKKK.KKKKK...', '................',
  ],
  palet: { K: '#1b1b24', H: '#d6d6d6', h: '#a9a9a9', S: '#e0a982', s: '#c98d63', E: '#1b1b24', G: '#2a2f48', T: '#7a5c3e', t: '#5c442c', W: '#e8dcc0', P: '#3a3550', B: '#3a2a20' },
};

/** Kartoteksskabet med mange små skuffer. Ingen bogstaver, kun små messinggreb. */
export const KARTOTEK: Tegnkort = {
  raekker: [
    'KKKKKKKKKKKKKKKK', 'KwwwwwwwwwwwwwwK', 'KWWWWWWWWWWWWWWK', 'KWddKddKddKddWWK', 'KWdgKdgKdgKdgWWK', 'KWddKddKddKddWWK',
    'KWKKKKKKKKKKKWWK', 'KWddKddKddKddWWK', 'KWdgKdgKdgKdgWWK', 'KWddKddKddKddWWK', 'KWKKKKKKKKKKKWWK', 'KWddKddKddKddWWK',
    'KWdgKdgKdgKdgWWK', 'KWddKddKddKddWWK', 'KWKKKKKKKKKKKWWK', 'KWddKddKddKddWWK', 'KWdgKdgKdgKdgWWK', 'KWddKddKddKddWWK',
    'KWKKKKKKKKKKKWWK', 'KWWWWWWWWWWWWWWK', 'KWWKWWWWWWWWKWWK', 'KKKK........KKKK',
  ],
  palet: { K: '#2a170f', W: '#6b4a2b', w: '#8a6a45', d: '#4a3426', g: '#f0c45a' },
};

/** Trækasse til kælderen. */
export const KASSE: Tegnkort = {
  raekker: [
    'KKKKKKKKKKKKKK', 'KllllllllllllK', 'KLLLLLLLLLLLLK', 'KllllllllllllK', 'KKKKKKKKKKKKKK', 'KWWWWWWWWWWWWK',
    'KWWwWWWWWWwWWK', 'KWWWwWWWWwWWWK', 'KWWWWwWWwWWWWK', 'KWWWWWwwWWWWWK', 'KWWWWwWWwWWWWK', 'KKKKKKKKKKKKKK',
  ],
  palet: { K: '#2a170f', l: '#8a6a45', L: '#a07a4a', W: '#6b4a2b', w: '#4a3426' },
};

/**
 * Lys, der falder skråt ind fra et vindue. Bredde 60, højde 96. Tegnes med "lighten" oven på grundtonen.
 */
export function vindueslys(tone: [number, number, number], farve: [number, number, number]): HTMLCanvasElement {
  const w = 60;
  const h = 96;
  const c = lerred(w, h);
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  const p = img.data;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const skraa = x - y * 0.32;
      if (skraa < 2 || skraa > 30) continue;
      const s = lysTrin(0.9 * (1 - y / h), x, y);
      if (s <= 0) continue;
      const o = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) p[o + k] = tone[k] + s * (farve[k] - tone[k]);
      p[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}
