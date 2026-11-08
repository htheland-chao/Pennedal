import { useEffect, useState } from 'react';
import { useApp } from './Kontekst';
import { daempMusik } from './musik/afspiller';
import { t, type DialogValg, type Replik, type TekstId, type ValgMulighed } from '../content';
import { Modal } from './Modal';
import { PixelPortraet } from './PixelPortraet';
import { LaesOpKnap, Tekst } from './Tekst';


/** Pause efter en replik, før den næste starter, så eleven kan nå at se teksten. */
const PAUSE_MS = 1200;
/** Markerer, at dialogen skal lukke, når pausen efter den sidste replik er gået. */
const SLUT = -1;

type DialogProps = {
  replikker: Replik[];
  onFaerdig: () => void;
  /** Hvem der taler lige nu, så kameraet kan zoome ind på dem. Kaldes med null, når dialogen lukker. */
  onTaler?: (taler: Replik['taler'] | null) => void;
  /** Et valg efter den sidste replik. Den valgte muligheds replikker kommer bagefter. */
  valg?: DialogValg;
  onValg?: (m: ValgMulighed) => void;
};

export function DialogBoks({ replikker: grund, onFaerdig, onTaler, valg, onValg }: DialogProps) {
  const [nr, setNr] = useState(0);
  const [valgt, setValgt] = useState<ValgMulighed | null>(null);
  const replikker = valgt ? [...grund, ...valgt.replikker] : grund;
  const r = replikker[nr];
  const navn = t(`taler.${r.taler}` as TekstId);
  const sidste = nr === replikker.length - 1;
  /** Eleven skal vælge, før dialogen kan gå videre. */
  const skalVaelge = !!valg && !valgt && sidste;
  const { indstillinger } = useApp();
  const [naeste, setNaeste] = useState<number | null>(null);

  useEffect(() => {
    onTaler?.(r.taler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.taler, nr]);
  useEffect(() => () => onTaler?.(null), [onTaler]);

  // Musikken skrues ned, så længe dialogen er åben.
  useEffect(() => {
    daempMusik('dialog', true);
    return () => daempMusik('dialog', false);
  }, []);

  // Når en replik er læst helt op, venter dialogen lidt og går så selv videre til den næste.
  // Efter den sidste replik lukker dialogen selv (Henrik, 8. november 2026). Uden oplæsning ved spillet ikke,
  // hvornår eleven har læst færdig, så der lukker eleven selv med knappen (ingen tid på læsning, krav 5).
  useEffect(() => {
    if (naeste === null) return;
    const ur = window.setTimeout(() => (naeste === SLUT ? onFaerdig() : setNr(naeste)), naeste === SLUT ? PAUSE_MS * 2 : PAUSE_MS);
    return () => window.clearTimeout(ur);
    // onFaerdig skifter ikke undervejs i en dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naeste]);
  const vedFaerdig = indstillinger.autoVidere && !skalVaelge ? () => setNaeste(sidste ? SLUT : nr + 1) : undefined;
  return (
    <Modal titel={navn} klasse={`dialogboks taler-${r.taler}`}>
      <div className="dialog-indhold">
        <div className="portraet" aria-hidden="true">
          <PixelPortraet figur={r.taler} />
        </div>
        <div className="dialog-tekst">
          <p className="taler-navn">
            {navn}
            <LaesOpKnap tekst={r.tekst} figur={r.taler} auto key={nr} vedFaerdig={vedFaerdig} ikon />
          </p>
          <p className={r.taler === 'fortaeller' ? 'fortaeller' : ''} aria-live="polite">
            <Tekst tekst={r.tekst} />
          </p>
        </div>
      </div>
      <div className="knaprad">
        {skalVaelge && valg ? (
          <fieldset className="dialog-valg">
            <legend>{valg.spoergsmaal}</legend>
            {valg.muligheder.map((m, i) => (
              <button
                key={m.tekst}
                type="button"
                className="knap knap-primaer"
                autoFocus={i === 0}
                onClick={() => {
                  setNaeste(null);
                  setValgt(m);
                  onValg?.(m);
                  setNr(nr + 1);
                }}
              >
                {m.tekst}
              </button>
            ))}
          </fieldset>
        ) : (
        <button
          type="button"
          className="knap knap-primaer"
          autoFocus
          key={`v${nr}`}
          onClick={() => {
            setNaeste(null);
            if (sidste) onFaerdig();
            else setNr(nr + 1);
          }}
        >
          {t('dialog.videre')}
        </button>
        )}
      </div>
    </Modal>
  );
}
