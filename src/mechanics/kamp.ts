/**
 * Rolige kampe (docs/historie.md, "Kampe: rolige valg"). Et væsen er bygget af én slags fejl,
 * og hver tur er en lille danskfaglig opgave med tre svarmuligheder. Et rigtigt svar gør væsnet roligere.
 * Et forkert svar gør aldrig ondt: der er intet liv og ingen tid, kun en regel og et eksempel.
 * Ren logik uden React og uden tekster. Teksterne står i src/content/tekster/da.json (kamp.*).
 */
import { bland, vaelg } from '../engine/tilfaeldig';

export type VaesenId = 'tomordet' | 'stumming';

export type Synonym = { id: string; ord: string; saetning: string; svar: string; forkerte: string[]; svaerhed: number };
export type StummeOrd = { ord: string; stumt: number; type: 'd' | 'h' | 'v'; svaerhed: number; saetning: string };

/** Én tur i kampen. Teksten, eleven ser, bygges af UI'et ud fra disse felter. */
export type KampOpgave = {
  vaesen: VaesenId;
  id: string;
  /** Ordet, det hele handler om (det ædte ord eller ordet, der mangler et bogstav). */
  ord: string;
  /** Sætningen som den er skrevet rigtigt. Den læses op med knappen Læs. */
  saetning: string;
  /** Sætningen, som væsnet viser den: ordet markeret eller med et hul. Delene før og efter hullet. */
  foer: string;
  vist: string;
  efter: string;
  svar: string;
  muligheder: string[];
  /** Kun stumme bogstaver: hvilken regel, der gælder. */
  type?: 'd' | 'h' | 'v';
};

/** Antal ture, før væsnet er roligt. Tre til fem, efter elevens niveau (tilpasning, ikke fart). */
export function antalTure(grund: number, niveau: number): number {
  return Math.min(5, grund + (niveau >= 3 ? 1 : 0) + (niveau >= 5 ? 1 : 0));
}

/** Sværhed ud fra niveau: 1-2 er let, 3 er mellem, 4-5 er svær. */
const svaerhedFor = (niveau: number) => (niveau <= 2 ? 1 : niveau === 3 ? 2 : 3);

/** Vælg på sværheden, eller den nærmeste lavere. Undgå de sidst brugte. */
function vaelgPaaNiveau<T extends { svaerhed: number }>(liste: T[], niveau: number, noegle: (x: T) => string, rnd: () => number, brugt: string[]): T {
  for (let s = svaerhedFor(niveau); s >= 1; s--) {
    const her = liste.filter((x) => x.svaerhed === s);
    const nye = her.filter((x) => !brugt.includes(noegle(x)));
    if (nye.length) return vaelg(nye, rnd);
    if (her.length) return vaelg(her, rnd);
  }
  return vaelg(liste, rnd);
}

/** Del sætningen op omkring ordet (første hele forekomst). Ordet returneres, som det står i sætningen (fx med stort). */
function delOmkring(saetning: string, ord: string): [string, string, string] {
  const m = new RegExp(`(^|[^\\p{L}])(${ord})(?=$|[^\\p{L}])`, 'iu').exec(saetning);
  if (!m) return [saetning, ord, ''];
  const start = m.index + m[1].length;
  return [saetning.slice(0, start), m[2], saetning.slice(start + ord.length)];
}

/** Tomordet har ædt et ord. Eleven vælger et ord, der betyder det samme (synonym). */
export function lavTomordOpgave(ord: Synonym[], niveau: number, rnd: () => number, brugt: string[] = []): KampOpgave {
  const o = vaelgPaaNiveau(ord, niveau, (x) => x.id, rnd, brugt);
  const [foer, somSkrevet, efter] = delOmkring(o.saetning, o.ord);
  return {
    vaesen: 'tomordet',
    id: o.id,
    ord: o.ord,
    saetning: o.saetning,
    foer,
    vist: somSkrevet,
    efter,
    svar: o.svar,
    muligheder: bland([o.svar, ...o.forkerte.slice(0, 2)], rnd),
  };
}

export const STUMME_BOGSTAVER = ['d', 'h', 'v'] as const;

/** Ordet med et hul, hvor det stumme bogstav var. */
export const medHul = (o: Pick<StummeOrd, 'ord' | 'stumt'>) => `${o.ord.slice(0, o.stumt)}_${o.ord.slice(o.stumt + 1)}`;

/** Stummingen har stjålet et stumt bogstav. Eleven vælger, hvilket bogstav der mangler. */
export function lavStummingOpgave(ord: StummeOrd[], niveau: number, rnd: () => number, brugt: string[] = []): KampOpgave {
  const o = vaelgPaaNiveau(ord, niveau, (x) => x.ord, rnd, brugt);
  const [foer, somSkrevet, efter] = delOmkring(o.saetning, o.ord);
  return {
    vaesen: 'stumming',
    id: o.ord,
    ord: somSkrevet,
    saetning: o.saetning,
    foer,
    vist: medHul({ ord: somSkrevet, stumt: o.stumt }),
    efter,
    svar: o.ord[o.stumt],
    muligheder: [...STUMME_BOGSTAVER],
    type: o.type,
  };
}

export const tjekKamp = (o: KampOpgave, valg: string) => o.svar === valg;

/**
 * Vims visker en forkert mulighed ud. Kun én pr. tur, og der er altid mindst to muligheder tilbage,
 * så eleven stadig selv skal vælge. Returnerer null, hvis der ikke er mere at viske.
 */
export function viskUd(o: KampOpgave, alleredeVaek: string[], rnd: () => number): string | null {
  const tilbage = o.muligheder.filter((m) => !alleredeVaek.includes(m));
  if (tilbage.length <= 2) return null;
  const forkerte = tilbage.filter((m) => m !== o.svar);
  return forkerte.length ? vaelg(forkerte, rnd) : null;
}
