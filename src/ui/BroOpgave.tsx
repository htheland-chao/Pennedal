import { useEffect, useState } from 'react';
import { t, type TekstId } from '../content';
import { tjekBro, type Bro, type PlankeId } from '../mechanics/historiebro';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

export function BroOpgave({ bro, api }: { bro: Bro; api: OpgaveApi }) {
  const [paaBroen, setPaaBroen] = useState<PlankeId[]>(() => bro.planker.map((p) => p.id));
  const [tilSide, setTilSide] = useState<PlankeId[]>([]);
  const [fokus, setFokus] = useState<string | null>(null);
  const tekst = (id: PlankeId) => bro.planker.find((p) => p.id === id)!.tekst;

  useEffect(() => {
    if (!fokus) return;
    const [id, retning] = fokus.split('|');
    const kandidater = [retning, 'op', 'ned', 'tilbage', 'side'].map((r) =>
      document.querySelector<HTMLButtonElement>(`[data-fokus="${id}-${r}"]`),
    );
    kandidater.find((k) => k && !k.disabled)?.focus();
  }, [fokus, paaBroen, tilSide]);

  function flyt(i: number, retning: -1 | 1) {
    const j = i + retning;
    if (j < 0 || j >= paaBroen.length) return;
    const ny = [...paaBroen];
    [ny[i], ny[j]] = [ny[j], ny[i]];
    setPaaBroen(ny);
    setFokus(`${paaBroen[i]}|${retning === -1 ? 'op' : 'ned'}`);
  }

  function laegTilSide(id: PlankeId) {
    setPaaBroen(paaBroen.filter((x) => x !== id));
    setTilSide([...tilSide, id]);
    setFokus(`${id}|tilbage`);
  }

  function laegTilbage(id: PlankeId) {
    setTilSide(tilSide.filter((x) => x !== id));
    setPaaBroen([...paaBroen, id]);
    setFokus(`${id}|op`);
  }

  function tjek() {
    const r = tjekBro(bro, paaBroen, tilSide);
    if (r.ok) return api.tjek(true);
    if (r.fejl === 'placering')
      return api.tjek(false, t('bro.fejl.placering', { nr: r.nr, hint: t(`bro.hint.${r.traek}` as TekstId) }));
    if (r.fejl === 'fremmed') return api.tjek(false, t('bro.fejl.fremmed'));
    return api.tjek(false, t('bro.fejl.fjernet'));
  }

  return (
    <div className="bro" data-historie-id={bro.historie.id}>
      <p className="instruks">{t('bro.instruks')}</p>
      {bro.medFremmed && <p className="instruks">{t('bro.instruks.fremmed')}</p>}
      <h3>{bro.historie.titel}</h3>
      <ol className={`planker ${api.loest ? 'planker-loest' : ''}`}>
        {paaBroen.map((id, i) => (
          <li key={id} className="planke" data-planke-id={id}>
            <span className="planke-nr" aria-hidden="true">
              {i + 1}
            </span>
            <div className="planke-tekst">
              {bro.visEtiketter && id !== 'fremmed' && (
                <span className="planke-etiket">{t(`bro.traek.${id}` as TekstId)}: </span>
              )}
              {tekst(id)}
            </div>
            <div className="planke-knapper">
              <LaesOpKnap tekst={tekst(id)} etiket={t('dialog.laes.op')} />
              <button
                type="button"
                className="knap knap-lille"
                data-fokus={`${id}-op`}
                disabled={api.laast || i === 0}
                onClick={() => flyt(i, -1)}
              >
                <span aria-hidden="true">▲ </span>
                {t('bro.op')}
                <span className="sr-only">: {t('bro.planke', { nr: i + 1 })}</span>
              </button>
              <button
                type="button"
                className="knap knap-lille"
                data-fokus={`${id}-ned`}
                disabled={api.laast || i === paaBroen.length - 1}
                onClick={() => flyt(i, 1)}
              >
                <span aria-hidden="true">▼ </span>
                {t('bro.ned')}
                <span className="sr-only">: {t('bro.planke', { nr: i + 1 })}</span>
              </button>
              {bro.medFremmed && (
                <button
                  type="button"
                  className="knap knap-lille"
                  data-fokus={`${id}-side`}
                  disabled={api.laast}
                  onClick={() => laegTilSide(id)}
                >
                  {t('bro.til.side')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      {tilSide.length > 0 && (
        <div className="sidebunke">
          <p>{t('bro.sidebunke')}</p>
          <ul>
            {tilSide.map((id) => (
              <li key={id} className="planke planke-side" data-planke-id={id}>
                <div className="planke-tekst">{tekst(id)}</div>
                <button
                  type="button"
                  className="knap knap-lille"
                  data-fokus={`${id}-tilbage`}
                  disabled={api.laast}
                  onClick={() => laegTilbage(id)}
                >
                  {t('bro.tilbage')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!api.loest && (
        <div className="knaprad">
          <button type="button" className="knap knap-primaer" disabled={api.laast} onClick={tjek}>
            {t('opgave.tjek')}
          </button>
        </div>
      )}
    </div>
  );
}
