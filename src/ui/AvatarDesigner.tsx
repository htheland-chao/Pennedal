import { useState } from 'react';
import { avatarDele, navne, t, type TekstId } from '../content';
import { AVATAR_DELE, AVATAR_GRAENSER, type Avatar } from '../engine/gem';
import { avatarPixelUri } from './avatarPixelBillede';

type Props = {
  avatar: Avatar;
  navn: { adjektiv: number; dyr: number };
  laasteOp: string[];
  ny: boolean;
  onFaerdig: (avatar: Avatar, navn: { adjektiv: number; dyr: number }) => void;
  onAnnuller?: () => void;
};

function erLaast(del: keyof Avatar, i: number, laasteOp: string[]): boolean {
  const id = avatarDele[del]?.laast?.[String(i)];
  return !!id && !laasteOp.includes(id);
}

function valgNavn(del: keyof Avatar, i: number): string {
  const valg = avatarDele[del]?.valg;
  return valg ? valg[i] : t('avatar.nummer', { nr: i + 1, antal: AVATAR_GRAENSER[del] });
}

export function AvatarDesigner({ avatar: start, navn: startNavn, laasteOp, ny, onFaerdig, onAnnuller }: Props) {
  const [avatar, setAvatar] = useState<Avatar>(start);
  const [navn, setNavn] = useState(startNavn);

  function skift(del: keyof Avatar, retning: 1 | -1) {
    const n = AVATAR_GRAENSER[del];
    let i = avatar[del];
    for (let forsoeg = 0; forsoeg < n; forsoeg++) {
      i = (i + retning + n) % n;
      if (!erLaast(del, i, laasteOp)) break;
    }
    setAvatar({ ...avatar, [del]: i });
  }

  return (
    <main className="side avatar-side">
      <h1>{t('avatar.titel')}</h1>
      <div className="avatar-layout">
        <figure className="avatar-billede">
          <img className="avatar-pixel" src={avatarPixelUri(avatar) ?? ''} alt={t('avatar.billede')} width={176} height={208} />
          <figcaption className="avatar-navn">
            {navne.adjektiver[navn.adjektiv]} {navne.dyr[navn.dyr]}
          </figcaption>
        </figure>
        <div className="avatar-valg">
          <fieldset>
            <legend>{t('avatar.navn')}</legend>
            <p className="lille-tekst">{t('avatar.navn.forklaring')}</p>
            <label>
              {t('avatar.adjektiv')}
              <select value={navn.adjektiv} onChange={(e) => setNavn({ ...navn, adjektiv: Number(e.target.value) })}>
                {navne.adjektiver.map((a, i) => (
                  <option key={a} value={i}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('avatar.dyr')}
              <select value={navn.dyr} onChange={(e) => setNavn({ ...navn, dyr: Number(e.target.value) })}>
                {navne.dyr.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          {AVATAR_DELE.map((del) => {
            const etiket = t(`avatar.${del}` as TekstId);
            const laaste = Array.from({ length: AVATAR_GRAENSER[del] }, (_, i) => i).filter((i) =>
              erLaast(del, i, laasteOp),
            );
            return (
              <div className="avatar-raekke" key={del} role="group" aria-label={etiket}>
                <span className="avatar-etiket">{etiket}</span>
                <button type="button" className="knap knap-lille" onClick={() => skift(del, -1)}>
                  <span aria-hidden="true">◀ </span>
                  {t('avatar.forrige')}
                  <span className="sr-only"> {etiket}</span>
                </button>
                <span className="avatar-vaerdi" aria-live="polite">
                  {valgNavn(del, avatar[del])}
                </span>
                <button type="button" className="knap knap-lille" onClick={() => skift(del, 1)}>
                  {t('avatar.naeste')}
                  <span className="sr-only"> {etiket}</span>
                  <span aria-hidden="true"> ▶</span>
                </button>
                {laaste.map((i) => (
                  <span key={i} className="lille-tekst avatar-laast">
                    <span aria-hidden="true">🔒 </span>
                    {t('avatar.laast', { valg: valgNavn(del, i) })}
                  </span>
                ))}
              </div>
            );
          })}
          <div className="knaprad">
            {onAnnuller && (
              <button type="button" className="knap" onClick={onAnnuller}>
                {t('avatar.annuller')}
              </button>
            )}
            <button type="button" className="knap knap-primaer" onClick={() => onFaerdig(avatar, navn)}>
              {ny ? t('avatar.faerdig') : t('avatar.gem')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
