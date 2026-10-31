import { useState } from 'react';
import { t, type RumFund, type RumTrin } from '../content';
import { Modal } from './Modal';
import { beskedDele } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

/** Normaliserer et svar: store og små bogstaver, mellemrum og bindestreger tæller ikke. */
export const renSvar = (s: string) => s.toLocaleLowerCase('da-DK').replace(/[\s-]/g, '');

/** Det, man finder, når man undersøger noget i et escape room: en tekst og måske en seddel at læse. */
export function FundVindue({ titel, fund, onLuk }: { titel: string; fund: RumFund; onLuk: () => void }) {
  return (
    <Modal titel={titel} onLuk={onLuk} klasse="rum-vindue">
      <h2>{titel}</h2>
      <p className="fortaeller">{fund.tekst}</p>
      {fund.laesning && (
        <div className="seddel">
          {fund.laesning.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}
      <LaesOpKnap
        auto
        dele={[{ tekst: fund.tekst, figur: 'fortaeller' }, ...(fund.laesning ?? []).map((l) => ({ tekst: l, figur: 'fortaeller' as const }))]}
      />
      <div className="knaprad">
        <button type="button" className="knap knap-primaer" onClick={onLuk} autoFocus>
          {t('rum.luk')}
        </button>
      </div>
    </Modal>
  );
}

/** En tekst, når låsen ikke kan åbnes endnu (der mangler noget i tasken). */
export function ManglerVindue({ titel, tekst, onLuk }: { titel: string; tekst: string; onLuk: () => void }) {
  return (
    <Modal titel={titel} onLuk={onLuk} klasse="rum-vindue">
      <h2>{titel}</h2>
      <p className="fortaeller">{tekst}</p>
      <LaesOpKnap auto tekst={tekst} figur="fortaeller" />
      <div className="knaprad">
        <button type="button" className="knap knap-primaer" onClick={onLuk} autoFocus>
          {t('rum.luk')}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Kodelåsen: en gåde, der løses ved at læse noget i rummet. Forkert kode giver reglen og et eksempel.
 * Der er ingen tidsgrænse og intet antal forsøg.
 */
export function KodeVindue({
  titel,
  laas,
  onSvar,
  onAaben,
  onLuk,
}: {
  titel: string;
  laas: RumTrin['laas'];
  onSvar: (rigtigt: boolean, forsoeg: number) => void;
  onAaben: () => void;
  onLuk: () => void;
}) {
  const [kode, setKode] = useState('');
  const [forsoeg, setForsoeg] = useState(1);
  const [status, setStatus] = useState<'svar' | 'fejl' | 'aaben'>('svar');
  const [nr, setNr] = useState(0);

  function tjek() {
    const ok = laas.svar.some((s) => renSvar(s) === renSvar(kode));
    onSvar(ok, forsoeg);
    setNr((n) => n + 1);
    if (ok) setStatus('aaben');
    else {
      setStatus('fejl');
      setForsoeg(forsoeg + 1);
    }
  }

  return (
    <Modal titel={titel} onLuk={onLuk} klasse="rum-vindue">
      <h2>{titel}</h2>
      {status !== 'aaben' ? (
        <>
          <p className="fortaeller">{laas.gaade}</p>
          <LaesOpKnap auto tekst={laas.gaade} figur="fortaeller" />
          <form
            className="kodelaas"
            onSubmit={(e) => {
              e.preventDefault();
              if (kode.trim()) tjek();
            }}
          >
            <label>
              {t('rum.kode')}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                autoFocus
                className="kode-felt"
              />
            </label>
            <button type="submit" className="knap knap-primaer">
              {t('rum.proev')}
            </button>
          </form>
          {status === 'fejl' && (
            <div className="besked besked-fejl" aria-live="polite">
              <p>{t('rum.forkert')}</p>
              <div className="regel">
                <p>
                  <strong>{t('feedback.regel')}:</strong> {laas.regel}
                </p>
                <p>
                  <strong>{t('feedback.eksempel')}:</strong> {laas.eksempel}
                </p>
              </div>
              <LaesOpKnap key={nr} auto dele={beskedDele(t('rum.forkert'), { regel: laas.regel, eksempel: laas.eksempel }, null, false)} />
            </div>
          )}
          <div className="knaprad">
            <button type="button" className="knap" onClick={onLuk}>
              {t('rum.senere')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="fortaeller besked-god">{laas.aabnet}</p>
          <div className="regel">
            <p>
              <strong>{t('feedback.regel')}:</strong> {laas.regel}
            </p>
            <p>
              <strong>{t('feedback.eksempel')}:</strong> {laas.eksempel}
            </p>
          </div>
          <LaesOpKnap
            auto
            dele={[{ tekst: laas.aabnet, figur: 'fortaeller' }, ...beskedDele('', { regel: laas.regel, eksempel: laas.eksempel }, null, false).slice(1)]}
          />
          <div className="knaprad">
            <button type="button" className="knap knap-primaer" onClick={onAaben} autoFocus>
              {t('rum.videre')}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
