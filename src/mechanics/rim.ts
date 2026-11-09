/**
 * Rim og rytme (kapitel 4, Rimbjerget, 9. november 2026). Ren logik uden React og uden tekster.
 *   rim: find det ord, der rimer (ekkoet, ordstenene på bjerget).
 *   ikkerim: find det ord, der IKKE rimer (Rimfod vil sige én sætning uden rim).
 *   rytme: hvor mange stavelser har ordet? (klap ordet).
 * Ingen tid (krav 5). Feedback med regel og eksempel står i tekster/da.json (rim.*, rytme.*).
 */
import { bland, vaelg } from '../engine/tilfaeldig';

export type RimOrd = { ord: string; rimer: string[]; forkerte: string[]; svaerhed: number };
export type StavelseOrd = { ord: string; dele: string; svaerhed: number };
export type RimArt = 'rim' | 'ikkerim' | 'rytme';

export type RimOpgave = {
  art: RimArt;
  id: string;
  /** Ordet, opgaven handler om. */
  ord: string;
  svar: string;
  muligheder: string[];
  /** Kun rytme: ordet delt i stavelser, fx ba-nan. */
  dele?: string;
};

const svaerhedFor = (niveau: number) => (niveau <= 2 ? 1 : niveau === 3 ? 2 : 3);

function vaelgOrd<T extends { ord: string; svaerhed: number }>(liste: T[], niveau: number, rnd: () => number, brugt: string[]): T {
  const s = svaerhedFor(niveau);
  for (let n = s; n >= 1; n--) {
    const kandidater = liste.filter((x) => x.svaerhed === n && !brugt.includes(x.ord));
    if (kandidater.length) return vaelg(kandidater, rnd);
  }
  const rest = liste.filter((x) => !brugt.includes(x.ord));
  return vaelg(rest.length ? rest : liste, rnd);
}

/** Antal stavelser ud fra delingen (ba-nan giver 2). */
export const antalStavelser = (dele: string) => dele.split('-').length;

export function lavRimOpgave(ord: RimOrd[], niveau: number, rnd: () => number, brugt: string[] = []): RimOpgave {
  const o = vaelgOrd(ord, niveau, rnd, brugt);
  const svar = vaelg(o.rimer, rnd);
  const forkerte = bland([...o.forkerte], rnd).slice(0, 2);
  return { art: 'rim', id: o.ord, ord: o.ord, svar, muligheder: bland([svar, ...forkerte], rnd) };
}

/** To ord, der rimer, og ét, der ikke gør. Svaret er det, der ikke rimer. */
export function lavIkkeRimOpgave(ord: RimOrd[], niveau: number, rnd: () => number, brugt: string[] = []): RimOpgave {
  const kandidater = ord.filter((x) => x.rimer.length >= 2);
  const o = vaelgOrd(kandidater, niveau, rnd, brugt);
  const rimer = bland([...o.rimer], rnd).slice(0, 2);
  const svar = vaelg(o.forkerte, rnd);
  return { art: 'ikkerim', id: o.ord, ord: o.ord, svar, muligheder: bland([...rimer, svar], rnd) };
}

/** Hvor mange stavelser? Mulighederne er altid 1, 2, 3 og 4. */
export function lavRytmeOpgave(ord: StavelseOrd[], niveau: number, rnd: () => number, brugt: string[] = []): RimOpgave {
  const o = vaelgOrd(ord, niveau, rnd, brugt);
  return { art: 'rytme', id: o.ord, ord: o.ord, svar: String(antalStavelser(o.dele)), muligheder: ['1', '2', '3', '4'], dele: o.dele };
}

export function lavOpgaveAfArt(art: RimArt, data: { rim: RimOrd[]; stavelser: StavelseOrd[] }, niveau: number, rnd: () => number, brugt: string[] = []): RimOpgave {
  if (art === 'rytme') return lavRytmeOpgave(data.stavelser, niveau, rnd, brugt);
  if (art === 'ikkerim') return lavIkkeRimOpgave(data.rim, niveau, rnd, brugt);
  return lavRimOpgave(data.rim, niveau, rnd, brugt);
}
