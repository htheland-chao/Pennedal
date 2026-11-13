/**
 * Levende portrætter (13. november 2026): figurerne i dialogen blinker og bevæger munden, mens de taler.
 * Billederne laves ud fra de faste portrætter, så der ikke skal tegnes nye. Ingen bogstaver i grafikken.
 */
import type { Tegnkort } from './sprites';
import { PORTRAETTER } from './portraetter';

type Felt = { bogstaver: string; y?: [number, number] };
type Liv = { oejne?: Felt; mund?: Felt };

export type PortraetFigur = keyof typeof PORTRAETTER;

/** Hvilke farver der er øjne og mund i hvert portræt. Bogstaverne er paletbogstaverne i portraetter.ts. */
export const LIV: Record<PortraetFigur, Liv> = {
  vims: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'o' } },
  fodnote: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  tvivl: { oejne: { bogstaver: 'E' } },
  snegl: { oejne: { bogstaver: 'E' } },
  prinsesse: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  lup: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  grumsen: { oejne: { bogstaver: 'WE', y: [14, 15] } },
  bip: { oejne: { bogstaver: 'B' } },
  skyggen: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  halvsaetning: { oejne: { bogstaver: 'WE' } },
  rimfod: { oejne: { bogstaver: 'WE', y: [6, 7] } },
  ekko: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'o' } },
  halvfugl: { oejne: { bogstaver: 'E' } },
  tomordet: { oejne: { bogstaver: 'E' } },
  stumming: { oejne: { bogstaver: 'E' } },
  holm: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  lanterne: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  klatten: { oejne: { bogstaver: 'Oow', y: [10, 14] }, mund: { bogstaver: 'o', y: [17, 18] } },
  aeseloere: { oejne: { bogstaver: 'E' } },
  fortaeller: {},
  portvagt: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  raaber: { oejne: { bogstaver: 'E' } },
  borgmester: { oejne: { bogstaver: 'E' }, mund: { bogstaver: 'm' } },
  ufaerdige: { oejne: { bogstaver: 'O' } },
};

type Punkt = [number, number];

function find(kort: Tegnkort, felt: Felt): Punkt[] {
  const ud: Punkt[] = [];
  kort.raekker.forEach((r, y) => {
    if (felt.y && (y < felt.y[0] || y > felt.y[1])) return;
    [...r].forEach((c, x) => {
      if (felt.bogstaver.includes(c)) ud.push([x, y]);
    });
  });
  return ud;
}

function lysstyrke(farve: string): number {
  const n = parseInt(farve.slice(1, 7), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

/** Et nyt paletbogstav, der ikke er brugt i kortet. */
function nytBogstav(palet: Record<string, string>, farve: string): string {
  for (const [b, f] of Object.entries(palet)) if (f.toLowerCase() === farve.toLowerCase()) return b;
  for (const b of '0123456789#@$%&*+=') if (!(b in palet)) return b;
  throw new Error('Ingen ledige bogstaver i paletten');
}

function kopi(kort: Tegnkort): { gitter: string[][]; palet: Record<string, string> } {
  return { gitter: kort.raekker.map((r) => [...r]), palet: { ...kort.palet } };
}

function somKort(gitter: string[][], palet: Record<string, string>): Tegnkort {
  return { raekker: gitter.map((r) => r.join('')), palet };
}

/** Lukkede øjne: øjnene får øjenlågets farve, og en mørk streg viser, hvor øjet er (kun ved øjne over én pixel). */
export function blink(kort: Tegnkort, felt: Felt): Tegnkort {
  const oejne = find(kort, felt);
  if (oejne.length === 0) return kort;
  const { gitter, palet } = kopi(kort);
  const moerkeste = Object.entries(palet).sort((a, b) => lysstyrke(a[1]) - lysstyrke(b[1]))[0][0];
  const erOeje = (x: number, y: number) => oejne.some(([a, b]) => a === x && b === y);
  const bredde = gitter[0].length;
  for (const side of [0, 1]) {
    const del = oejne.filter(([x]) => (x < bredde / 2 ? 0 : 1) === side);
    if (del.length === 0) continue;
    const ys = del.map(([, y]) => y);
    const top = Math.min(...ys);
    const bund = Math.max(...ys);
    const hoejde = bund - top + 1;
    const streg = hoejde <= 2 ? bund : Math.round((top + bund) / 2);
    for (const [x, y] of del) {
      let laag = kort.raekker[top - 1]?.[x];
      if (!laag || laag === '.' || erOeje(x, top - 1)) laag = kort.raekker[y][x - 1] && !erOeje(x - 1, y) ? kort.raekker[y][x - 1] : moerkeste;
      if (laag === '.') laag = moerkeste;
      gitter[y][x] = hoejde > 1 && y === streg ? moerkeste : laag;
    }
  }
  return somKort(gitter, palet);
}

/** Åben mund: munden bliver mørk indeni, og læben rykker en pixel ned. */
export function aabenMund(kort: Tegnkort, felt: Felt): Tegnkort {
  const mund = find(kort, felt);
  if (mund.length === 0) return kort;
  const { gitter, palet } = kopi(kort);
  const farve = palet[kort.raekker[mund[0][1]][mund[0][0]]];
  const indeni = nytBogstav(palet, '#2a1418');
  palet[indeni] = '#2a1418';
  const erMund = (x: number, y: number) => mund.some(([a, b]) => a === x && b === y);
  const laebe = nytBogstav(palet, farve);
  palet[laebe] = farve;
  for (const [x, y] of mund) {
    gitter[y][x] = indeni;
    const under = kort.raekker[y + 1]?.[x];
    if (under && under !== '.' && !erMund(x, y + 1)) gitter[y + 1][x] = laebe;
  }
  return somKort(gitter, palet);
}

export type Billeder = { hvile: Tegnkort; blink: Tegnkort; tale: Tegnkort; blinkTale: Tegnkort };

/** De fire billeder af et portræt: hvile, blink, åben mund og begge dele. */
export function portraetBilleder(figur: PortraetFigur): Billeder {
  const kort = PORTRAETTER[figur];
  const liv = LIV[figur];
  const lukket = liv.oejne ? blink(kort, liv.oejne) : kort;
  const aaben = liv.mund ? aabenMund(kort, liv.mund) : kort;
  const begge = liv.mund ? aabenMund(lukket, liv.mund) : lukket;
  return { hvile: kort, blink: lukket, tale: aaben, blinkTale: begge };
}
