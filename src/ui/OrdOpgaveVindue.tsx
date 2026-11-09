import { useMemo, useState } from 'react';
import { fortaellersaetninger, rimord, synonymer, t, type OrdOpgaveArt } from '../content';
import { helSaetning, lavFortsaet } from '../mechanics/fortaeller';
import { lavTomordOpgave } from '../mechanics/kamp';
import { lavOpgaveAfArt } from '../mechanics/rim';
import { Modal } from './Modal';
import { LaesOpKnap } from './Tekst';

type Props = {
  titel: string;
  intro: string;
  /** Antal ord, der skal findes. */
  antal: number;
  niveau: number;
  /** Slags opgave: synonymer (Viskeskoven), rim eller ord, der ikke rimer (Rimbjerget). */
  art?: OrdOpgaveArt;
  /** Svar til tilpasningen (rigtigt eller forkert og hvilket forsøg). */
  onSvar: (rigtigt: boolean, forsoeg: number) => void;
  onFaerdig: () => void;
  /** Gå væk uden at være færdig. Intet går tabt. */
  onPause: () => void;
  /** Teksten på knappen, når det sidste ord er fundet. */
  faerdigTekst: string;
  pauseTekst: string;
};

/** Det, vinduet viser for én opgave, uanset slags. */
type Visning = {
  id: string;
  ord: string;
  /** Sætningen med det markerede ord (kun synonymer). */
  saetning?: { foer: string; vist: string; efter: string; hel: string };
  spoergsmaal: string;
  svar: string;
  muligheder: string[];
  rigtig: string;
  fejl: (valgt: string) => string;
  regel: string;
  eksempel: string;
};

function lav(art: OrdOpgaveArt, niveau: number, rnd: () => number, brugt: string[]): Visning {
  if (art === 'synonym') {
    const o = lavTomordOpgave(synonymer.ord, niveau, rnd, brugt);
    return {
      id: o.id,
      ord: o.ord,
      saetning: { foer: o.foer, vist: o.vist, efter: o.efter, hel: o.saetning },
      spoergsmaal: t('kamp.tomordet.spoergsmaal', { ord: o.ord }),
      svar: o.svar,
      muligheder: o.muligheder,
      rigtig: t('kamp.tomordet.rigtig', { svar: o.svar, ord: o.ord }),
      fejl: (valgt) => t('kamp.tomordet.fejl', { valgt, ord: o.ord }),
      regel: t('kamp.tomordet.regel'),
      eksempel: t('kamp.tomordet.eksempel'),
    };
  }
  if (art === 'fortaeller') {
    const o = lavFortsaet(fortaellersaetninger.fortsaet, niveau, rnd, brugt);
    return {
      id: o.id,
      ord: o.svar,
      saetning: { foer: `${o.foer} `, vist: '___', efter: ` ${o.efter}`, hel: helSaetning(o, '...') },
      spoergsmaal: t('fortaeller.fortsaet.spoergsmaal'),
      svar: o.svar,
      muligheder: o.muligheder,
      rigtig: t('fortaeller.fortsaet.rigtig', { svar: o.svar }),
      fejl: (valgt) => t('fortaeller.fortsaet.fejl', { valgt }),
      regel: t('fortaeller.regel'),
      eksempel: t('fortaeller.eksempel'),
    };
  }
  const o = lavOpgaveAfArt(art, rimord, niveau, rnd, brugt);
  const r = art === 'ikkerim' ? 'ikkerim' : 'rim';
  return {
    id: o.id,
    ord: o.ord,
    spoergsmaal: t(`rim.${r}.spoergsmaal`, { ord: o.ord }),
    svar: o.svar,
    muligheder: o.muligheder,
    rigtig: t(`rim.${r}.rigtig`, { svar: o.svar, ord: o.ord }),
    fejl: (valgt) => t(`rim.${r}.fejl`, { valgt, ord: o.ord }),
    regel: t('rim.regel'),
    eksempel: t('rim.eksempel'),
  };
}

