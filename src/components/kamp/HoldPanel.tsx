import { t } from '../../content';
import { KOMBI, stortSlagKlar, type Kamp, type MedlemId } from '../../mechanics/kampmotor';

type Props = {
  kamp: Kamp;
  livMedlem: (id: MedlemId) => number;
  medlemNavn: (id: MedlemId) => string;
};

/**
 * Holdet: navne og liv nederst til højre, som i et rollespil, og hvor tæt man er på et stort slag.
 * Delt ud af KampVindue.tsx 17. november 2026.
 */
export function HoldPanel({ kamp, livMedlem, medlemNavn }: Props) {
  return (
    <section className="kamp-hud kamp-hold" aria-label={t('kamp.holdet')}>
      <ul>
        {kamp.hold.map((m) => {
          const liv = livMedlem(m.id);
          return (
            <li key={m.id} className={liv <= 0 ? 'faldet' : ''}>
              <span className="kamp-navn">{medlemNavn(m.id)}</span>
              <span className={`kamp-maaler liv${liv / m.maks <= 0.34 ? ' lav' : ''}`} aria-hidden="true">
                <span style={{ width: `${(liv / m.maks) * 100}%` }} />
              </span>
              <span className="kamp-tal">{t('kamp.liv.kort', { liv, maks: m.maks })}</span>
            </li>
          );
        })}
      </ul>
      {!kamp.udfald && <p className={`kamp-kombi${stortSlagKlar(kamp) ? ' klar' : ''}`}>{stortSlagKlar(kamp) ? t('kamp.stort.klar') : t('kamp.kombi', { antal: kamp.kombi, maks: KOMBI })}</p>}
    </section>
  );
}
