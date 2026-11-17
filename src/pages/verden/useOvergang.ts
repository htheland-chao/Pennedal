import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { OvergangType } from '../../components/Overgang';
import { spilEffekt } from '../../lyd/effekter';

/**
 * Overgang mellem steder (8. november 2026): portalen fra kælderen til Pennedal, ellers et kort blækstrøg.
 * Delt ud af Verden.tsx 16. november 2026.
 */
export function useOvergang(stedId: string) {
  const forrigeSted = useRef(stedId);
  const [overgang, setOvergang] = useState<{ type: OvergangType; nr: number } | null>(null);
  const slutOvergang = useCallback(() => setOvergang(null), []);
  // useLayoutEffect: overgangen skal ligge over skærmen, før det nye sted bliver vist (Henrik, 16. november 2026).
  useLayoutEffect(() => {
    const fra = forrigeSted.current;
    forrigeSted.current = stedId;
    if (fra === stedId) return;
    spilEffekt('sted');
    setOvergang((o) => ({ type: fra === 'kaelder' && stedId === 'pennedal' ? 'portal' : 'skift', nr: (o?.nr ?? 0) + 1 }));
  }, [stedId]);
  return { overgang, slutOvergang };
}
