import type { CSSProperties } from 'react';
import type { Effekt } from '../kampEffekter';
import { STYKKER } from './figurbilleder';

/**
 * Effekterne på scenen: tal, nedslag, stykker af blæk og lys. Kun pynt, så skærmlæsere springer dem over.
 * Delt ud af KampVindue.tsx 17. november 2026.
 */
export function KampEffekter({ effekter }: { effekter: (Effekt & { id: number })[] }) {
  return (
    <div className="kamp-effekter" aria-hidden="true">
      {effekter.map((e) => (
        <span
          key={e.id}
          className={`fx fx-${e.type}${e.slags ? ` fx-${e.slags}` : ''}`}
          style={
            {
              left: `${e.x}%`,
              top: `${e.y}%`,
              '--dx': `${(e.tx ?? e.x) - e.x}`,
              '--dy': `${(e.ty ?? e.y) - e.y}`,
            } as CSSProperties
          }
        >
          {e.tekst}
          {['nedslag', 'oploes', 'krummer', 'lap', 'sejr', 'kombi', 'angreb-stjael'].includes(e.type) &&
            STYKKER.map((s, j) => <i key={j} style={{ '--a': `${s.a}deg`, '--r': s.r } as CSSProperties} />)}
          {e.type === 'ordplads' && [0, 1, 2, 3, 4].map((j) => <b key={j} style={{ '--j': j } as CSSProperties} />)}
        </span>
      ))}
    </div>
  );
}
