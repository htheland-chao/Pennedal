import { useMemo, useState } from 'react';
import { synonymer, t } from '../content';
import { lavTomordOpgave, type KampOpgave } from '../mechanics/kamp';
import { Modal } from './Modal';
import { LaesOpKnap } from './Tekst';

type Props = {
  titel: string;
  intro: string;
  /** Antal ord, der skal findes. */
  antal: number;
  niveau: number;
  /** Svar til tilpasningen (rigtigt eller forkert og hvilket forsøg). */
  onSvar: (rigtigt: boolean, forsoeg: number) => void;
  onFaerdig: () => void;
  /** Gå væk uden at være færdig. Intet går tabt. */
  onPause: () => void;
  /** Teksten på knappen, når det sidste ord er fundet. */
  faerdigTekst: string;
  pauseTekst: string;
};

/**
 * Find et ord, der betyder det samme (synonymer, laes.ordforraad). Bruges ved ordstenene på banen i Viskeskoven
 * og i Halvsangens sidemission. Ingen tid (krav 5). Et forkert svar giver regel og eksempel (krav 6), og man prøver igen.
 */
export function OrdOpgaveVindue({ titel, intro, antal, niveau, onSvar, onFaerdig, onPause, faerdigTekst, pauseTekst }: Props) {
  const rnd = useMemo(() => Math.random, []);
  const [nr, setNr] = useState(0);
  const [brugt, setBrugt] = useState<string[]>([]);
  const [opgave, setOpgave] = useState<KampOpgave>(() => lavTomordOpgave(synonymer.ord, niveau, rnd));
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
    setOpgave(lavTomordOpgave(synonymer.ord, niveau, rnd, nyBrugt));
    setNr(nr + 1);
    setValgt(null);
    setForkerte([]);
  }

  return (
    <Modal titel={titel} onLuk={onPause} klasse="ord-opgave">
      <h2>{titel}</h2>
      <p className="fortaeller">{intro}</p>
      {antal > 1 && <p className="lille-tekst">{t('ordopgave.nr', { nr: nr + 1, antal })}</p>}
      <p className="kamp-saetning" data-opgave-id={opgave.id}>
        {opgave.foer}
        <mark>{opgave.vist}</mark>
        {opgave.efter}
      </p>
      <p className="kamp-spoergsmaal">
        {t('kamp.tomordet.spoergsmaal', { ord: opgave.ord })}
        <LaesOpKnap tekst={opgave.saetning} figur="fortaeller" />
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
            <p>{rigtigt ? t('kamp.tomordet.rigtig', { svar: opgave.svar, ord: opgave.ord }) : t('kamp.tomordet.fejl', { valgt, ord: opgave.ord })}</p>
            <div className="regel">
              <p>
                <strong>{t('feedback.regel')}:</strong> {t('kamp.tomordet.regel')}
              </p>
              <p>
                <strong>{t('feedback.eksempel')}:</strong> {t('kamp.tomordet.eksempel')}
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
