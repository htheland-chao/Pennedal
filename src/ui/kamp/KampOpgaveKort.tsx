import { useMemo } from 'react';
import { t, type TekstId } from '../../content';
import { tjekKamp } from '../../mechanics/kamp';
import { kanBrugeEvne, type HjaelperId, type Kamp } from '../../mechanics/kampmotor';
import { beskedDele } from '../OpgaveRamme';
import { LaesOpKnap } from '../Tekst';
import { k, regelFor } from './opgaver';
import type { Visning } from './visning';

type Props = {
  o: Extract<Visning, { type: 'opgave' }>;
  kamp: Kamp;
  hjaelpere: HjaelperId[];
  navne: string[];
  svar: (valg: string) => void;
  /** Lyt: væsnets hint som en kort linje. */
  setNotat: (tekst: string) => void;
  evneIOpgave: (evne: 'forklar' | 'visk' | 'fejl') => void;
  efterSvar: () => void;
};

/**
 * Opgaven i et slag: sætningen, svarmulighederne, hjælpernes evner og feedback med regel og eksempel (krav 6).
 * Delt ud af KampVindue.tsx 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function KampOpgaveKort({ o, kamp, hjaelpere, navne, svar, setNotat, evneIOpgave, efterSvar }: Props) {
  const regel = useMemo(() => regelFor(o.opgave), [o.opgave]);
  const rigtigt = o.svaret ? tjekKamp(o.opgave, o.svaret) : null;
  const beskedTekst = o.svaret
    ? rigtigt
      ? t(k(o.opgave, 'rigtig'), { svar: o.opgave.svar, ord: o.opgave.ord })
      : t(k(o.opgave, 'fejl'), { valgt: o.svaret, ord: o.opgave.ord })
    : null;
  return (
    <div className="opgave-krop kamp-opgave">
      <p className="naeste-overskrift">
        {o.stort ? t('kamp.slag.stort', { slag: t(`kamp.slag.${o.slag}` as TekstId) }) : `${t(`kamp.slag.${o.slag}` as TekstId)} - ${navne[o.fjende]}`}
      </p>
      <p className="kamp-saetning">
        {o.opgave.foer}
        <mark>{o.opgave.vist}</mark>
        {o.opgave.efter}
      </p>
      <p className="kamp-spoergsmaal">{t(k(o.opgave, 'spoergsmaal'), { ord: o.opgave.ord, vist: o.opgave.vist })}</p>
      {o.forklaret && regel && (
        <div className="besked besked-info regel">
          <p>
            <strong>{t('feedback.regel')}:</strong> {regel.regel}
          </p>
          <p>
            <strong>{t('feedback.eksempel')}:</strong> {regel.eksempel}
          </p>
          {/* Æseløre siger selv reglen, når eleven beder ham forklare den (Henrik, 10. november 2026). */}
          <LaesOpKnap auto dele={beskedDele('', regel, null, false)} />
        </div>
      )}
      <div className="kamp-muligheder">
        {o.opgave.muligheder.map((m) => (
          <button
            key={m}
            type="button"
            className={`knap kamp-mulighed${o.svaret && m === o.opgave.svar ? ' rigtig' : ''}${o.svaret === m && m !== o.opgave.svar ? ' forkert' : ''}`}
            disabled={o.vaek.includes(m) || !!o.svaret}
            onClick={() => svar(m)}
          >
            {m}
          </button>
        ))}
      </div>
      {!o.svaret ? (
        <div className="knaprad kamp-hjaelperad">
          <LaesOpKnap tekst={o.opgave.saetning} figur="fortaeller" etiket={t('kamp.laes')} />
          <button type="button" className="knap knap-lille" onClick={() => setNotat(t(k(o.opgave, 'lyt')))}>
            {t('kamp.lyt')}
          </button>
          {hjaelpere.includes('aeseloere') && (
            <button type="button" className="knap knap-lille" disabled={!kanBrugeEvne(kamp, 'forklar') || o.forklaret} onClick={() => evneIOpgave('forklar')}>
              {t('kamp.evne.forklar', { antal: kamp.evner.forklar ?? 0 })}
            </button>
          )}
          {hjaelpere.includes('vims') && (
            <button type="button" className="knap knap-lille" disabled={!kanBrugeEvne(kamp, 'visk')} onClick={() => evneIOpgave('visk')}>
              {t('kamp.evne.visk', { antal: kamp.evner.visk ?? 0 })}
            </button>
          )}
          {hjaelpere.includes('klatten') && (
            <button type="button" className="knap knap-lille" disabled={!kanBrugeEvne(kamp, 'fejl')} onClick={() => evneIOpgave('fejl')}>
              {t('kamp.evne.fejl', { antal: kamp.evner.fejl ?? 0 })}
            </button>
          )}
        </div>
      ) : (
        <div className="opgave-feedback" aria-live="polite">
          <div className={`besked besked-${rigtigt ? 'god' : 'fejl'}`}>
            <p>{beskedTekst}</p>
            {regel && (
              <div className="regel">
                <p>
                  <strong>{t('feedback.regel')}:</strong> {regel.regel}
                </p>
                <p>
                  <strong>{t('feedback.eksempel')}:</strong> {regel.eksempel}
                </p>
              </div>
            )}
          </div>
          <div className="knaprad">
            <LaesOpKnap auto dele={beskedDele(beskedTekst ?? '', regel, null, false)} />
            <button type="button" className="knap knap-primaer" onClick={efterSvar} autoFocus>
              {rigtigt ? t('kamp.slaa.nu') : t('kamp.videre')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
