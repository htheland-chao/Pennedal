/**
 * Genrer (kapitel 7, De halve lande, 9. november 2026). Ren logik uden React og tekster.
 *   klassificer: hvilken genre er et lille tekststykke?
 *   kendetegn: hvilket af tre kendetegn hører til en bestemt genre?
 * Ingen tid (krav 5). Regler og eksempler står i ord/genre.json.
 */
import { bland, vaelg } from '../engine/tilfaeldig';

export type Genre = 'eventyr' | 'krimi' | 'gyser' | 'sf';
export const GENRER: Genre[] = ['eventyr', 'krimi', 'gyser', 'sf'];
export type GenreTekst = { id: string; genre: Genre; svaerhed: number; tekst: string };
export type GenreData = { navne: Record<Genre, string>; regler: Record<Genre, string>; eksempler: Record<Genre, string>; kendetegn: Record<Genre, string[]>; tekster: GenreTekst[] };

/** En opgave: enten et tekststykke, hvor genren skal findes, eller et spørgsmål om, hvad der hører til en genre. */
export type GenreOpgave =
  | { art: 'klassificer'; id: string; genre: Genre; tekst: string; svar: Genre; muligheder: Genre[] }
  | { art: 'kendetegn'; id: string; genre: Genre; svar: string; muligheder: string[] };

const svaerhedFor = (niveau: number) => (niveau <= 2 ? 1 : niveau === 3 ? 2 : 3);

export function lavKlassificer(d: GenreData, niveau: number, rnd: () => number, brugt: string[] = []): GenreOpgave {
  let kandidater: GenreTekst[] = [];
  for (let s = svaerhedFor(niveau); s >= 1 && !kandidater.length; s--) kandidater = d.tekster.filter((x) => x.svaerhed === s && !brugt.includes(x.id));
  if (!kandidater.length) kandidater = d.tekster.filter((x) => !brugt.includes(x.id));
  const t = vaelg(kandidater.length ? kandidater : d.tekster, rnd);
  return { art: 'klassificer', id: t.id, genre: t.genre, tekst: t.tekst, svar: t.genre, muligheder: [...GENRER] };
}

/** Et kendetegn fra genren og to fra andre genrer. id er genre og nummer, fx krimi.2. */
export function lavKendetegn(d: GenreData, genre: Genre, rnd: () => number, brugt: string[] = []): GenreOpgave {
  const egne = d.kendetegn[genre].map((k, i) => ({ k, id: `${genre}.${i}` }));
  const nye = egne.filter((x) => !brugt.includes(x.id));
  const valgt = vaelg(nye.length ? nye : egne, rnd);
  const andre = bland(GENRER.filter((g) => g !== genre), rnd).slice(0, 2);
  const forkerte = andre.map((g) => vaelg(d.kendetegn[g], rnd));
  return { art: 'kendetegn', id: valgt.id, genre, svar: valgt.k, muligheder: bland([valgt.k, ...forkerte], rnd) };
}

/** Skiftevis et tekststykke og et kendetegn. Fokus er den genre, opgaven handler om (eller en tilfældig). */
export function lavGenreOpgave(d: GenreData, nr: number, fokus: Genre | undefined, niveau: number, rnd: () => number, brugt: string[] = []): GenreOpgave {
  if (nr % 2 === 0) return lavKlassificer(d, niveau, rnd, brugt);
  return lavKendetegn(d, fokus ?? vaelg(GENRER, rnd), rnd, brugt);
}
