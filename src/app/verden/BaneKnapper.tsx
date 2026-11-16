import type { RefObject } from 'react';
import { t } from '../../content';
import type { BaneStyring } from '../../game/PhaserVerden';

/**
 * Knapper på skærmen til platformbanen (touch og mus). Tastatur: pilene, A og D, og mellemrum eller W for at hoppe.
 * Delt ud af Verden.tsx 16. november 2026.
 */
export function BaneKnapper({ baneRef }: { baneRef: RefObject<BaneStyring | null> }) {
  return (
    <div className="bane-knapper">
      {(['venstre', 'hoejre', 'hop'] as const).map((k) => (
        <button
          key={k}
          type="button"
          className={`knap bane-knap bane-knap-${k}`}
          tabIndex={-1}
          aria-label={t(`bane.knap.${k}`)}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            baneRef.current?.styr(k, true);
          }}
          onPointerUp={() => baneRef.current?.styr(k, false)}
          onPointerCancel={() => baneRef.current?.styr(k, false)}
          onLostPointerCapture={() => baneRef.current?.styr(k, false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <span aria-hidden="true">{k === 'venstre' ? '◀' : k === 'hoejre' ? '▶' : '▲'}</span>
        </button>
      ))}
    </div>
  );
}
