import { useMemo, useState } from 'react';
import { t, type TekstId } from '../content';
import { muligheder, ordI, somTekst, stykker, type KorrekturTekst } from '../mechanics/korrektur';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

type Props = {
  tekst: KorrekturTekst;
  /** Fejl, der allerede er rettet i denne tekst. */
  rettede: number[];
  /** Den fejl, eleven har trykket på. */
  valgt: number | null;
  onVaelg: (nr: number | null) => void;
  api: OpgaveApi;
};

const KLATTEN_LINJER = ['korrektur.klatten.1', 'korrektur.klatten.2', 'korrektur.klatten.3', 'korrektur.klatten.4'] as const;

/**
 * Klattens tekster (kapitel 6): teksten står som rigtig tekst, og hvert ord kan trykkes på (tastatur og touch).
 * Trykker eleven på et forkert stavet ord, kommer tre stavemåder. Et ord, der er stavet rigtigt, giver et tip.
 * Teksten kan læses op, som Klatten skrev den. Ingen tid (krav 5).
 */
export function KorrekturOpgave({ tekst, rettede, valgt, onVaelg, api }: Props) {
  const [tip, setTip] = useState<string | null>(null);
  const [forkerte, setForkerte] = useState<string[]>([]);
  const valg = useMemo(() => (valgt === null ? [] : muligheder(tekst.fejl[valgt], Math.random)), [tekst, valgt]);
  const tilbage = tekst.fejl.length - rettede.length - (api.loest ? 1 : 0);
  const helt = api.loest && tilbage === 0;
  const linje = useMemo(() => KLATTEN_LINJER[Math.floor(Math.random() * KLATTEN_LINJER.length)], []);

  function trykOrd(ord: string) {
    if (api.laast) return;
    onVaelg(null);
    setForkerte([]);
    setTip(t('korrektur.ikke.fejl', { ord: ord.replace(/[.,?!]/g, '') }));
  }
  function trykFejl(nr: number) {
    if (api.laast) return;
    setTip(null);
    setForkerte([]);
    onVaelg(nr);
  }
  function svar(m: string) {
    if (valgt === null || api.laast) return;
    const f = tekst.fejl[valgt];
    if (m !== f.rigtig) setForkerte((x) => [...x, m]);
    api.tjek(m === f.rigtig, t('korrektur.fejl', { valgt: m }));
  }

  // Tegn lige efter en fejl (fx et punktum) står sammen med ordet, så de ikke bliver delt over to linjer.
  const dele = useMemo(() => {
    const raa = stykker(tekst);
    return raa.map((s, i) => {
      if (s.slags === 'fejl') {
        const naeste = raa[i + 1];
        const tegn = naeste?.slags === 'tekst' ? (/^[.,?!]+/.exec(naeste.tekst)?.[0] ?? '') : '';
        return { ...s, tegn };
      }
      const forrige = raa[i - 1];
      const skaer = forrige?.slags === 'fejl' ? (/^[.,?!]+/.exec(s.tekst)?.[0].length ?? 0) : 0;
      return { ...s, tekst: s.tekst.slice(skaer) };
    });
  }, [tekst]);

  const instruks = helt ? t('korrektur.faerdig') : t(tilbage === 1 ? 'korrektur.instruks.en' : 'korrektur.instruks', { antal: tilbage });
  return (
    <div className="korrektur-opgave" data-opgave-id={tekst.id}>
      <p className="instruks">
        {instruks}
        <LaesOpKnap tekst={instruks} figur="fortaeller" />
      </p>
      <p className="korrektur-tekst">
        {dele.map((s, i) => {
          if (s.slags === 'tekst')
            return ordI(s.tekst).map((o, j) =>
              /^\s+$/.test(o) || /^[.,?!]+$/.test(o) ? (
                o
              ) : (
                <button key={`${i}-${j}`} type="button" className="korrektur-ord" disabled={api.laast} onClick={() => trykOrd(o)}>
                  {o}
                </button>
              ),
            );
          const f = tekst.fejl[s.nr];
          const rettet = rettede.includes(s.nr) || (api.loest && valgt === s.nr);
          if (rettet)
            return (
              <span key={i} className="korrektur-hel">
                <mark className="korrektur-rettet">{f.rigtig}</mark>
                {s.tegn}
              </span>
            );
          return (
            <span key={i} className="korrektur-hel">
            <button
              key={i}
              type="button"
              className={`korrektur-ord${valgt === s.nr ? ' valgt' : ''}`}
              aria-pressed={valgt === s.nr}
              data-fejl={s.nr}
              disabled={api.laast}
              onClick={() => trykFejl(s.nr)}
            >
              {f.skrevet}
            </button>
            {s.tegn}
            </span>
          );
        })}
        <LaesOpKnap tekst={somTekst(tekst)} figur="klatten" />
      </p>
      {tip && valgt === null && (
        <div className="besked besked-info" aria-live="polite">
          <p>{tip}</p>
          <div className="regel">
            <p>
              <strong>{t('feedback.regel')}:</strong> {t('korrektur.find.regel')}
            </p>
            <p>
              <strong>{t('feedback.eksempel')}:</strong> {t('korrektur.find.eksempel')}
            </p>
          </div>
        </div>
      )}
      {valgt !== null && !api.loest && (
        <>
          <p className="kamp-spoergsmaal">{t('korrektur.spoergsmaal', { ord: tekst.fejl[valgt].skrevet })}</p>
          <div className="kamp-muligheder" role="group" aria-label={t('korrektur.spoergsmaal', { ord: tekst.fejl[valgt].skrevet })}>
            {valg.map((m) => (
              <button key={m} type="button" className={`knap kamp-mulighed${forkerte.includes(m) ? ' forkert' : ''}`} disabled={api.laast || forkerte.includes(m)} onClick={() => svar(m)}>
                {m}
              </button>
            ))}
          </div>
        </>
      )}
      {helt && (
        <p className="korrektur-klatten">
          <strong>{t('taler.klatten')}:</strong> {t(linje as TekstId)}
        </p>
      )}
    </div>
  );
}
