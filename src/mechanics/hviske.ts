import type { StumtOrd } from '../content';
import { bland, vaelg } from '../engine/tilfaeldig';
import type { Niveau } from '../engine/tilpasning';

export type HviskeForm = 'vaelg3' | 'vaelg5' | 'skriv1' | 'skriv2' | 'helt';

export type HviskeOpgave = {
  ord: StumtOrd;
  form: HviskeForm;
  /** Indeks for de bogstaver, der mangler. */
  huller: number[];
  /** Bogstaver at vælge imellem (kun i vælg-former). */
  valg: string[];
};

const LIGNENDE: Record<StumtOrd['type'], string[]> = {
  d: ['d', 't', 'l', 'n', 'r', 'g'],
  h: ['h', 'v', 'j', 'f', 'g', 'k'],
  v: ['v', 'f', 'w', 'u', 'b', 'p'],
};

const FORM_PR_NIVEAU: Record<Niveau, HviskeForm> = {
  1: 'vaelg3',
  2: 'vaelg5',
  3: 'skriv1',
  4: 'skriv2',
  5: 'helt',
};

const MAKS_SVAERHED: Record<Niveau, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 };

const VOKALER = 'aeiouyæøå';

export function lavHviskeOpgave(
  ordliste: StumtOrd[],
  niveau: Niveau,
  tal: () => number,
  nyligtBrugt: string[] = [],
): HviskeOpgave {
  const muligeAlle = ordliste.filter((o) => o.svaerhed <= MAKS_SVAERHED[niveau]);
  const ubrugte = muligeAlle.filter((o) => !nyligtBrugt.includes(o.ord));
  const ord = vaelg(ubrugte.length > 0 ? ubrugte : muligeAlle, tal);
  const form = FORM_PR_NIVEAU[niveau];
  const huller = [ord.stumt];
  if (form === 'skriv2') {
    // Det andet hul er en vokal, der kan høres. Så skal eleven både lytte og huske det stumme bogstav.
    const kandidater = [...ord.ord]
      .map((b, i) => ({ b, i }))
      .filter(({ b, i }) => i !== ord.stumt && VOKALER.includes(b));
    const andet = kandidater.length > 0 ? vaelg(kandidater, tal).i : ord.stumt === 0 ? 1 : 0;
    huller.push(andet);
    huller.sort((a, b) => a - b);
  }
  if (form === 'helt') {
    return { ord, form, huller: [...ord.ord].map((_, i) => i), valg: [] };
  }
  let valg: string[] = [];
  if (form === 'vaelg3' || form === 'vaelg5') {
    const rigtigt = ord.ord[ord.stumt];
    const andre = bland(
      LIGNENDE[ord.type].filter((b) => b !== rigtigt),
      tal,
    ).slice(0, form === 'vaelg3' ? 2 : 4);
    valg = bland([rigtigt, ...andre], tal);
  }
  return { ord, form, huller, valg };
}

/** Ordet med huller, fx ['k','o','l',null]. */
export function visHviske(opgave: HviskeOpgave): (string | null)[] {
  return [...opgave.ord.ord].map((b, i) => (opgave.huller.includes(i) ? null : b));
}

/** Svaret er enten de manglende bogstaver i rækkefølge eller hele ordet. */
export function tjekHviske(opgave: HviskeOpgave, svar: string[]): boolean {
  const ren = (s: string) => s.trim().toLocaleLowerCase('da-DK');
  if (opgave.form === 'helt') return ren(svar.join('')) === opgave.ord.ord;
  if (svar.length !== opgave.huller.length) return false;
  return opgave.huller.every((h, i) => ren(svar[i] ?? '') === opgave.ord.ord[h]);
}
