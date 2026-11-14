import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { avatarDele, navne, t, type TekstId } from '../content';
import { AVATAR_GRAENSER, type Avatar } from '../engine/gem';
import { finFigur } from '../game/pixel/fin';
import { figurRammer } from '../game/pixel/kampliv';
import { lerred, tegnkortTilLerred } from '../game/pixel/lerred';
import { avatarPixel, LANTERNE, type Retning } from '../game/pixel/sprites';

/**
 * Udseende-editoren (ny 14. november 2026): den fine figur med lys og skygge, som i spillet. Den trækker vejret
 * og kan drejes, så man kan se tasken og håret bagfra. Valgene står i fire grupper i to kolonner, så alt kan ses
 * på en Chromebook uden at rulle. Farvevalg viser farven ved siden af navnet. Al tekst er HTML.
 */
type Props = {
  avatar: Avatar;
  navn: { adjektiv: number; dyr: number };
  laasteOp: string[];
  ny: boolean;
  onFaerdig: (avatar: Avatar, navn: { adjektiv: number; dyr: number }) => void;
  onAnnuller?: () => void;
};

type Del = keyof Avatar;
const GRUPPER: { id: TekstId; dele: Del[] }[] = [
  { id: 'avatar.gruppe.krop', dele: ['hud', 'krop', 'oejne', 'oejenfarve', 'mund', 'ansigt'] },
  { id: 'avatar.gruppe.haar', dele: ['haar', 'haarfarve'] },
  { id: 'avatar.gruppe.toej', dele: ['toej', 'toejfarve', 'bukser', 'sko'] },
  { id: 'avatar.gruppe.ting', dele: ['hoved', 'hovedfarve', 'tilbehoer', 'taske'] },
];
/** Rækkefølgen, figuren drejer i. */
const RETNINGER: Retning[] = ['ned', 'venstre', 'op', 'hoejre'];

function erLaast(del: Del, i: number, laasteOp: string[]): boolean {
  const id = avatarDele[del]?.laast?.[String(i)];
  return !!id && !laasteOp.includes(id);
}

function valgNavn(del: Del, i: number): string {
  const valg = avatarDele[del]?.valg;
  return valg ? valg[i] : t('avatar.nummer', { nr: i + 1, antal: AVATAR_GRAENSER[del] });
}

