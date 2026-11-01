import { useMemo, useRef, useState } from 'react';
import { stumme, synonymer, t, type KampTrin, type TekstId } from '../content';
import type { Haendelse, Niveau } from '../engine/tilpasning';
import { lavStummingOpgave, lavTomordOpgave, tjekKamp, viskUd, type KampOpgave } from '../mechanics/kamp';
import { Modal } from './Modal';
import { beskedDele } from './OpgaveRamme';
import { PixelPortraet } from './PixelPortraet';
import type { Figur } from './lyd';
import { LaesOpKnap } from './Tekst';

/**
 * En rolig kamp (docs/historie.md, "Kampe: rolige valg"). Hver tur vælger eleven Lyt, Læs, Skriv færdig eller Gå væk.
 * Skriv færdig er den danskfaglige opgave. Rigtige svar gør væsnet roligere. Der er ingen tid og intet liv,
 * og et forkert svar forklares altid med en regel og et eksempel (krav 5 og 6).
 */
type Props = {
  trin: KampTrin;
  niveau: Niveau;
  /** Ture, eleven allerede har klaret (bliver husket, hvis eleven går væk). */
  loeste: number;
  /** Antal ture i alt, fastlagt da kampen startede. */
  antal: number;
  onSvar: (rigtigt: boolean, forsoeg: number) => Haendelse;
  /** Kaldes efter hver klaret tur. Efter den sidste tur er trinnet færdigt. */
  onLoest: () => void;
  onPause: () => void;
};

type Fase = 'tur' | 'svar' | 'rigtig' | 'rolig';
type Besked = { tekst: string; slags: 'god' | 'fejl' | 'info'; visRegel?: boolean; figur?: Figur };

/** Ord, der er brugt i denne session, så de ikke kommer igen med det samme. */
const brugt: Record<KampTrin['vaesen'], string[]> = { tomordet: [], stumming: [] };

function nyOpgave(vaesen: KampTrin['vaesen'], niveau: number): KampOpgave {
  const o =
    vaesen === 'tomordet'
      ? lavTomordOpgave(synonymer.ord, niveau, Math.random, brugt.tomordet)
      : lavStummingOpgave(stumme.ord, niveau, Math.random, brugt.stumming);
  brugt[vaesen].push(o.id);
  if (brugt[vaesen].length > 8) brugt[vaesen].shift();
  return o;
}

function regelFor(o: KampOpgave): { regel: string; eksempel: string } {
  if (o.vaesen === 'tomordet') return { regel: t('kamp.tomordet.regel'), eksempel: t('kamp.tomordet.eksempel') };
  const andre = stumme.ord
    .filter((x) => x.type === o.type && x.ord !== o.ord && x.svaerhed === 1)
    .slice(0, 3)
    .map((x) => x.ord)
    .join(', ');
  return { regel: stumme.regler[o.type ?? 'd'], eksempel: t('kamp.stumming.eksempel', { ord: andre }) };
}

const k = (o: KampOpgave, del: string) => `kamp.${o.vaesen}.${del}` as TekstId;

