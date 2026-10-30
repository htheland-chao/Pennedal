import { findOrdkort, t, type TekstId } from '../content';
import { FYRTAARN_MAKS } from '../config';
import type { GemtSpil } from '../engine/gem';
import { useApp } from './Kontekst';

type Props = { spil: GemtSpil; kapitelSlut: boolean; onTilbage: () => void; onSpilIgen: () => void };

export function Samling({ spil, kapitelSlut, onTilbage, onSpilIgen }: Props) {
  const { visOrdkort } = useApp();
  const lys = Math.min(spil.faerdigeHistorier, FYRTAARN_MAKS);
  const styrke = lys / FYRTAARN_MAKS;
  return (
    <main className="side">
      <h1>{kapitelSlut ? t('samling.fyrtaarn') : t('samling.titel')}</h1>
      {kapitelSlut && <p className="stor-ros">{t('samling.kapitel.slut')}</p>}
      <div className="samling-layout">
        <figure className="fyrtaarn">
          <svg viewBox="0 0 160 240" width="160" height="240" aria-hidden="true">
            <circle cx="80" cy="46" r={30 + 40 * styrke} fill="#ffd76a" opacity={0.15 + 0.6 * styrke} />
            <rect x="62" y="34" width="36" height="26" rx="4" fill="#ffe9a8" stroke="#2b2433" strokeWidth="2" />
            <path d="M56 34 L80 14 L104 34 Z" fill="#b0413e" stroke="#2b2433" strokeWidth="2" />
            <path d="M60 60 L50 220 L110 220 L100 60 Z" fill="#f4f1ea" stroke="#2b2433" strokeWidth="2" />
            <path d="M57 105 L103 105 L106 140 L54 140 Z" fill="#b0413e" />
            <path d="M52 175 L108 175 L110 205 L50 205 Z" fill="#b0413e" />
          </svg>
          <figcaption>{t('samling.lys', { antal: lys, max: FYRTAARN_MAKS })}</figcaption>
        </figure>
        <div>
          <h2>{t('samling.ordkort')}</h2>
          {spil.samling.length === 0 ? (
            <p>{t('samling.ingen.ordkort')}</p>
          ) : (
            <ul className="ordkort-liste">
              {spil.samling.map((id) => {
                const k = findOrdkort(id);
                if (!k) return null;
                return (
                  <li key={id}>
                    <button type="button" className="knap ordkort-knap" onClick={() => visOrdkort(id)}>
                      <span aria-hidden="true">{k.billede} </span>
                      {k.ord}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <h2>{t('samling.ting')}</h2>
          {spil.laasteOp.length === 0 ? (
            <p>{t('samling.ingen.ting')}</p>
          ) : (
            <ul>
              {spil.laasteOp.map((id) => (
                <li key={id}>{t(`samling.ting.${id}` as TekstId)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="knaprad">
        {kapitelSlut && (
          <button type="button" className="knap" onClick={onSpilIgen}>
            {t('samling.spil.igen')}
          </button>
        )}
        <button type="button" className="knap knap-primaer" onClick={onTilbage} autoFocus>
          {t('samling.tilbage')}
        </button>
      </div>
    </main>
  );
}
