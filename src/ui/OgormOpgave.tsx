import { useMemo, useState } from 'react';
import { t, type OgTekst } from '../content';
import {
  antalLed,
  parseOgTekst,
  tjekOgorm,
  tomOgTilstand,
  visOrd,
  visTekst,
  type OgFejl,
  type OgTilstand,
} from '../mechanics/ogorm';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

const FEJLTEKST: Record<OgFejl, Parameters<typeof t>[0]> = {
  mangler: 'ogorm.fejl.mangler',
  bliv: 'ogorm.fejl.bliv',
  stort: 'ogorm.fejl.stort',
  lille: 'ogorm.fejl.lille',
  navn: 'ogorm.fejl.navn',
};

export function OgormOpgave({ tekst, api }: { tekst: OgTekst; api: OpgaveApi }) {
  const tokens = useMemo(() => parseOgTekst(tekst.tekst), [tekst]);
  const [tilstand, setTilstand] = useState<OgTilstand>(tomOgTilstand);
  const [fejlIndeks, setFejlIndeks] = useState<number | null>(null);
  const led = antalLed(tokens, tilstand);

  function skiftPunktum(i: number) {
    setFejlIndeks(null);
    const p = tilstand.punktummer.includes(i)
      ? tilstand.punktummer.filter((x) => x !== i)
      : [...tilstand.punktummer, i];
    setTilstand({ ...tilstand, punktummer: p });
  }

  function skiftStort(i: number) {
    setFejlIndeks(null);
    const s = tilstand.skiftet.includes(i) ? tilstand.skiftet.filter((x) => x !== i) : [...tilstand.skiftet, i];
    setTilstand({ ...tilstand, skiftet: s });
  }

  function tjek() {
    const r = tjekOgorm(tokens, tilstand);
    if (r.ok) {
      setFejlIndeks(null);
      api.tjek(true);
    } else {
      setFejlIndeks(r.indeks);
      api.tjek(false, t(FEJLTEKST[r.fejl]));
    }
  }

  return (
    <div className="ogorm" data-tekst-id={tekst.id}>
      <p className="instruks">{t('ogorm.instruks')}</p>
      <LaesOpKnap auto tekst={t('ogorm.instruks')} figur="fortaeller" />
      <div className="orm" aria-hidden="true">
        <span className="orm-hoved">🐛</span>
        {Array.from({ length: led }, (_, i) => (
          <span key={i} className="orm-led" />
        ))}
      </div>
      <p className="lille-tekst">{t('ogorm.laengde', { antal: led })}</p>
      <div className="skilt" aria-label={visTekst(tokens, tilstand)}>
        {tokens.map((tok, i) => {
          if (tok.erOg) {
            const erPunktum = tilstand.punktummer.includes(i);
            return (
              <button
                key={i}
                type="button"
                data-token={i}
                className={`token ${erPunktum ? 'token-punktum' : 'token-og'} ${fejlIndeks === i ? 'token-fejl' : ''}`}
                aria-label={erPunktum ? `${t('ogorm.punktum')}. ${t('ogorm.fortryd')}` : 'og'}
                disabled={api.laast}
                onClick={() => skiftPunktum(i)}
              >
                {erPunktum ? '.' : 'og'}
              </button>
            );
          }
          return (
            <span key={i} className="token-gruppe">
              <button
                type="button"
                data-token={i}
                className={`token token-ord ${fejlIndeks === i ? 'token-fejl' : ''}`}
                disabled={api.laast}
                onClick={() => skiftStort(i)}
              >
                {visOrd(tokens, tilstand, i)}
              </button>
              {tok.tegn && <span className="token-tegn">{tok.tegn}</span>}
            </span>
          );
        })}
      </div>
      <LaesOpKnap tekst={visTekst(tokens, tilstand)} />
      {!api.loest && (
        <div className="knaprad">
          <button type="button" className="knap knap-primaer" disabled={api.laast} onClick={tjek}>
            {t('opgave.tjek')}
          </button>
        </div>
      )}
      {api.loest && <p className="facit">{visTekst(tokens, tilstand)}</p>}
    </div>
  );
}
