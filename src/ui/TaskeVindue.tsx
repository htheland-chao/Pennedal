import { useEffect, useState } from 'react';
import { t, type TekstId } from '../content';
import type { TingId } from '../engine/taske';
import { Modal } from './Modal';
import { TingIkon } from './PixelPortraet';
import { LaesOpKnap } from './Tekst';

export const tingNavn = (id: TingId) => t(`ting.${id}.navn` as TekstId);
export const tingTekst = (id: TingId) => t(`ting.${id}.tekst` as TekstId);

/** Listen over ting i tasken. Bruges både i tasken og på samlingssiden. */
export function TingListe({ ting }: { ting: TingId[] }) {
  if (ting.length === 0) return <p>{t('taske.tom')}</p>;
  return (
    <ul className="ting-liste">
      {ting.map((id) => (
        <li key={id} className="ting">
          <TingIkon ting={id} />
          <div>
            <p className="ting-navn">{tingNavn(id)}</p>
            <p className="ting-tekst">{tingTekst(id)}</p>
          </div>
          <LaesOpKnap tekst={`${tingNavn(id)}. ${tingTekst(id)}`} figur="fortaeller" />
        </li>
      ))}
    </ul>
  );
}

/** Tasken: alt, eleven har fundet og har med sig. Ting fra det escape room, man er i, står for sig. */
export function TaskeVindue({ ting, rumTing, onLuk }: { ting: TingId[]; rumTing: string[]; onLuk: () => void }) {
  return (
    <Modal titel={t('taske.titel')} onLuk={onLuk} klasse="taske-vindue">
      <h2>{t('taske.titel')}</h2>
      <p className="lille-tekst">{t('taske.intro')}</p>
      <TingListe ting={ting} />
      {rumTing.length > 0 && (
        <>
          <h3>{t('taske.rum')}</h3>
          <ul>
            {rumTing.map((navn) => (
              <li key={navn}>{navn}</li>
            ))}
          </ul>
        </>
      )}
      <div className="knaprad">
        <button type="button" className="knap knap-primaer" onClick={onLuk} autoFocus>
          {t('taske.luk')}
        </button>
      </div>
    </Modal>
  );
}

/** En lille besked, når der kommer en ny ting i tasken. Forsvinder af sig selv. */
export function NyTingBesked({ ting, onFaerdig }: { ting: TingId | null; onFaerdig: () => void }) {
  const [vis, setVis] = useState<TingId | null>(null);
  useEffect(() => {
    if (!ting) return;
    setVis(ting);
    const h = setTimeout(() => {
      setVis(null);
      onFaerdig();
    }, 6000);
    return () => clearTimeout(h);
  }, [ting, onFaerdig]);
  return (
    <div className="ny-ting" aria-live="polite">
      {vis && (
        <p>
          <TingIkon ting={vis} /> {t('taske.ny', { navn: tingNavn(vis) })}
        </p>
      )}
    </div>
  );
}
