import { genreData, t } from '../content';
import type { GenreOpgave as GOpgave } from '../mechanics/genre';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

/** Spørgsmålet til en genreopgave. */
export function genreSpoergsmaal(o: GOpgave): string {
  return o.art === 'klassificer' ? t('genre.klassificer') : t('genre.kendetegn', { genre: genreData.navne[o.genre].toLowerCase() });
}

/** Teksten på en svarknap: genrens navn eller kendetegnet. */
export const genreEtiket = (o: GOpgave, m: string) => (o.art === 'klassificer' ? genreData.navne[m as keyof typeof genreData.navne] : m);

/** Fejlbeskeden: hvad den valgte genre eller det valgte kendetegn passer til i stedet. */
export function genreFejl(o: GOpgave, m: string): string {
  if (o.art === 'klassificer') return t('genre.fejl.klassificer', { valgt: genreData.navne[m as keyof typeof genreData.navne] });
  return t('genre.fejl.kendetegn', { valgt: m, genre: genreData.navne[o.genre].toLowerCase() });
}

/**
 * De halve lande (kapitel 7): find genren i et lille tekststykke, eller find det, der hører til en genre.
 * Teksten er rigtig HTML og kan læses op. Ingen tid (krav 5).
 */
export function GenreOpgave({ opgave, api }: { opgave: GOpgave; api: OpgaveApi }) {
  const spoergsmaal = genreSpoergsmaal(opgave);
  return (
    <div className="genre-opgave" data-opgave-id={opgave.id} data-opgave-art={opgave.art}>
      <p className="instruks">
        {spoergsmaal}
        <LaesOpKnap tekst={spoergsmaal} figur="fortaeller" />
      </p>
      {opgave.art === 'klassificer' && (
        <p className="kamp-saetning genre-tekst">
          {opgave.tekst}
          <LaesOpKnap tekst={opgave.tekst} figur="fortaeller" />
        </p>
      )}
      <div className="kamp-muligheder" role="group" aria-label={spoergsmaal}>
        {opgave.muligheder.map((m) => (
          <button key={m} type="button" className="knap kamp-mulighed" data-valg={m} disabled={api.laast} onClick={() => api.tjek(m === opgave.svar, genreFejl(opgave, m))}>
            {genreEtiket(opgave, m)}
          </button>
        ))}
      </div>
    </div>
  );
}
