/**
 * Noder til baggrundsmusikken. Ren logik uden lyd, så den kan testes.
 *
 * Et spor skrives som ottendedele adskilt af mellemrum:
 *   C5, F#4, Bb3  en tone (oktav 0-8)
 *   -             den forrige tone holdes en ottendedel mere
 *   .             pause
 *   |             taktstreg (bruges kun for overblikkets skyld)
 */
export type Lyd = 'firkant' | 'trekant' | 'savtak' | 'stoej';

export type Spor = {
  lyd: Lyd;
  /** 0-1, før den samlede musikstyrke. */
  styrke: number;
  noder: string;
  /** Sporet spilles ikke, når "Mindre uhygge" er slået til. */
  uhygge?: boolean;
};

export type Sang = {
  /** Slag (fjerdedele) pr. minut. Et trin er en ottendedel. */
  bpm: number;
  spor: Spor[];
};

export type Tone = { trin: number; laengde: number; frekvens: number };

const HALVTONER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Frekvens i Hz. A4 = 440. */
export function frekvens(node: string): number {
  const m = /^([A-G])(#|b)?(\d)$/.exec(node);
  if (!m) throw new Error(`Ukendt node: ${node}`);
  const halv = HALVTONER[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + halv;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function trinISpor(noder: string): string[] {
  return noder.split(/\s+/).filter((x) => x && x !== '|');
}

/** Toner i et spor med starttrin og længde i ottendedele. */
export function laesSpor(noder: string): Tone[] {
  const ud: Tone[] = [];
  trinISpor(noder).forEach((x, i) => {
    if (x === '.') return;
    if (x === '-') {
      const sidste = ud[ud.length - 1];
      if (sidste && sidste.trin + sidste.laengde === i) sidste.laengde++;
      return;
    }
    ud.push({ trin: i, laengde: 1, frekvens: frekvens(x) });
  });
  return ud;
}

/** Brudte akkorder: én akkord pr. takt, spillet grundtone, terts, kvint, terts fire gange. */
export function arpeggio(akkorder: string[][]): string {
  return akkorder.map((a) => [0, 1, 2, 1, 0, 1, 2, 1].map((i) => a[i % a.length]).join(' ')).join(' | ');
}

/** Hvert akkordtrin holdt en hel takt. */
export function heleTakter(toner: string[]): string {
  return toner.map((t) => `${t} - - - - - - -`).join(' | ');
}