export function KampVindue({ trin, niveau, loeste, antal, onSvar, onLoest, onPause }: Props) {
  const [opgave, setOpgave] = useState(() => nyOpgave(trin.vaesen, niveau));
  const [fase, setFase] = useState<Fase>(loeste >= antal ? 'rolig' : 'tur');
  const [besked, setBesked] = useState<Besked | null>(null);
  const [beskedNr, setBeskedNr] = useState(0);
  const [forsoeg, setForsoeg] = useState(1);
  /** Muligheder, der er visket ud eller allerede prøvet. */
  const [vaek, setVaek] = useState<string[]>([]);
  const [visket, setVisket] = useState(false);
  const [uro, setUro] = useState(0);
  const niveauRef = useRef(niveau);
  niveauRef.current = niveau;
  const regel = useMemo(() => regelFor(opgave), [opgave]);
  const navn = t(`kamp.${trin.vaesen}.navn` as TekstId);
  const ro = Math.min(antal, loeste + (fase === 'rigtig' ? 1 : 0));

  function vis(b: Besked) {
    setBesked(b);
    setBeskedNr((n) => n + 1);
  }

  function svar(valg: string) {
    if (fase !== 'svar' || vaek.includes(valg)) return;
    const rigtigt = tjekKamp(opgave, valg);
    onSvar(rigtigt, forsoeg);
    if (rigtigt) {
      vis({ tekst: t(k(opgave, 'rigtig'), { svar: opgave.svar, ord: opgave.ord }), slags: 'god', visRegel: true });
      setFase('rigtig');
      return;
    }
    setForsoeg((f) => f + 1);
    setVaek((v) => [...v, valg]);
    setUro((u) => u + 1);
    vis({ tekst: t(k(opgave, 'fejl'), { valgt: valg, ord: opgave.ord }), slags: 'fejl', visRegel: true });
  }

  function naesteTur() {
    if (loeste + 1 >= antal) {
      setFase('rolig');
      setBesked(null);
      return;
    }
    onLoest();
    setOpgave(nyOpgave(trin.vaesen, niveauRef.current));
    setForsoeg(1);
    setVaek([]);
    setVisket(false);
    setBesked(null);
    setFase('tur');
  }

  function spoergVims() {
    const m = viskUd(opgave, vaek, Math.random);
    setVisket(true);
    if (m) {
      setVaek((v) => [...v, m]);
      vis({ tekst: t('kamp.vims.visk'), slags: 'info', figur: 'vims' });
    } else {
      vis({ tekst: t('kamp.vims.ingen'), slags: 'info', figur: 'vims' });
    }
  }

  const portraet = trin.vaesen === 'tomordet' ? 'tomordet' : 'stumming';
  return (
    <Modal titel={navn} onLuk={onPause} bred klasse={`opgave kamp kamp-${trin.vaesen}`}>
      {/* Til gennemspilningen: hvilken opgave, der vises (ikke svaret). */}
      <span hidden data-opgave-id={opgave.id} />
      <header className="opgave-hoved">
        <h2>{navn}</h2>
        <p className="opgave-fremskridt">{t('kamp.ro', { ro, antal })}</p>
        <div className="kamp-ro" aria-hidden="true">
          {Array.from({ length: antal }, (_, i) => (
            <span key={i} className={`kamp-blaek${i < ro ? ' rolig' : ''}`} />
          ))}
        </div>
      </header>

      <div className="kamp-scene">
        <div
          className={`kamp-vaesen${fase === 'rolig' ? ' rolig' : ''}`}
          key={`uro-${uro}`}
          data-uro={uro > 0 ? 'ja' : undefined}
          style={{ opacity: 1 - (ro / antal) * 0.35 }}
          aria-hidden="true"
        >
          <PixelPortraet figur={portraet} />
        </div>
        {fase === 'rolig' ? (
          <p className="kamp-angreb">{t(k(opgave, 'rolig'))}</p>
        ) : (
          <div className="kamp-angreb">
            <p>{t(k(opgave, 'angreb'))}</p>
            <p className="kamp-saetning">
              {opgave.foer}
              <mark>{opgave.vist}</mark>
              {opgave.efter}
            </p>
          </div>
        )}
      </div>

      {fase === 'tur' && (
        <>
          <p className="lille-tekst">{t('kamp.forklaring')}</p>
          <fieldset className="kamp-valg">
            <legend>{t('kamp.hvad')}</legend>
            <button type="button" className="knap" onClick={() => vis({ tekst: t(k(opgave, 'lyt')), slags: 'info', figur: trin.vaesen })}>
              {t('kamp.lyt')}
            </button>
            <LaesOpKnap tekst={opgave.saetning} figur="fortaeller" etiket={t('kamp.laes')} />
            <button type="button" className="knap knap-primaer" onClick={() => setFase('svar')} autoFocus>
              {t('kamp.skriv')}
            </button>
            <button type="button" className="knap knap-diskret" onClick={onPause}>
              {t('kamp.gaa')}
            </button>
          </fieldset>
        </>
      )}

      {(fase === 'svar' || fase === 'rigtig') && (
        <div className="opgave-krop">
          <p className="kamp-spoergsmaal">{t(k(opgave, 'spoergsmaal'), { ord: opgave.ord, vist: opgave.vist })}</p>
          <div className="kamp-muligheder">
            {opgave.muligheder.map((m) => (
              <button
                key={m}
                type="button"
                className={`knap kamp-mulighed${m === opgave.svar && fase === 'rigtig' ? ' rigtig' : ''}`}
                disabled={vaek.includes(m) || fase === 'rigtig'}
                onClick={() => svar(m)}
              >
                {m}
              </button>
            ))}
          </div>
          {fase === 'svar' && (
            <div className="knaprad">
              {trin.hjaelper === 'vims' && !visket && (
                <button type="button" className="knap" onClick={spoergVims}>
                  {t('kamp.vims')}
                </button>
              )}
              <LaesOpKnap tekst={opgave.saetning} figur="fortaeller" etiket={t('kamp.laes')} />
              <button type="button" className="knap knap-diskret" onClick={onPause}>
                {t('kamp.gaa')}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="opgave-feedback" aria-live="polite">
        {besked && (
          <div className={`besked besked-${besked.slags}`}>
            <p>{besked.tekst}</p>
            {besked.visRegel && (
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
        )}
        {besked && (
          <LaesOpKnap
            key={beskedNr}
            auto
            dele={besked.figur ? [{ tekst: besked.tekst, figur: besked.figur }] : beskedDele(besked.tekst, besked.visRegel ? regel : null, null, false)}
          />
        )}
      </div>

      {fase === 'rigtig' && (
        <div className="knaprad">
          <button type="button" className="knap knap-primaer" onClick={naesteTur} autoFocus>
            {t('kamp.naeste')}
          </button>
        </div>
      )}
      {fase === 'rolig' && (
        <div className="knaprad">
          <LaesOpKnap tekst={t(k(opgave, 'rolig'))} figur="fortaeller" auto />
          <button type="button" className="knap knap-primaer" onClick={onLoest} autoFocus>
            {t('kamp.videre')}
          </button>
        </div>
      )}
    </Modal>
  );
}
