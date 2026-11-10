import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { t } from '../content';
import { FUGL } from '../game/pixel/sprites';
import { FYR_LAMPE, tegnTitelScene, TITEL_B, TITEL_H } from '../game/pixel/titel';
import { tegnkortTilLerred } from '../game/pixel/lerred';

/** Ildfluer over bakken: faste pladser, så de ikke springer rundt ved hver tegning. */
const ILDFLUER = Array.from({ length: 14 }, (_, i) => ({
  x: 4 + ((i * 37) % 90),
  y: 62 + ((i * 53) % 30),
  d: 4 + (i % 5),
  f: (i * 0.7) % 5,
}));

/**
 * Titelskærmen (Henrik, 10. november 2026): en pixelscene i fuld skærm med titel og menu ovenpå.
 * Al tekst er rigtig HTML (krav 1). Bevægelse (fyrets lys, ildfluer, Æseløre) slås fra med "reduceret bevægelse".
 */
export function Titelskaerm({ children, fod }: { children: ReactNode; fod?: ReactNode }) {
  const scene = useMemo(() => tegnTitelScene().toDataURL(), []);
  const fugl = useMemo(() => {
    const k = tegnkortTilLerred({ ...FUGL, raekker: FUGL.raekker.map((r) => [...r].reverse().join('')) });
    return k.toDataURL();
  }, []);
  const lampe = { '--lx': `${(FYR_LAMPE[0] / TITEL_B) * 100}%`, '--ly': `${(FYR_LAMPE[1] / TITEL_H) * 100}%` } as CSSProperties;
  return (
    <main className="titelskaerm">
      <div className="titel-scene" style={lampe} aria-hidden="true">
        <img className="titel-billede" src={scene} alt="" />
        <span className="titel-fyrlys" />
        <img className="titel-fugl" src={fugl} alt="" />
        {ILDFLUER.map((f, i) => (
          <span key={i} className="titel-ildflue" style={{ left: `${f.x}%`, top: `${f.y}%`, animationDuration: `${f.d}s`, animationDelay: `${f.f}s` }} />
        ))}
      </div>
      <div className="titel-indhold">
        <header className="titel-hoved">
          <h1 className="titel-navn">{t('app.titel')}</h1>
          <p className="titel-undertitel">{t('app.undertitel')}</p>
        </header>
        <nav className="titel-menu" aria-label={t('start.menu')}>
          {children}
        </nav>
        {fod && <p className="titel-fod">{fod}</p>}
      </div>
    </main>
  );
}
