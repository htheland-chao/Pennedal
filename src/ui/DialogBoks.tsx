import { useEffect, useState } from 'react';
import { useApp } from './Kontekst';
import { daempMusik } from './musik/afspiller';
import { t, type Replik, type TekstId } from '../content';
import { Modal } from './Modal';
import { PixelPortraet } from './PixelPortraet';
import { LaesOpKnap, Tekst } from './Tekst';


/** Pause efter en replik, før den næste starter, så eleven kan nå at se teksten. */
const PAUSE_MS = 1200;

type DialogProps = {
  replikker: Replik[];
  onFaerdig: () => void;
  /** Hvem der taler lige nu, så kameraet kan zoome ind på dem. Kaldes med null, når dialogen lukker. */
  onTaler?: (taler: Replik['taler'] | null) => void;
};

export function DialogBoks({ replikker, onFaerdig, onTaler }: DialogProps) {
  const [nr, setNr] = useState(0);
  const r = replikker[nr];
  const navn = t(`taler.${r.taler}` as TekstId);
  const sidste = nr === replikker.length - 1;
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
  // Den sidste replik lukker ikke selv, så eleven altid selv afslutter samtalen.
  useEffect(() => {
    if (naeste === null) return;
    const ur = window.setTimeout(() => setNr(naeste), PAUSE_MS);
    return () => window.clearTimeout(ur);
  }, [naeste]);
  const vedFaerdig = indstillinger.autoVidere && !sidste ? () => setNaeste(nr + 1) : undefined;
  return (
    <Modal titel={navn} klasse={`dialogboks taler-${r.taler}`}>
      <div className="dialog-indhold">
        <div className="portraet" aria-hidden="true">
          <PixelPortraet figur={r.taler} />
        </div>
        <div className="dialog-tekst">
          <p className="taler-navn">{navn}</p>
          <p className={r.taler === 'fortaeller' ? 'fortaeller' : ''} aria-live="polite">
            <Tekst tekst={r.tekst} />
          </p>
        </div>
      </div>
      <div className="knaprad">
        <LaesOpKnap tekst={r.tekst} figur={r.taler} auto key={nr} vedFaerdig={vedFaerdig} />
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
      </div>
    </Modal>
  );
}
