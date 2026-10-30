import { useEffect, useState } from 'react';
import { delTekst, renTekst, t } from '../content';
import { useApp } from './Kontekst';
import { type Figur, lydUrl, spilLyd, stopLyd, useLydManifest } from './lyd';
import { danskeStemmer, naarStemmerErKlar, sig, stopTale } from './tale';

/** Viser tekst, hvor {{ord}} bliver til knapper, der åbner et ordkort. */
export function Tekst({ tekst }: { tekst: string }) {
  const { visOrdkort } = useApp();
  return (
    <>
      {delTekst(tekst).map((s, i) =>
        s.type === 'tekst' ? (
          <span key={i}>{s.tekst}</span>
        ) : (
          <button key={i} type="button" className="ordknap" onClick={() => visOrdkort(s.id)}>
            {s.tekst}
          </button>
        ),
      )}
    </>
  );
}

export function useStemmeFindes(): boolean {
  const [findes, setFindes] = useState(() => danskeStemmer().length > 0);
  useEffect(() => naarStemmerErKlar(() => setFindes(danskeStemmer().length > 0)), []);
  return findes;
}

type LaesOpProps = {
  tekst: string;
  kunLokal?: boolean;
  etiket?: string;
  auto?: boolean;
  /** Hvem der siger teksten. Med en figur bruges spillets indtalte klip, hvis det findes. */
  figur?: Figur;
};

/**
 * Knap, der læser en tekst op. Bruger spillets indtalte klip, hvis det findes,
 * ellers computerens danske stemme. Vises ikke, hvis ingen af delene findes.
 */
export function LaesOpKnap({ tekst, kunLokal, etiket, auto, figur }: LaesOpProps) {
  const { indstillinger } = useApp();
  const findes = useStemmeFindes();
  const { manifest, klar } = useLydManifest();
  const [taler, setTaler] = useState(false);
  const ren = renTekst(tekst);
  const url = !kunLokal && figur && indstillinger.indtalt ? lydUrl(manifest, figur, ren) : null;
  const styrke = indstillinger.taleStyrke;

  const start = () => {
    stopTale();
    stopLyd();
    const slut = () => setTaler(false);
    if (url) setTaler(spilLyd(url, styrke, slut));
    else setTaler(sig(ren, { stemme: indstillinger.stemme, kunLokal, styrke, vedSlut: slut }));
  };

  useEffect(() => {
    if (auto && indstillinger.oplaesning && klar && (url || findes)) start();
    return () => {
      stopTale();
      stopLyd();
    };
    // start bruger kun værdierne herunder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ren, auto, klar, url, findes, indstillinger.oplaesning, indstillinger.stemme, kunLokal]);

  if (!findes && !url) return null;
  return (
    <button
      type="button"
      className="knap knap-lille laes-op"
      aria-pressed={taler}
      onClick={() => {
        if (taler) {
          stopTale();
          stopLyd();
          setTaler(false);
        } else start();
      }}
    >
      <span aria-hidden="true">🔊 </span>
      {taler ? t('dialog.stop') : (etiket ?? t('dialog.laes.op'))}
    </button>
  );
}
