import { useEffect, useState, type CSSProperties } from 'react';
import { t, type TekstId } from '../content';
import type { TingId } from '../engine/taske';
import { Modal } from './Modal';
import { TingIkon } from './PixelPortraet';
import { LaesOpKnap } from './Tekst';
import { erMinde, mindeTitel, type MindeId } from '../content/minder';
import { Tilbageblik } from './Tilbageblik';
import { ALLE_SKAAR } from '../engine/betingelse';

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

/** Minderne (tilbageblik), eleven har mødt. Hvert kan ses igen. */
export function MinderListe({ minder, skaar }: { minder: string[]; skaar?: number }) {
  const [vis, setVis] = useState<MindeId | null>(null);
  const liste = minder.filter(erMinde);
  return (
    <>
      <h3>{t('minder.titel')}</h3>
      <p className="lille-tekst">{t('minder.intro')}</p>
      {/* Tæller for hukommelsesskår (Henrik, 10. november 2026), så eleven ved, hvad skårene er til. */}
      {skaar !== undefined && <p className="skaar-taeller">{t('minder.skaar', { antal: skaar, ialt: ALLE_SKAAR.length })}</p>}
      {liste.length === 0 ? (
        <p>{t('minder.tom')}</p>
      ) : (
        <ul className="minder-liste">
          {liste.map((id) => (
            <li key={id}>
              <span>{mindeTitel(id)}</span>
              <button type="button" className="knap" onClick={() => setVis(id)}>
                {t('minder.se')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {vis && <Tilbageblik id={vis} onFaerdig={() => setVis(null)} />}
    </>
  );
}

/** Tasken: alt, eleven har fundet og har med sig. Ting fra det escape room, man er i, står for sig. */
export function TaskeVindue({
  ting,
  minder = [],
  skaar,
  rumTing,
  onLuk,
}: {
  ting: TingId[];
  minder?: string[];
  skaar?: number;
  rumTing: string[];
  onLuk: () => void;
}) {
  return (
    <Modal titel={t('taske.titel')} onLuk={onLuk} klasse="taske-vindue">
      <h2>{t('taske.titel')}</h2>
      <p className="lille-tekst">{t('taske.intro')}</p>
      <TingListe ting={ting} />
      <MinderListe minder={minder} skaar={skaar} />
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
  /** Hvor tasken står på skærmen, så tingen kan flyve derhen (Henrik, 9. november 2026). */
  const [maal, setMaal] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!ting) return;
    setVis(ting);
    const knap = document.querySelector('.hud-knapper .knap');
    const r = knap?.getBoundingClientRect();
    setMaal(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);
    // Tasken hopper, når tingen lander.
    const hop = setTimeout(() => {
      knap?.classList.add('taske-hop');
      setTimeout(() => knap?.classList.remove('taske-hop'), 600);
    }, 1300);
    const h = setTimeout(() => {
      setVis(null);
      onFaerdig();
    }, 6000);
    return () => {
      clearTimeout(h);
      clearTimeout(hop);
    };
  }, [ting, onFaerdig]);
  return (
    <div className="ny-ting" aria-live="polite">
      {vis && maal && (
        <span
          key={vis}
          className="ny-ting-flyv"
          aria-hidden="true"
          style={{ '--tx': `${maal.x - window.innerWidth / 2}px`, '--ty': `${maal.y - window.innerHeight / 2}px` } as CSSProperties}
        >
          <TingIkon ting={vis} />
        </span>
      )}
      {vis && (
        <p>
          <TingIkon ting={vis} /> {t('taske.ny', { navn: tingNavn(vis) })}
        </p>
      )}
    </div>
  );
}
