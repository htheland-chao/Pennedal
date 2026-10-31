import { t } from '../content';
import { erIndirekte, medTegn, TEGN, tjekRaaber, type RaaberSaetning, type Saetningstegn } from '../mechanics/raaber';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

const NAVN: Record<Saetningstegn, 'raaber.punktum' | 'raaber.spoergsmaal' | 'raaber.udraab'> = {
  '.': 'raaber.punktum',
  '?': 'raaber.spoergsmaal',
  '!': 'raaber.udraab',
};

function fejltekst(s: RaaberSaetning): string {
  if (s.tegn === '?') return t('raaber.fejl.spoergsmaal');
  if (s.tegn === '!') return t('raaber.fejl.udraab');
  return erIndirekte(s) ? t('raaber.fejl.indirekte') : t('raaber.fejl.punktum');
}

/** Råberens tegn: sætningen står uden tegn, og eleven vælger punktum, spørgsmålstegn eller udråbstegn. */
export function RaaberOpgave({ saetning, api }: { saetning: RaaberSaetning; api: OpgaveApi }) {
  return (
    <div className="raaber" data-saetning-id={saetning.id}>
      <p className="instruks">{t('raaber.instruks')}</p>
      <LaesOpKnap auto tekst={t('raaber.instruks')} figur="fortaeller" />
      <p className="raaber-saetning">
        {api.loest ? (
          medTegn(saetning, saetning.tegn)
        ) : (
          <>
            {saetning.tekst}
            <span className="raaber-hul" role="img" aria-label={t('raaber.mangler')} />
          </>
        )}
      </p>
      {api.loest && <LaesOpKnap auto tekst={medTegn(saetning, saetning.tegn)} figur="raaber" />}
      <div className="raaber-knapper" role="group" aria-label={t('raaber.instruks')}>
        {TEGN.map((tegn) => (
          <button
            key={tegn}
            type="button"
            className="knap raaber-knap"
            disabled={api.laast}
            onClick={() => api.tjek(tjekRaaber(saetning, tegn), fejltekst(saetning))}
          >
            <span className="raaber-tegn" aria-hidden="true">
              {tegn}
            </span>
            <span>{t(NAVN[tegn])}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
