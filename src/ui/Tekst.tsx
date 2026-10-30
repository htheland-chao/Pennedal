import { useEffect, useState } from 'react';
import { delTekst, renTekst, t } from '../content';
import { useApp } from './Kontekst';
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

type LaesOpProps = { tekst: string; kunLokal?: boolean; etiket?: string; auto?: boolean };

/** Knap, der læser en tekst op. Vises kun, hvis computeren har en dansk stemme. */
export function LaesOpKnap({ tekst, kunLokal, etiket, auto }: LaesOpProps) {
  const { indstillinger } = useApp();
  const findes = useStemmeFindes();
  const [taler, setTaler] = useState(false);
  const ren = renTekst(tekst);
  useEffect(() => {
    if (auto && indstillinger.oplaesning && findes) {
      setTaler(sig(ren, { stemme: indstillinger.stemme, kunLokal, vedSlut: () => setTaler(false) }));
    }
    return () => stopTale();
  }, [ren, auto, findes, indstillinger.oplaesning, indstillinger.stemme, kunLokal]);
  if (!findes) return null;
  return (
    <button
      type="button"
      className="knap knap-lille laes-op"
      aria-pressed={taler}
      onClick={() => {
        if (taler) {
          stopTale();
          setTaler(false);
        } else {
          setTaler(sig(ren, { stemme: indstillinger.stemme, kunLokal, vedSlut: () => setTaler(false) }));
        }
      }}
    >
      <span aria-hidden="true">🔊 </span>
      {taler ? t('dialog.stop') : (etiket ?? t('dialog.laes.op'))}
    </button>
  );
}
