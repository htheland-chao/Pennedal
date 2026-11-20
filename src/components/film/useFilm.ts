import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { Replik } from '../../content';
import type { GemtSpil } from '../../data/gem';
import { opfyldt } from '../../engine/betingelse';
import { afspil, type Afspilning } from '../../engine/film/afspiller';
import type { Arbejder, EnkelHandling, Handling } from '../../engine/film/typer';
import type { PhaserFilm } from '../../game/kort/film';
import { spilEffekt, type EffektNavn } from '../../lyd/effekter';
import { overtonMusik, saetMusikOverride } from '../../lyd/musik/afspiller';
import { roligBevaegelse } from '../kamp/tilgaengelighed';

/** Så længe bjælkerne glider ind eller ud (ms). Samme tid som i CSS (.film-bjaelke). */
export const BJAELKE_MS = 450;

type Props = {
  handlinger: Handling[];
  /** Phasers del af arbejdet. Er den tom (fx en platformbane), sker kamera og figurer bare ikke. */
  phaser: MutableRefObject<PhaserFilm | null>;
  spilRef: MutableRefObject<GemtSpil>;
  /** Sætter et valg i det gemte spil (handlingen saet). */
  onSaet: (valg: string) => void;
  /** Filmen er slut eller sprunget over, og alt er ryddet op. */
  onFaerdig: () => void;
};

/**
 * React-arbejderen til filmsekvenser (20. november 2026): bjælker, replikker, musik, lyd og valg. Resten (kamera,
 * figurer, ton, rystelse, blink, stemning) sendes videre til Phaser. Afspilleren starter, når komponenten kommer
 * frem, og springer resten over, hvis den forsvinder midt i (fx når eleven går til forsiden).
 */
export function useFilm({ handlinger, phaser, spilRef, onSaet, onFaerdig }: Props) {
  const [bjaelker, setBjaelker] = useState(false);
  const [replikker, setReplikker] = useState<{ replikker: Replik[]; faerdig: () => void } | null>(null);
  const afspilning = useRef<Afspilning | null>(null);
  const kald = useRef({ onSaet, onFaerdig });
  kald.current = { onSaet, onFaerdig };

  useEffect(() => {
    let levende = true;
    const rolig = roligBevaegelse();
    const vent = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
    const arbejder: Arbejder = {
      start: () => phaser.current?.start(),
      udfoer: (h: EnkelHandling) => {
        switch (h.type) {
          case 'bjaelker':
            setBjaelker(h.til);
            return vent(rolig ? 0 : BJAELKE_MS);
          case 'replikker': {
            // Replikker med betingelser (hvis) vælges, når de kommer frem, som i et dialogtrin.
            const valgte = h.replikker.filter((r) => !r.hvis || opfyldt(r.hvis, spilRef.current));
            if (valgte.length === 0) return Promise.resolve();
            return new Promise<void>((r) =>
              setReplikker({
                replikker: valgte,
                faerdig: () => {
                  setReplikker(null);
                  r();
                },
              }),
            );
          }
          case 'musik':
            overtonMusik(h.tema, h.overtoning ?? 0);
            return Promise.resolve();
          case 'lyd':
            spilEffekt(h.effekt as EffektNavn);
            return Promise.resolve();
          case 'saet':
            kald.current.onSaet(h.valg);
            return Promise.resolve();
          default:
            return phaser.current?.udfoer(h) ?? Promise.resolve();
        }
      },
      slut: (h: EnkelHandling) => {
        switch (h.type) {
          case 'bjaelker':
            setBjaelker(h.til);
            break;
          case 'replikker':
            setReplikker(null);
            break;
          case 'musik':
            overtonMusik(h.tema, 0);
            break;
          case 'lyd':
            break;
          case 'saet':
            kald.current.onSaet(h.valg);
            break;
          default:
            phaser.current?.slut(h);
        }
      },
      oprydning: () => {
        phaser.current?.oprydning();
        // Filmens musik gælder kun filmen ud. Bagefter spiller stedets egen sang.
        saetMusikOverride(null);
        setBjaelker(false);
        setReplikker(null);
      },
    };
    // Filmen starter lige efter, at komponenten er kommet frem. React prøver i udvikling at fjerne og sætte
    // komponenten ind igen med det samme (StrictMode). Så når den første start aldrig at ske.
    const ur = window.setTimeout(() => {
      const a = afspil(handlinger, arbejder);
      afspilning.current = a;
      void a.faerdig.then(() => {
        if (levende) kald.current.onFaerdig();
      });
    });
    return () => {
      levende = false;
      window.clearTimeout(ur);
      afspilning.current?.springOver();
    };
    // Filmen afspilles én gang, fra komponenten kommer frem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const springOver = useRef(() => afspilning.current?.springOver()).current;

  // Escape springer over (krav 7: alt kan styres med tastaturet).
  useEffect(() => {
    const ned = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return;
      e.preventDefault();
      springOver();
    };
    window.addEventListener('keydown', ned);
    return () => window.removeEventListener('keydown', ned);
  }, [springOver]);

  return { bjaelker, replikker, springOver };
}
