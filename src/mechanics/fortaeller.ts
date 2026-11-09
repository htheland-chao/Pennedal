/**
 * Fortæller og synsvinkel (kapitel 5, Fodnoternes kælder, 9. november 2026). Ren logik uden React og tekster.
 *   klassificer: er sætningen fortalt af en jeg-fortæller eller en han/hun-fortæller?
 *   fortsaet: vælg det ord, der holder fast i den samme fortæller i næste sætning.
 * Ingen tid (krav 5). Regel og eksempel står i tekster/da.json (fortaeller.*).
 */
import { bland, vaelg } from '../engine/tilfaeldig';

export type Fortaeller = 'jeg' | 'hanhun';
export type KlassificerSaetning = { id: string; tekst: string; fortaeller: Fortaeller; svaerhed: number };
export type FortsaetSaetning = { id: string; foer: string; efter: string; svar: string; forkerte: string[]; svaerhed: number };

const svaerhedFor = (niveau: number) => (niveau <= 2 ? 1 : niveau === 3 ? 2 : 3);

function vaelgSaetning<T extends { id: string; svaerhed: number }>(liste: T[], niveau: number, rnd: () => number, brugt: string[]): T {
  for (let n = svaerhedFor(niveau); n >= 1; n--) {
    const k = liste.filter((x) => x.svaerhed === n && !brugt.includes(x.id));
    if (k.length) return vaelg(k, rnd);
  }
  const rest = liste.filter((x) => !brugt.includes(x.id));
  return vaelg(rest.length ? rest : liste, rnd);
}

export function lavKlassificer(liste: KlassificerSaetning[], niveau: number, rnd: () => number, brugt: string[] = []): KlassificerSaetning {
  return vaelgSaetning(liste, niveau, rnd, brugt);
}

export type FortsaetOpgave = { id: string; foer: string; efter: string; svar: string; muligheder: string[] };

export function lavFortsaet(liste: FortsaetSaetning[], niveau: number, rnd: () => number, brugt: string[] = []): FortsaetOpgave {
  const s = vaelgSaetning(liste, niveau, rnd, brugt);
  return { id: s.id, foer: s.foer, efter: s.efter, svar: s.svar, muligheder: bland([s.svar, ...s.forkerte.slice(0, 2)], rnd) };
}

/** Sætningen med hullet udfyldt, fx "Jeg fandt en gammel bog. Jeg blæste støvet af den." */
export const helSaetning = (o: { foer: string; efter: string }, ord: string) => `${o.foer} ${ord} ${o.efter}`;
