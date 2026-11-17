import { findOrdkort, t } from '../content';
import { Modal } from './Modal';
import { LaesOpKnap } from './Tekst';

export function OrdkortVindue({ id, onLuk }: { id: string; onLuk: () => void }) {
  const kort = findOrdkort(id);
  if (!kort) return null;
  return (
    <Modal titel={`${t('ordkort.titel')}: ${kort.ord}`} onLuk={onLuk} klasse="ordkort">
      <p className="ordkort-billede" aria-hidden="true">
        {kort.billede}
      </p>
      <h2>{kort.ord}</h2>
      <LaesOpKnap tekst={kort.ord} etiket={t('ordkort.hoer')} figur="ord" />
      <p>{kort.forklaring}</p>
      <p>
        <strong>{t('ordkort.eksempel')}:</strong> {kort.eksempel}
      </p>
      <p className="lille-tekst">{t('ordkort.billede')}</p>
      <div className="knaprad">
        <button type="button" className="knap" onClick={onLuk} autoFocus>
          {t('ordkort.luk')}
        </button>
      </div>
    </Modal>
  );
}
