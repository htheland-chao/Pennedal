import { t } from '../content';
import type { Fortaeller, KlassificerSaetning } from '../mechanics/fortaeller';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

const VALG: Fortaeller[] = ['jeg', 'hanhun'];

/**
 * Fru Fodnotes bøger (kapitel 5): læs en sætning og sortér bogen efter, hvem der fortæller.
 * Sætningen står som rigtig tekst og kan læses op. Ingen tid.
 */
export function SynsvinkelOpgave({ opgave, api }: { opgave: KlassificerSaetning; api: OpgaveApi }) {
  const spoergsmaal = t('fortaeller.spoergsmaal');
  return (
    <div className="synsvinkel-opgave" data-opgave-id={opgave.id}>
      <p className="instruks">
        {spoergsmaal}
        <LaesOpKnap tekst={spoergsmaal} figur="fortaeller" />
      </p>
      <p className="kamp-saetning">
        {opgave.tekst}
        <LaesOpKnap tekst={opgave.tekst} figur="fortaeller" />
      </p>
      <div className="kamp-muligheder" role="group" aria-label={spoergsmaal}>
        {VALG.map((v) => (
          <button
            key={v}
            type="button"
            className="knap kamp-mulighed"
            data-valg={v}
            disabled={api.laast}
            onClick={() => api.tjek(v === opgave.fortaeller, t(`fortaeller.fejl.${opgave.fortaeller}`))}
          >
            {t(`fortaeller.${v}`)}
          </button>
        ))}
      </div>
      {api.loest && <p className="lille-tekst">{t(`fortaeller.rigtig.${opgave.fortaeller}`)}</p>}
    </div>
  );
}
