import { t } from '../content';
import type { RimOpgave as ROpgave } from '../mechanics/rim';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

function fejltekst(o: ROpgave, valgt: string): string {
  if (o.art === 'rytme') return t('rim.rytme.fejl', { dele: o.dele ?? o.ord });
  return t(o.art === 'ikkerim' ? 'rim.ikkerim.fejl' : 'rim.rim.fejl', { valgt, ord: o.ord });
}

/**
 * Bjergets ældste digt (kapitel 4): find et ord, der rimer, eller klap et ord og tæl stavelserne.
 * Ordet står som rigtig tekst og kan læses op. Ingen tid.
 */
export function RimOpgave({ opgave, api }: { opgave: ROpgave; api: OpgaveApi }) {
  const spoergsmaal =
    opgave.art === 'rytme' ? t('rim.rytme.spoergsmaal', { ord: opgave.ord }) : t(opgave.art === 'ikkerim' ? 'rim.ikkerim.spoergsmaal' : 'rim.rim.spoergsmaal', { ord: opgave.ord });
  return (
    <div className="rim-opgave" data-opgave-id={opgave.id} data-opgave-art={opgave.art}>
      <p className="instruks">
        {spoergsmaal}
        <LaesOpKnap tekst={spoergsmaal} figur="fortaeller" />
      </p>
      <p className="kamp-saetning">
        <mark>{api.loest && opgave.dele ? opgave.dele : opgave.ord}</mark>
      </p>
      <div className="kamp-muligheder" role="group" aria-label={spoergsmaal}>
        {opgave.muligheder.map((m) => (
          <button key={m} type="button" className="knap kamp-mulighed" disabled={api.laast} onClick={() => api.tjek(m === opgave.svar, fejltekst(opgave, m))}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
