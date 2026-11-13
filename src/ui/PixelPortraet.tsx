import { useEffect, useMemo, useState } from 'react';
import type { TingId } from '../engine/taske';
import { tegnkortTilLerred } from '../game/pixel/lerred';
import { portraetBilleder, type Billeder, type PortraetFigur } from '../game/pixel/levende';
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

const billedCache = new Map<PortraetFigur, Billeder>();
function billederFor(figur: PortraetFigur): Billeder {
  if (!billedCache.has(figur)) billedCache.set(figur, portraetBilleder(figur));
  return billedCache.get(figur)!;
}

function brugerMindreBevaegelse(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

/**
 * Et levende portræt i dialogen (13. november 2026): figuren blinker en gang imellem og bevæger munden,
 * mens den taler. Under "reduceret bevægelse" i styresystemet står portrættet stille. Rent pynt.
 */
export function LevendePortraet({ figur, taler }: { figur: PortraetFigur; taler: boolean }) {
  const b = billederFor(figur);
  const [blinker, setBlinker] = useState(false);
  const [aaben, setAaben] = useState(false);
  const stille = brugerMindreBevaegelse();

  useEffect(() => {
    if (stille) return;
    let tid: ReturnType<typeof setTimeout>;
    const naeste = () => {
      tid = setTimeout(() => {
        setBlinker(true);
        tid = setTimeout(() => {
          setBlinker(false);
          naeste();
        }, 140);
      }, 2200 + Math.random() * 3300);
    };
    naeste();
    return () => clearTimeout(tid);
  }, [stille, figur]);

  useEffect(() => {
    if (!taler || stille) {
      setAaben(false);
      return;
    }
    let tid: ReturnType<typeof setTimeout>;
    const skift = () => {
      setAaben((a) => !a);
      tid = setTimeout(skift, 110 + Math.random() * 110);
    };
    skift();
    return () => clearTimeout(tid);
  }, [taler, stille]);

  const navn = blinker ? (aaben ? 'blinkTale' : 'blink') : aaben ? 'tale' : 'hvile';
  const hvile = useBillede(`portraet.${figur}`, b.hvile);
  const blink = useBillede(`portraet.${figur}.blink`, b.blink);
  const tale = useBillede(`portraet.${figur}.tale`, b.tale);
  const blinkTale = useBillede(`portraet.${figur}.blinkTale`, b.blinkTale);
  const url = { hvile, blink, tale, blinkTale }[navn] ?? hvile;
  if (!url) return null;
  return (
    <img
      className={`pixel-portraet levende${taler && !stille ? ' taler' : ''}`}
      src={url}
      alt=""
      width={24}
      height={24}
      data-billede={navn}
    />
  );
}

/** Ikonet for en ting i tasken. Navnet står altid ved siden af som tekst. */
export function TingIkon({ ting }: { ting: TingId }) {
  const url = useBillede(`ting.${ting}`, TING_IKONER[ting]);
  if (!url) return null;
  return <img className="ting-ikon" src={url} alt="" width={12} height={12} />;
}
