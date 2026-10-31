import { useEffect, useRef, useState } from 'react';
import { delTekst, renTekst, t } from '../content';
import { useApp } from './Kontekst';
import { type Figur, lydUrl, spilLyd, stopLyd, useLydManifest } from './lyd';
import { daempMusik } from './musik/afspiller';
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

/** Den knap, der læser op lige nu. Starter en anden knap, får den besked om at den er afbrudt. */
let afbrydNuvaerende: (() => void) | null = null;

/** En del af en oplæsning: tekst og hvem der siger den. */
export type Del = { tekst: string; figur?: Figur };

type LaesOpProps = {
  /** Teksten, der læses op. Brug dele i stedet, hvis flere tekster skal læses op efter hinanden. */
  tekst?: string;
  dele?: Del[];
  kunLokal?: boolean;
  etiket?: string;
  auto?: boolean;
  /** Hvem der siger teksten. Med en figur bruges spillets indtalte klip, hvis det findes. */
  figur?: Figur;
  /** Kaldes, når oplæsningen er nået helt til ende (ikke ved stop eller fejl). */
  vedFaerdig?: () => void;
};

/**
 * Knap, der læser en eller flere tekster op efter hinanden.
 * Hver del bruger spillets indtalte klip, hvis det findes, og ellers computerens egen stemme.
 * Med auto starter oplæsningen af sig selv, når "Læs tekster op automatisk" er slået til.
 */
export function LaesOpKnap({ tekst, dele, kunLokal, etiket, auto, figur, vedFaerdig }: LaesOpProps) {
  const { indstillinger } = useApp();
  const findes = useStemmeFindes();
  const { manifest, klar } = useLydManifest();
  const [taler, setTaler] = useState(false);
  const liste = (dele ?? [{ tekst: tekst ?? '', figur }])
    .map((d) => ({ tekst: renTekst(d.tekst).trim(), figur: d.figur }))
    .filter((d) => d.tekst);
  const urls = liste.map((d) => (!kunLokal && d.figur && indstillinger.indtalt ? lydUrl(manifest, d.figur, d.tekst) : null));
  const kanAlt = urls.every((u) => u !== null);
  const styrke = indstillinger.taleStyrke;
  const vedFaerdigRef = useRef(vedFaerdig);
  vedFaerdigRef.current = vedFaerdig;
  const koersel = useRef(0);
  /** Sand, mens netop denne knap læser op. Så stopper den ikke andres oplæsning. */
  const spiller = useRef(false);
  const noegle = liste.map((d, i) => `${d.figur ?? ''}:${d.tekst}:${urls[i] ?? ''}`).join('|');

  const stop = () => {
    koersel.current++;
    spiller.current = false;
    stopTale();
    stopLyd();
    setTaler(false);
    daempMusik('tale', false);
  };

  const afbrudt = () => {
    koersel.current++;
    spiller.current = false;
    setTaler(false);
  };

  const start = () => {
    if (afbrydNuvaerende !== afbrudt) afbrydNuvaerende?.();
    afbrydNuvaerende = afbrudt;
    stopTale();
    stopLyd();
    const mig = ++koersel.current;
    spiller.current = true;
    daempMusik('tale', true);
    setTaler(true);
    const naeste = (i: number) => {
      if (koersel.current !== mig) return;
      if (i >= liste.length) {
        spiller.current = false;
        setTaler(false);
        daempMusik('tale', false);
        vedFaerdigRef.current?.();
        return;
      }
      const slut = (fuldfoert: boolean) => {
        if (koersel.current !== mig) return;
        if (fuldfoert) naeste(i + 1);
        else {
          spiller.current = false;
          setTaler(false);
          daempMusik('tale', false);
        }
      };
      const url = urls[i];
      const ok = url
        ? spilLyd(url, styrke, slut)
        : sig(liste[i].tekst, { stemme: indstillinger.stemme, kunLokal, styrke, vedSlut: slut });
      // Ingen stemme til denne del: spring den over.
      if (!ok) naeste(i + 1);
    };
    naeste(0);
  };

  useEffect(() => {
    if (auto && indstillinger.oplaesning && klar && liste.length > 0 && (kanAlt || findes)) start();
    return () => {
      if (spiller.current) stop();
    };
    // start bruger kun værdierne herunder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noegle, auto, klar, findes, indstillinger.oplaesning, indstillinger.stemme, kunLokal]);

  if (liste.length === 0 || (!findes && !urls.some((u) => u))) return null;
  return (
    <button type="button" className="knap knap-lille laes-op" aria-pressed={taler} onClick={() => (taler ? stop() : start())}>
      <span aria-hidden="true">🔊 </span>
      {taler ? t('dialog.stop') : (etiket ?? t('dialog.laes.op'))}
    </button>
  );
}
