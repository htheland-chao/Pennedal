import { useEffect, useMemo } from 'react';
import { t } from '../content';
import { mindeTekster, mindeTitel, type MindeId } from '../content/minder';
import { kornBillede, mindeBillede } from '../game/pixel/minder';
import { useApp } from './Kontekst';
import { Modal } from './Modal';
import { hentMusikOverride, saetMusikOverride } from './musik/afspiller';
import { LaesOpKnap } from './Tekst';

/**
 * Et tilbageblik: en kort scene fra avatarens forhistorie (docs/historie.md).
 * Lys, kornet og varm. Pennedals musik stopper, og der er kun en svag tone.
 * Teksten er rigtig HTML og læses op. Kan altid springes over (Escape eller knappen).
 */
export function Tilbageblik({ id, onFaerdig }: { id: MindeId; onFaerdig: () => void }) {
  const { indstillinger } = useApp();
  const tekster = useMemo(() => mindeTekster(id, indstillinger.mindreUhygge), [id, indstillinger.mindreUhygge]);
  const billede = useMemo(() => mindeBillede(id), [id]);
  const korn = useMemo(() => kornBillede(), []);

  useEffect(() => {
    const foer = hentMusikOverride();
    saetMusikOverride('minde');
    return () => saetMusikOverride(foer);
  }, []);

  const mild = indstillinger.mindreUhygge ? ' mild' : '';
  return (
    <Modal titel={mindeTitel(id)} onLuk={onFaerdig} klasse={`tilbageblik minde-${id}${mild}`}>
      <div className="tilbageblik-billede" aria-hidden="true">
        {billede && <img src={billede} alt="" />}
        <span className="tilbageblik-korn" style={korn ? { backgroundImage: `url(${korn})` } : undefined} />
      </div>
      <div className="tilbageblik-tekst">
        <h2>{mindeTitel(id)}</h2>
        {tekster.map((tekst, i) => (
          <p key={i} style={{ animationDelay: `${i * 0.8}s` }}>
            {tekst}
          </p>
        ))}
      </div>
      <div className="knaprad">
        <LaesOpKnap dele={tekster.map((tekst) => ({ tekst, figur: 'fortaeller' }))} auto />
        <button type="button" className="knap knap-primaer" onClick={onFaerdig} autoFocus>
          {t('minde.videre')}
        </button>
      </div>
    </Modal>
  );
}
