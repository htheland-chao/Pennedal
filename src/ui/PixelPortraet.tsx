import { useMemo } from 'react';
import type { TingId } from '../engine/taske';
import { tegnkortTilLerred } from '../game/pixel/lerred';
import { PORTRAETTER } from '../game/pixel/portraetter';
import type { Tegnkort } from '../game/pixel/sprites';
import { TING_IKONER } from '../game/pixel/ting';

const cache = new Map<string, string | null>();

function useBillede(noegle: string, kort: Tegnkort): string | null {
  return useMemo(() => {
    if (!cache.has(noegle)) {
      let u: string | null = null;
      try {
        u = tegnkortTilLerred(kort).toDataURL('image/png');
      } catch {
        u = null;
      }
      cache.set(noegle, u);
    }
    return cache.get(noegle) ?? null;
  }, [noegle, kort]);
}

/** Et pixelportræt som billede. Tegnes én gang og gemmes. Rent pynt: skærmlæsere springer det over. */
export function PixelPortraet({ figur }: { figur: keyof typeof PORTRAETTER }) {
  const url = useBillede(`portraet.${figur}`, PORTRAETTER[figur]);
  if (!url) return null;
  return <img className="pixel-portraet" src={url} alt="" width={24} height={24} />;
}

/** Ikonet for en ting i tasken. Navnet står altid ved siden af som tekst. */
export function TingIkon({ ting }: { ting: TingId }) {
  const url = useBillede(`ting.${ting}`, TING_IKONER[ting]);
  if (!url) return null;
  return <img className="ting-ikon" src={url} alt="" width={12} height={12} />;
}
