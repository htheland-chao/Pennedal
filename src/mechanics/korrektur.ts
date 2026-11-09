/**
 * Klattens tekster (kapitel 6, Blæksøen, 9. november 2026). Ren logik uden React og tekster.
 * En kort tekst med 2-3 stavefejl. Eleven finder et forkert ord og vælger den rigtige stavemåde blandt tre.
 * Fejlene er stumme bogstaver, dobbeltkonsonant, udsagnsord i datid og navneord i bestemt flertal.
 * Ingen tid (krav 5). Reglerne står i ord/korrektur.json.
 */
import { bland, vaelg } from '../engine/tilfaeldig';
import type { KampOpgave } from './kamp';

export type FejlType = 'stumme' | 'dobbelt' | 'datid' | 'endelse';
export const FEJL_TYPER: FejlType[] = ['stumme', 'dobbelt', 'datid', 'endelse'];
export const FEJL_FAERDIGHED: Record<FejlType, string> = {
  stumme: 'stav.stumme',
  dobbelt: 'stav.vokal_dobbeltkonsonant',
  datid: 'stav.verbum_datid',
  endelse: 'stav.navneord_endelse',
};

export type Fejl = { skrevet: string; rigtig: string; ekstra: string; type: FejlType };
/** tekst har pladser {0}, {1} ... til fejlene i samme rækkefølge som fejl. */
export type KorrekturTekst = { id: string; svaerhed: number; tekst: string; fejl: Fejl[] };

/** Et stykke af teksten: almindelige ord (med mellemrum og tegn) eller en fejl. */
export type Stykke = { slags: 'tekst'; tekst: string } | { slags: 'fejl'; nr: number };

export function stykker(t: KorrekturTekst): Stykke[] {
  const ud: Stykke[] = [];
  const re = /\{(\d+)\}/g;
  let fra = 0;
  for (let m = re.exec(t.tekst); m; m = re.exec(t.tekst)) {
    if (m.index > fra) ud.push({ slags: 'tekst', tekst: t.tekst.slice(fra, m.index) });
    ud.push({ slags: 'fejl', nr: Number(m[1]) });
    fra = m.index + m[0].length;
  }
  if (fra < t.tekst.length) ud.push({ slags: 'tekst', tekst: t.tekst.slice(fra) });
  return ud;
}

/** Teksten med fejlene, som Klatten skrev den, eller rettet (rettede er de fejl, der er rettet). */
export function somTekst(t: KorrekturTekst, rettede: number[] | 'alle' = []): string {
  return t.tekst.replace(/\{(\d+)\}/g, (_, n: string) => {
    const f = t.fejl[Number(n)];
    return rettede === 'alle' || rettede.includes(Number(n)) ? f.rigtig : f.skrevet;
  });
}

/** Ordene i et stykke almindelig tekst, så hvert ord kan trykkes på. Tegn bliver ved ordet, mellemrum står for sig. */
export function ordI(tekst: string): string[] {
  return tekst.split(/(\s+)/).filter((x) => x.length > 0);
}

/** De tre muligheder for en fejl i tilfældig rækkefølge: den rigtige, Klattens og en anden forkert. */
export const muligheder = (f: Fejl, rnd: () => number) => bland([f.rigtig, f.skrevet, f.ekstra], rnd);

const svaerhedFor = (niveau: number) => (niveau <= 2 ? 1 : niveau === 3 ? 2 : 3);

/**
 * Vælg en tekst. Den svageste færdighed (laveste niveau) styrer: helst en tekst med den slags fejl,
 * og sværhedsgraden følger niveauet. Brugte tekster kommer først igen, når der ikke er flere.
 */
export function vaelgTekst(
  liste: KorrekturTekst[],
  niveauer: Record<FejlType, number>,
  rnd: () => number,
  brugt: string[] = [],
): KorrekturTekst {
  const svagest = Math.min(...FEJL_TYPER.map((x) => niveauer[x]));
  const svage = FEJL_TYPER.filter((x) => niveauer[x] === svagest);
  const nye = liste.filter((x) => !brugt.includes(x.id));
  const kilde = nye.length ? nye : liste;
  for (let s = svaerhedFor(svagest); s >= 1; s--) {
    const her = kilde.filter((x) => x.svaerhed === s);
    const med = her.filter((x) => x.fejl.some((f) => svage.includes(f.type)));
    if (med.length) return vaelg(med, rnd);
    if (her.length) return vaelg(her, rnd);
  }
  return vaelg(kilde, rnd);
}

/** Sætningen (afsluttet med . ? eller !), som fejl nr står i. De andre fejl i sætningen står rettet. */
export function saetningMed(t: KorrekturTekst, nr: number): { foer: string; efter: string } {
  const hel = t.tekst;
  const plads = hel.indexOf(`{${nr}}`);
  const start = Math.max(...['. ', '? ', '! '].map((s) => hel.lastIndexOf(s, plads)).map((i) => (i < 0 ? 0 : i + 2)));
  const slut = (() => {
    const ender = ['.', '?', '!'].map((s) => hel.indexOf(s, plads)).filter((i) => i >= 0);
    return ender.length ? Math.min(...ender) + 1 : hel.length;
  })();
  const ret = (x: string) => x.replace(/\{(\d+)\}/g, (_, n: string) => t.fejl[Number(n)].rigtig);
  return { foer: ret(hel.slice(start, plads)), efter: ret(hel.slice(plads + `{${nr}}`.length, slut)) };
}

/**
 * Krusedullerne i kampen (kapitel 6) viser én af Klattens fejl i sin sætning. Eleven vælger den rigtige stavemåde.
 * id er tekst og fejl (fx k07.1), så det samme ord ikke kommer igen med det samme.
 */
export function lavKrusedulleOpgave(liste: KorrekturTekst[], niveau: number, rnd: () => number, brugt: string[] = []): KampOpgave & { faerdighed: string } {
  const kandidater: { t: KorrekturTekst; nr: number }[] = [];
  for (let s = svaerhedFor(niveau); s >= 1 && !kandidater.length; s--)
    for (const t of liste.filter((x) => x.svaerhed <= s))
      t.fejl.forEach((_, nr) => {
        if (!brugt.includes(`${t.id}.${nr}`)) kandidater.push({ t, nr });
      });
  const { t, nr } = kandidater.length ? vaelg(kandidater, rnd) : { t: vaelg(liste, rnd), nr: 0 };
  const f = t.fejl[nr];
  const { foer, efter } = saetningMed(t, nr);
  return {
    vaesen: 'krusedulle',
    id: `${t.id}.${nr}`,
    ord: f.skrevet,
    saetning: `${foer}${f.rigtig}${efter}`,
    foer,
    vist: f.skrevet,
    efter,
    svar: f.rigtig,
    muligheder: muligheder(f, rnd),
    faerdighed: FEJL_FAERDIGHED[f.type],
    fejlType: f.type,
  };
}