/**
 * En lille ordopgave med tre muligheder: synonymer (ordstenene i Viskeskoven, Halvsangen), rim (ekkostenene på
 * Rimbjerget) og ord, der ikke rimer (Rimfods sætning). Ingen tid (krav 5). Et forkert svar giver regel og
 * eksempel (krav 6), og man prøver igen.
 */
export function OrdOpgaveVindue({ titel, intro, antal, niveau, art = 'synonym', onSvar, onFaerdig, onPause, faerdigTekst, pauseTekst }: Props) {
  const rnd = useMemo(() => Math.random, []);
  const [nr, setNr] = useState(0);
  const [brugt, setBrugt] = useState<string[]>([]);
  const [opgave, setOpgave] = useState<Visning>(() => lav(art, niveau, rnd, []));
  const [valgt, setValgt] = useState<string | null>(null);
  const [forkerte, setForkerte] = useState<string[]>([]);
  const rigtigt = valgt === opgave.svar;
  const sidste = nr === antal - 1;

  function svar(m: string) {
    setValgt(m);
    const r = m === opgave.svar;
    onSvar(r, forkerte.length + 1);
    if (!r) setForkerte((f) => [...f, m]);
  }

  function naeste() {
    if (sidste) {
      onFaerdig();
      return;
    }
    const nyBrugt = [...brugt, opgave.id];
    setBrugt(nyBrugt);
    setOpgave(lav(art, niveau, rnd, nyBrugt));
    setNr(nr + 1);
    setValgt(null);
    setForkerte([]);
  }

  return (
    <Modal titel={titel} onLuk={onPause} klasse="ord-opgave">
      <h2>{titel}</h2>
      <p className="fortaeller">{intro}</p>
      {antal > 1 && <p className="lille-tekst">{t('ordopgave.nr', { nr: nr + 1, antal })}</p>}
      {opgave.saetning ? (
        <p className="kamp-saetning" data-opgave-id={opgave.id}>
          {opgave.saetning.foer}
          <mark>{opgave.saetning.vist}</mark>
          {opgave.saetning.efter}
        </p>
      ) : (
        <p className="kamp-saetning" data-opgave-id={opgave.id} data-opgave-art={art}>
          <mark>{opgave.ord}</mark>
        </p>
      )}
      <p className="kamp-spoergsmaal">
        {opgave.spoergsmaal}
        <LaesOpKnap tekst={opgave.saetning ? opgave.saetning.hel : opgave.spoergsmaal} figur="fortaeller" />
      </p>
      <div className="kamp-muligheder">
        {opgave.muligheder.map((m) => (
          <button
            key={m}
            type="button"
            className={`knap kamp-mulighed${rigtigt && m === opgave.svar ? ' rigtig' : ''}${forkerte.includes(m) ? ' forkert' : ''}`}
            disabled={rigtigt || forkerte.includes(m)}
            onClick={() => svar(m)}
          >
            {m}
          </button>
        ))}
      </div>
      {valgt && (
        <div className="opgave-feedback" aria-live="polite">
          <div className={`besked besked-${rigtigt ? 'god' : 'fejl'}`}>
            <p>{rigtigt ? opgave.rigtig : opgave.fejl(valgt)}</p>
            <div className="regel">
              <p>
                <strong>{t('feedback.regel')}:</strong> {opgave.regel}
              </p>
              <p>
                <strong>{t('feedback.eksempel')}:</strong> {opgave.eksempel}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="knaprad">
        {rigtigt ? (
          <button type="button" className="knap knap-primaer" autoFocus onClick={naeste}>
            {sidste ? faerdigTekst : t('ordopgave.videre')}
          </button>
        ) : (
          <button type="button" className="knap" onClick={onPause}>
            {pauseTekst}
          </button>
        )}
      </div>
    </Modal>
  );
}
