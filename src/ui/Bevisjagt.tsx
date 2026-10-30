import { useState } from 'react';
import { findOrdkort, renTekst, t, type BevisjagtTrin } from '../content';
import { useApp } from './Kontekst';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap, Tekst } from './Tekst';

export function Forforstaaelse({ trin, onVidere }: { trin: BevisjagtTrin; onVidere: () => void }) {
  const { visOrdkort } = useApp();
  return (
    <div className="forforstaaelse">
      <p className="instruks">{t('bevisjagt.foer')}</p>
      <ul className="ordkort-liste">
        {trin.forforstaaelse.map((id) => {
          const k = findOrdkort(id);
          return (
            <li key={id}>
              <button type="button" className="knap ordkort-knap" onClick={() => visOrdkort(id)}>
                <span aria-hidden="true">{k?.billede} </span>
                {k?.ord}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="knaprad">
        <button type="button" className="knap knap-primaer" onClick={onVidere}>
          {t('bevisjagt.til.teksten')}
        </button>
      </div>
    </div>
  );
}

export function Bevisjagt({ trin, nr, api }: { trin: BevisjagtTrin; nr: number; api: OpgaveApi }) {
  const spg = trin.spoergsmaal[nr];
  const [valgt, setValgt] = useState<number | null>(null);
  if (!spg) return null;
  return (
    <div className="bevisjagt" data-spoergsmaal-id={spg.id}>
      <h3>{trin.titel}</h3>
      <LaesOpKnap tekst={trin.saetninger.map(renTekst).join(' ')} />
      <p className="instruks">{t('bevisjagt.instruks')}</p>
      <p className="spoergsmaal">
        <span className="lille-tekst">{t('bevisjagt.spoergsmaal', { nr: nr + 1, antal: trin.spoergsmaal.length })}: </span>
        <strong>{spg.tekst}</strong>
      </p>
      <ol className="saetninger">
        {trin.saetninger.map((s, i) => {
          const vaelg = () => {
            if (api.laast) return;
            setValgt(i);
            api.tjek(i === spg.svar, spg.forkert[String(i)] ?? spg.standard);
          };
          return (
            <li
              key={i}
              className={`saetning ${valgt === i ? (api.loest ? 'saetning-rigtig' : 'saetning-forkert') : ''}`}
              data-saetning={i}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                vaelg();
              }}
            >
              <span className="saetning-tekst">
                <Tekst tekst={s} />
              </span>
              <button type="button" className="knap knap-lille vaelg-saetning" disabled={api.laast} onClick={vaelg}>
                {t('bevisjagt.vaelg')}
                <span className="sr-only"> {t('bevisjagt.vaelg.saetning', { nr: i + 1 })}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
