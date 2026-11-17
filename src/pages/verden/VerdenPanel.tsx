import type { RefObject } from 'react';
import { kapitler, t, type RumTrin, type Sted, type Trin } from '../../content';
import { naesteKapitel } from '../../engine/kapitel';
import { LaesOpKnap } from '../../components/Tekst';
import { spilEffekt } from '../../lyd/effekter';

type Props = {
  sted: Sted;
  kapitelNr: number;
  trin: Trin | null | undefined;
  slut: boolean;
  rum: RumTrin | null;
  udflugt: boolean;
  /** Platformbane: Æseløre tilbyder hjælp efter nogle fald. */
  hjaelp: boolean;
  /** Der er et trin, et vindue eller en dialog i gang, så oplæsning og knapper venter. */
  travl: { trin: boolean; andetVindue: boolean; rumVindue: boolean };
  laast: boolean;
  /** Det, hovedpersonen står ved og kan undersøge lige nu, og dets navn. */
  naer: string | null;
  objektNavn: string | undefined;
  /** Navnet på det, opgaven handler om. */
  aktivtNavn: string | undefined;
  /** Ting fundet i et escape room (navnene). */
  rumTing: string[];
  antalTing: number;
  taskeKnap: RefObject<HTMLButtonElement | null>;
  taskePuls: boolean;
  uhyggeBesked: string;
  onUndersoeg: (id: string) => void;
  onBaerOver: () => void;
  onTilbage: () => void;
  onKapitelSlut: () => void;
  onTaske: () => void;
  onMenu: () => void;
};

/**
 * Panelet ved siden af spillet: stedets navn, hvad der skal ske nu, og knapperne Taske og Menu.
 * Delt ud af Verden.tsx 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function VerdenPanel(p: Props) {
  const { sted, trin, rum, naer, objektNavn, laast } = p;
  const tryk = naer && objektNavn && !laast ? t('verden.tryk.enter', { navn: objektNavn }) : null;
  return (
    <aside className="panel hud">
      <p className="sted-navn">{t('verden.sted', { sted: sted.navn })}</p>
      {p.udflugt && sted.udflugt && (
        <>
          <p className="naeste-overskrift">{t('verden.naeste')}</p>
          <p className="naeste-tekst">{sted.udflugt.opgavetekst}</p>
          <p className="lille-tekst">{t('bane.styring')}</p>
          <button type="button" className="knap" onClick={p.onTilbage}>
            {t('udflugt.tilbage')}
          </button>
        </>
      )}
      {!p.udflugt && sted.bane && !p.slut && trin?.objekt === 'maal' && (
        <>
          <p className="naeste-overskrift">{t('verden.naeste')}</p>
          <p className="naeste-tekst">{trin?.opgavetekst ?? t('bane.maal')}</p>
          <p className="lille-tekst">{t('bane.styring')}</p>
          {p.hjaelp && (
            <div className="besked besked-info">
              <p>{t('bane.hjaelp.tekst')}</p>
              <button type="button" className="knap knap-primaer" onClick={p.onBaerOver}>
                {t('bane.hjaelp.knap')}
              </button>
            </div>
          )}
        </>
      )}
      {p.udflugt ? null : p.slut ? (
        <>
          <p className="stor-ros">{t('samling.kapitel.slut', { nr: p.kapitelNr })}</p>
          <button type="button" className="knap knap-primaer" onClick={p.onKapitelSlut}>
            {naesteKapitel(kapitler, p.kapitelNr) ? t('samling.naeste', { nr: p.kapitelNr + 1 }) : t('samling.fyrtaarn')}
          </button>
        </>
      ) : rum ? (
        <>
          <p className="naeste-overskrift">{t('verden.naeste')}</p>
          <p className="naeste-tekst">{rum.opgavetekst}</p>
          {rum.opgavetekst && <LaesOpKnap tekst={rum.opgavetekst} figur="fortaeller" auto={!p.travl.trin && !p.travl.andetVindue && !p.travl.rumVindue} ikon />}
          {naer && objektNavn && (
            <button type="button" className="knap knap-primaer hud-handling" disabled={laast} onClick={() => p.onUndersoeg(naer)}>
              {t('verden.undersoeg', { navn: objektNavn })}
            </button>
          )}
          <p className="lille-tekst" aria-live="polite">
            {tryk ?? t('rum.udforsk')}
          </p>
          <div className="taske">
            <p className="naeste-overskrift">{t('rum.taske')}</p>
            {p.rumTing.length === 0 ? (
              <p className="lille-tekst">{t('rum.taske.tom')}</p>
            ) : (
              <ul>
                {p.rumTing.map((navn, i) => (
                  <li key={`${i}-${navn}`}>{navn}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        !sted.bane &&
        trin?.objekt &&
        trin.opgavetekst && (
          <>
            <p className="naeste-overskrift">{t('verden.naeste')}</p>
            <p className="naeste-tekst">{trin.opgavetekst}</p>
            <LaesOpKnap tekst={trin.opgavetekst} figur="fortaeller" auto={!p.travl.trin && !p.travl.andetVindue} ikon />
            {p.aktivtNavn && (
              <button type="button" className="knap knap-primaer hud-handling" disabled={laast} onClick={() => p.onUndersoeg(trin.objekt!)}>
                {t('verden.undersoeg', { navn: p.aktivtNavn })}
              </button>
            )}
            <p className="lille-tekst" aria-live="polite">
              {tryk ?? ''}
            </p>
          </>
        )
      )}
      {/* Fuld skærm (Henrik, 8. november 2026): taske og menu står som små knapper i hjørnet over spillet. */}
      <div className="hud-knapper">
        <button
          type="button"
          ref={p.taskeKnap}
          className={`knap${p.taskePuls ? ' taske-puls' : ''}`}
          onClick={() => {
            spilEffekt('taske');
            p.onTaske();
          }}
          disabled={p.travl.trin || p.travl.rumVindue}
        >
          {t('taske.knap')} ({p.antalTing})
        </button>
        <button type="button" className="knap" onClick={p.onMenu}>
          <span aria-hidden="true">☰ </span>
          {t('verden.menu')}
        </button>
      </div>
      <p className="sr-only" aria-live="assertive">
        {p.uhyggeBesked}
      </p>
    </aside>
  );
}
