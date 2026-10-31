import { useMemo, useState, type ReactNode } from 'react';
import { t } from '../content';
import { bland } from '../engine/tilfaeldig';
import { REGEL_EFTER_FORSOEG, type Haendelse } from '../engine/tilpasning';
import { Modal } from './Modal';
import { LaesOpKnap, type Del } from './Tekst';

export type OpgaveApi = {
  /** Kaldes af mekanikken, når eleven har svaret. */
  tjek: (rigtigt: boolean, fejltekst?: string) => void;
  /** Sand, mens eleven ikke må svare (efter et rigtigt svar eller under regelvalg). */
  laast: boolean;
  loest: boolean;
  forsoeg: number;
};

type Props = {
  titel: string;
  antal: number;
  loeste: number;
  regel: string;
  eksempel: string;
  andreRegler: string[];
  onSvar: (rigtigt: boolean, forsoeg: number) => Haendelse;
  onLoest: () => void;
  onPause: () => void;
  children: (api: OpgaveApi) => ReactNode;
};

type Fase = 'svar' | 'regel' | 'rigtig';

const ROS = ['opgave.ros.1', 'opgave.ros.2', 'opgave.ros.3', 'opgave.ros.4'] as const;

/**
 * Det, Æseløre læser op efter et svar: beskeden, reglen og eksemplet og til sidst en besked om niveauet.
 * Teksterne skal stå præcis sådan i scripts/lydtekster.mjs, ellers findes der ikke et klip.
 */
export function beskedDele(
  tekst: string,
  regel: { regel: string; eksempel: string } | null,
  niveau: string | null,
  vaelgRegel: boolean,
): Del[] {
  const dele: Del[] = [{ tekst, figur: 'aeseloere' }];
  if (regel) {
    dele.push({ tekst: `${t('feedback.regel')}: ${regel.regel}`, figur: 'aeseloere' });
    dele.push({ tekst: `${t('feedback.eksempel')}: ${regel.eksempel}`, figur: 'aeseloere' });
  }
  if (niveau) dele.push({ tekst: niveau, figur: 'aeseloere' });
  if (vaelgRegel) dele.push({ tekst: t('opgave.vaelg.regel'), figur: 'aeseloere' });
  return dele;
}

export function OpgaveRamme(props: Props) {
  const { titel, antal, loeste, regel, eksempel, andreRegler, onSvar, onLoest, onPause, children } = props;
  const [forsoeg, setForsoeg] = useState(1);
  const [fejlSidenRegel, setFejlSidenRegel] = useState(0);
  const [fase, setFase] = useState<Fase>('svar');
  const [besked, setBesked] = useState<{ tekst: string; slags: 'god' | 'fejl' | 'info'; visRegel?: boolean } | null>(null);
  const [niveauBesked, setNiveauBesked] = useState<string | null>(null);
  /** Tæller op for hver ny besked, så den samme besked to gange i træk også bliver læst op igen. */
  const [beskedNr, setBeskedNr] = useState(0);
  const reglerAtVaelge = useMemo(
    () => bland([regel, ...andreRegler.filter((r) => r !== regel).slice(0, 2)], Math.random),
    [regel, andreRegler],
  );

  function tjek(rigtigt: boolean, fejltekst?: string) {
    if (fase !== 'svar') return;
    setBeskedNr((n) => n + 1);
    const haendelse = onSvar(rigtigt, forsoeg);
    setNiveauBesked(haendelse === 'op' ? t('opgave.niveau.op') : haendelse === 'ned' ? t('opgave.niveau.ned') : null);
    if (rigtigt) {
      const tekst =
        forsoeg === 1 && Math.random() < 0.3 ? t('opgave.ros.foersteforsoeg') : t(ROS[Math.floor(Math.random() * ROS.length)]);
      setBesked({ tekst, slags: 'god', visRegel: true });
      setFase('rigtig');
      return;
    }
    const fejl = fejlSidenRegel + 1;
    setForsoeg(forsoeg + 1);
    setFejlSidenRegel(fejl);
    setBesked({ tekst: fejltekst ?? t('opgave.proev.igen'), slags: 'fejl', visRegel: true });
    if (fejl >= REGEL_EFTER_FORSOEG) setFase('regel');
  }

  function vaelgRegel(r: string) {
    setBeskedNr((n) => n + 1);
    if (r === regel) {
      setFase('svar');
      setFejlSidenRegel(0);
      setBesked({ tekst: t('opgave.regel.rigtig'), slags: 'info' });
    } else {
      setBesked({ tekst: t('opgave.regel.forkert'), slags: 'fejl' });
    }
  }

  function videre() {
    setForsoeg(1);
    setFejlSidenRegel(0);
    setFase('svar');
    setBesked(null);
    setNiveauBesked(null);
    onLoest();
  }

  return (
    <Modal titel={titel} onLuk={onPause} bred klasse="opgave">
      <header className="opgave-hoved">
        <h2>{titel}</h2>
        <p className="opgave-fremskridt">
          {t('opgave.fremskridt', { nr: Math.min(loeste + 1, antal), antal })}
        </p>
        <div className="runer" aria-hidden="true">
          {Array.from({ length: antal }, (_, i) => (
            <span key={i} className={`rune ${i < loeste || (i === loeste && fase === 'rigtig') ? 'rune-lys' : ''}`} />
          ))}
        </div>
        <button type="button" className="knap knap-lille pause" onClick={onPause}>
          {t('opgave.pause')}
        </button>
      </header>

      <div className="opgave-krop">{children({ tjek, laast: fase !== 'svar', loest: fase === 'rigtig', forsoeg })}</div>

      <div className="opgave-feedback" aria-live="polite">
        {besked && (
          <div className={`besked besked-${besked.slags}`}>
            <p>{besked.tekst}</p>
            {besked.visRegel && (
              <div className="regel">
                <p>
                  <strong>{t('feedback.regel')}:</strong> {regel}
                </p>
                <p>
                  <strong>{t('feedback.eksempel')}:</strong> {eksempel}
                </p>
              </div>
            )}
          </div>
        )}
        {niveauBesked && <p className="niveau-besked">{niveauBesked}</p>}
        {besked && (
          <LaesOpKnap
            key={beskedNr}
            auto
            dele={beskedDele(besked.tekst, besked.visRegel ? { regel, eksempel } : null, niveauBesked, fase === 'regel')}
          />
        )}
      </div>

      {fase === 'regel' && (
        <fieldset className="regelvalg">
          <legend>{t('opgave.vaelg.regel')}</legend>
          {reglerAtVaelge.map((r) => (
            <button key={r} type="button" className="knap regel-knap" onClick={() => vaelgRegel(r)}>
              {r}
            </button>
          ))}
        </fieldset>
      )}

      {fase === 'rigtig' && (
        <div className="knaprad">
          <button type="button" className="knap knap-primaer" onClick={videre} autoFocus>
            {t('opgave.videre')}
          </button>
        </div>
      )}
    </Modal>
  );
}
