import { useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

/**
 * Overgange mellem steder (Henrik, 8. november 2026).
 * - portal: fra kælderen til Pennedal. En hvirvel af blæk lukker sig, man falder gennem papirstumper,
 *   og Pennedal åbner sig med blade, der daler.
 * - skift: alle andre steder. Et hurtigt strøg af blæk hen over skærmen.
 * Ren pynt: ingen tekst, ingen knapper, og man kan klikke igennem den. Med reduceret bevægelse er det en kort fade.
 */
export type OvergangType = 'portal' | 'skift';
export const OVERGANG_MS: Record<OvergangType, number> = { portal: 2600, skift: 800 };

const STUMPER = Array.from({ length: 24 }, (_, i) => ({ x: (i * 37) % 100, f: 0.55 + ((i * 7) % 10) / 20, d: (i % 6) * 0.08, s: 0.6 + (i % 4) * 0.3 }));
const BLADE = Array.from({ length: 16 }, (_, i) => ({ x: (i * 53 + 7) % 100, d: 1.6 + (i % 5) * 0.12, r: (i * 47) % 360, s: 0.8 + (i % 3) * 0.35 }));

export function Overgang({ type, onFaerdig }: { type: OvergangType; onFaerdig: () => void }) {
  useEffect(() => {
    const ur = window.setTimeout(onFaerdig, OVERGANG_MS[type]);
    return () => window.clearTimeout(ur);
  }, [type, onFaerdig]);
  // Lægges direkte i siden, så den dækker alt, også beskeder uden for spillet.
  if (type === 'skift') return createPortal(<div className="overgang overgang-skift" aria-hidden="true" />, document.body);
  return createPortal(
    <div className="overgang overgang-portal" aria-hidden="true">
      <div className="portal-hvirvel" />
      <div className="portal-fald">
        {STUMPER.map((p, i) => (
          <i key={i} style={{ '--x': `${p.x}%`, '--f': `${p.f}s`, '--d': `${0.9 + p.d}s`, '--s': p.s } as CSSProperties} />
        ))}
      </div>
      <div className="portal-aabning" />
      <div className="portal-blade">
        {BLADE.map((b, i) => (
          <i key={i} style={{ '--x': `${b.x}%`, '--d': `${b.d}s`, '--r': `${b.r}deg`, '--s': b.s } as CSSProperties} />
        ))}
      </div>
    </div>,
    document.body,
  );
}