/** "a, b og c" */
const oplist = (l: string[]) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} ${t('avatar.og')} ${l.at(-1)}`);

const spejl = <T,>(r: T[][]): T[][] => r.map((x) => [...x].reverse());

/** Figurens billeder (fin grafik), ét for hvert åndedrag. Uden canvas (enhedstests) bliver det tomt. */
function billeder(a: Avatar, retning: Retning): { uri: string[]; ms: number } {
  try {
    const kort = avatarPixel(a, retning, 0);
    const { rammer, ms } = figurRammer('avatar', kort, 1);
    const uri = rammer.map((r) => {
      const fin = finFigur(retning === 'venstre' ? { ...r, raekker: spejl(r.raekker.map((x) => [...x])).map((x) => x.join('')) } : r);
      const figur = tegnkortTilLerred(fin);
      const c = lerred(figur.width + 24, figur.height + 4);
      const g = c.getContext('2d')!;
      g.drawImage(figur, 4, 2);
      // Med lanternen holder figuren den i hånden (fin grafik har dobbelt så mange pixel).
      if (a.tilbehoer === 3 && retning !== 'op') g.drawImage(tegnkortTilLerred(finFigur(LANTERNE)), retning === 'venstre' ? 0 : 30, 30);
      return c.toDataURL('image/png');
    });
    return { uri, ms };
  } catch {
    return { uri: [], ms: 1000 };
  }
}

const roligt = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Figur({ avatar, retning }: { avatar: Avatar; retning: Retning }) {
  const { uri, ms } = useMemo(() => billeder(avatar, retning), [avatar, retning]);
  const [nr, setNr] = useState(0);
  useEffect(() => {
    if (uri.length < 2 || roligt()) return;
    const ur = window.setInterval(() => setNr((n) => (n + 1) % uri.length), ms);
    return () => window.clearInterval(ur);
  }, [uri, ms]);
  if (uri.length === 0) return null;
  return <img className="avatar-pixel" src={uri[nr % uri.length]} alt={t('avatar.billede')} />;
}

export function AvatarDesigner({ avatar: start, navn: startNavn, laasteOp, ny, onFaerdig, onAnnuller }: Props) {
  const [avatar, setAvatar] = useState<Avatar>(start);
  const [navn, setNavn] = useState(startNavn);
  const [retning, setRetning] = useState(0);

  function skift(del: Del, frem: 1 | -1) {
    const n = AVATAR_GRAENSER[del];
    let i = avatar[del];
    for (let forsoeg = 0; forsoeg < n; forsoeg++) {
      i = (i + frem + n) % n;
      if (!erLaast(del, i, laasteOp)) break;
    }
    setAvatar({ ...avatar, [del]: i });
  }

  const drej = (frem: 1 | -1) => setRetning((r) => (r + frem + RETNINGER.length) % RETNINGER.length);
  const laaste = GRUPPER.flatMap((g) => g.dele).flatMap((del) =>
    Array.from({ length: AVATAR_GRAENSER[del] }, (_, i) => i)
      .filter((i) => erLaast(del, i, laasteOp))
      .map((i) => valgNavn(del, i)),
  );

  return (
    <main className="side avatar-side">
      <h1>{t('avatar.titel')}</h1>
      <div className="avatar-layout">
        <figure className="avatar-billede">
          <div className="avatar-scene">
            <Figur avatar={avatar} retning={RETNINGER[retning]} />
          </div>
          <div className="avatar-drej">
            <button type="button" className="knap knap-lille" onClick={() => drej(-1)} aria-label={t('avatar.drej.venstre')}>
              <span aria-hidden="true">↺</span>
            </button>
            <span className="lille-tekst">{t('avatar.drej')}</span>
            <button type="button" className="knap knap-lille" onClick={() => drej(1)} aria-label={t('avatar.drej.hoejre')}>
              <span aria-hidden="true">↻</span>
            </button>
          </div>
          <figcaption className="avatar-navn">
            {navne.adjektiver[navn.adjektiv]} {navne.dyr[navn.dyr]}
          </figcaption>
        </figure>

        <div className="avatar-valg">
          <fieldset className="avatar-navnevalg">
            <legend>{t('avatar.navn')}</legend>
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

          <div className="avatar-grupper">
            {[GRUPPER.slice(0, 2), GRUPPER.slice(2)].map((kolonne, k) => (
              <div className="avatar-kolonne" key={k}>
                {kolonne.map((g) => (
                  <fieldset className="avatar-gruppe" key={g.id}>
                    <legend>{t(g.id)}</legend>
                    {g.dele.map((del) => {
                      const etiket = t(`avatar.${del}` as TekstId);
                      const farve = avatarDele[del]?.farver?.[avatar[del]];
                      return (
                        <div className="avatar-raekke" key={del} role="group" aria-label={etiket}>
                          <span className="avatar-etiket">{etiket}</span>
                          <button type="button" className="knap knap-lille avatar-pil" onClick={() => skift(del, -1)}>
                            <span aria-hidden="true">◀</span>
                            <span className="sr-only">
                              {t('avatar.forrige')} {etiket}
                            </span>
                          </button>
                          <span className="avatar-vaerdi" aria-live="polite">
                            {farve && <span className="avatar-farve" style={{ '--farve': farve } as CSSProperties} aria-hidden="true" />}
                            {valgNavn(del, avatar[del])}
                          </span>
                          <button type="button" className="knap knap-lille avatar-pil" onClick={() => skift(del, 1)}>
                            <span aria-hidden="true">▶</span>
                            <span className="sr-only">
                              {t('avatar.naeste')} {etiket}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </fieldset>
                ))}
              </div>
            ))}
          </div>

          {laaste.length > 0 && (
            <p className="lille-tekst avatar-laast">
              <span aria-hidden="true">🔒 </span>
              {t('avatar.laaste', { valg: oplist(laaste) })}
            </p>
          )}

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
