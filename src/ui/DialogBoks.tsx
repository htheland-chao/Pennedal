import { useState } from 'react';
import { t, type Replik, type TekstId } from '../content';
import { Modal } from './Modal';
import { LaesOpKnap, Tekst } from './Tekst';

const PORTRAET: Record<Replik['taler'], string> = {
  holm: '👓',
  aeseloere: '🕊️',
  klatten: '💧',
  lanterne: '🏮',
  fortaeller: '📖',
};

export function DialogBoks({ replikker, onFaerdig }: { replikker: Replik[]; onFaerdig: () => void }) {
  const [nr, setNr] = useState(0);
  const r = replikker[nr];
  const navn = t(`taler.${r.taler}` as TekstId);
  const sidste = nr === replikker.length - 1;
  return (
    <Modal titel={navn} klasse={`dialogboks taler-${r.taler}`}>
      <div className="dialog-indhold">
        <div className="portraet" aria-hidden="true">
          {PORTRAET[r.taler]}
        </div>
        <div className="dialog-tekst">
          <p className="taler-navn">{navn}</p>
          <p className={r.taler === 'fortaeller' ? 'fortaeller' : ''} aria-live="polite">
            <Tekst tekst={r.tekst} />
          </p>
        </div>
      </div>
      <div className="knaprad">
        <LaesOpKnap tekst={r.tekst} figur={r.taler} auto key={nr} />
        <button
          type="button"
          className="knap knap-primaer"
          autoFocus
          key={`v${nr}`}
          onClick={() => (sidste ? onFaerdig() : setNr(nr + 1))}
        >
          {t('dialog.videre')}
        </button>
      </div>
    </Modal>
  );
}
