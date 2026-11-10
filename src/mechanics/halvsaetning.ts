/**
 * Halvsætningen (kapitel 8, Den sidste side, 10. november 2026): en sætning, der stopper midt i.
 * Eleven vælger den slutning, der passer (fort.struktur), eller det rigtige sætningstegn (tegn.saetningstegn).
 * Ren logik uden React og tekster. Ingen tid (krav 5).
 */
import { bland, vaelg } from '../engine/tilfaeldig';
import type { KampOpgave } from './kamp';

export type SlutSaetning = { id: string; svaerhed: number; foer: string; svar: string; forkerte: string[] };
export type TegnSaetning = { id: string; svaerhed: number; saetning: string; tegn: '.' | '?' | '!' };
export type HalvData = {
  regler: { slut: string; tegn: string };
  eksempler: { slut: string; tegn: string };
  tegnNavne: Record<'.' | '?' | '!', string>;
  slut: SlutSaetning[];
  tegn: TegnSaetning[];
};

const svaerhedFor = (niveau: number) => (niveau <= 2 ? 1 : niveau === 3 ? 2 : 3);

function vaelgPaaNiveau<T extends { id: string; svaerhed: number }>(liste: T[], niveau: number, rnd: () => number, brugt: string[]): T {
  for (let s = svaerhedFor(niveau); s >= 1; s--) {
    const her = liste.filter((x) => x.svaerhed <= s && !brugt.includes(x.id));
    if (her.length) return vaelg(her, rnd);
  }
  return vaelg(liste, rnd);
}

/** Skiftevis en slutning og et sætningstegn (nr er antallet af opgaver indtil nu). */
export function lavHalvsaetningOpgave(d: HalvData, nr: number, niveau: number, rnd: () => number, brugt: string[] = []): KampOpgave & { faerdighed: string; fejlType: 'slut' | 'tegn' } {
  if (nr % 2 === 0) {
    const s = vaelgPaaNiveau(d.slut, niveau, rnd, brugt);
    return {
      vaesen: 'halvsaetning',
      id: s.id,
      ord: s.foer,
      saetning: `${s.foer} ${s.svar}`,
      foer: `${s.foer} `,
      vist: '...',
      efter: '',
      svar: s.svar,
      muligheder: bland([s.svar, ...s.forkerte], rnd),
      faerdighed: 'fort.struktur',
      fejlType: 'slut',
    };
  }
  const t = vaelgPaaNiveau(d.tegn, niveau, rnd, brugt);
  const navn = d.tegnNavne[t.tegn];
  return {
    vaesen: 'halvsaetning',
    id: t.id,
    ord: t.saetning,
    saetning: `${t.saetning}${t.tegn}`,
    foer: t.saetning,
    vist: '_',
    efter: '',
    svar: navn,
    muligheder: (['.', '?', '!'] as const).map((x) => d.tegnNavne[x]),
    faerdighed: 'tegn.saetningstegn',
    fejlType: 'tegn',
  };
}
