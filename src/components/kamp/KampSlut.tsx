import { t } from '../../content';
import { LaesOpKnap } from '../Tekst';

/**
 * Slutningen på en kamp: sejr eller blødt nederlag.
 * Delt ud af KampVindue.tsx 17. november 2026.
 */
export function KampSlut({ slut, onVundet, onGaaVaek }: { slut: 'vundet' | 'slaaet'; onVundet: () => void; onGaaVaek: () => void }) {
  return (
    <section className={`kamp-hud kamp-slut kamp-slut-${slut}`}>
      <p className="kamp-slut-titel">{slut === 'vundet' ? t('kamp.slut.vundet') : t('kamp.slut.slaaet')}</p>
      <p>{slut === 'vundet' ? t('kamp.vundet') : t('kamp.slaaet')}</p>
      <div className="knaprad">
        <LaesOpKnap tekst={slut === 'vundet' ? t('kamp.vundet') : t('kamp.slaaet')} figur="fortaeller" auto />
        {slut === 'vundet' ? (
          <button type="button" className="knap knap-primaer" onClick={onVundet} autoFocus>
            {t('kamp.videre')}
          </button>
        ) : (
          <button type="button" className="knap knap-primaer" onClick={onGaaVaek} autoFocus>
            {t('kamp.tilbage')}
          </button>
        )}
      </div>
    </section>
  );
}
