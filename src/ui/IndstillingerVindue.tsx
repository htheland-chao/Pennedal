import { useEffect, useState } from 'react';
import { t } from '../content';
import type { Indstillinger } from '../engine/gem';
import { Modal } from './Modal';
import { danskeStemmer, naarStemmerErKlar } from './tale';

type Props = { indstillinger: Indstillinger; onSkift: (i: Indstillinger) => void; onLuk: () => void };

export function IndstillingerVindue({ indstillinger: i, onSkift, onLuk }: Props) {
  const [stemmer, setStemmer] = useState<SpeechSynthesisVoice[]>(() => danskeStemmer());
  useEffect(() => naarStemmerErKlar(() => setStemmer(danskeStemmer())), []);
  return (
    <Modal titel={t('indst.titel')} onLuk={onLuk}>
      <h2>{t('indst.titel')}</h2>
      <div className="indstillinger">
        <label className="afkryds">
          <input
            type="checkbox"
            checked={i.oplaesning}
            disabled={stemmer.length === 0}
            onChange={(e) => onSkift({ ...i, oplaesning: e.target.checked })}
          />
          {t('indst.oplaesning')}
        </label>
        {stemmer.length === 0 ? (
          <p className="lille-tekst">{t('indst.stemme.ingen')}</p>
        ) : (
          <label>
            {t('indst.stemme')}
            <select value={i.stemme ?? ''} onChange={(e) => onSkift({ ...i, stemme: e.target.value || null })}>
              {stemmer.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <fieldset>
          <legend>{t('indst.skrift')}</legend>
          {(['standard', 'ordblind', 'system'] as const).map((s) => (
            <label key={s} className={`afkryds skrift-proeve skrift-${s}`}>
              <input type="radio" name="skrift" checked={i.skrift === s} onChange={() => onSkift({ ...i, skrift: s })} />
              {t(`indst.skrift.${s}`)}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t('indst.stoerrelse')}</legend>
          {([1, 2, 3] as const).map((s) => (
            <label key={s} className="afkryds">
              <input
                type="radio"
                name="stoerrelse"
                checked={i.stoerrelse === s}
                onChange={() => onSkift({ ...i, stoerrelse: s })}
              />
              {t(`indst.stoerrelse.${s}`)}
            </label>
          ))}
        </fieldset>
        <label className="afkryds">
          <input
            type="checkbox"
            checked={i.mindreUhygge}
            onChange={(e) => onSkift({ ...i, mindreUhygge: e.target.checked })}
          />
          {t('indst.uhygge')}
        </label>
        <p className="lille-tekst">{t('indst.uhygge.forklaring')}</p>
        <p className="lille-tekst">{t('indst.lyd')}</p>
      </div>
      <div className="knaprad">
        <button type="button" className="knap knap-primaer" onClick={onLuk} autoFocus>
          {t('indst.luk')}
        </button>
      </div>
    </Modal>
  );
}
