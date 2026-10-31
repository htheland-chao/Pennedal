import { useMemo } from 'react';
import { tegnkortTilLerred } from '../game/pixel/lerred';
import { PORTRAETTER } from '../game/pixel/portraetter';

const cache = new Map<string, string | null>();

/** Et pixelportræt som billede. Tegnes én gang og gemmes. Rent pynt: skærmlæsere springer det over. */
export function PixelPortraet({ figur }: { figur: keyof typeof PORTRAETTER }) {
  const url = useMemo(() => {
    if (!cache.has(figur)) {
      let u: string | null = null;
      try {
        u = tegnkortTilLerred(PORTRAETTER[figur]).toDataURL('image/png');
      } catch {
        u = null;
      }
      cache.set(figur, u);
    }
    return cache.get(figur) ?? null;
  }, [figur]);
  if (!url) return null;
  return <img className="pixel-portraet" src={url} alt="" width={24} height={24} />;
}
