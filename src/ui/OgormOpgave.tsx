import { useMemo, useState } from 'react';
import { t, type OgTekst } from '../content';
import { tegnkortTilLerred } from '../game/pixel/lerred';
import { ORM_HALE, ORM_HOVED } from '../game/pixel/ogorm';
import type { Tegnkort } from '../game/pixel/sprites';
import { klip, klippetFaerdig, parseOgTekst, stykker, tomOgTilstand, visOrd, visTekst, type OgTilstand } from '../mechanics/ogorm';
import type { OpgaveApi } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

/**
 * Og-ormen: klip ormen i stykker (Henrik, 8. november 2026). Ormen er én lang sætning, og hvert "og" er et led.
 * Eleven klipper med saksen, hvor én tanke slutter, og en ny begynder. Det store begyndelsesbogstav kommer selv,
 * med en forklaring. Et "og", der binder to ting sammen, kan ikke klippes: så forklares reglen med et eksempel (krav 6).
 */
const billeder = new Map<string, string>();
function uri(navn: string, kort: Tegnkort): string {
  if (!billeder.has(navn)) {
    try {
      billeder.set(navn, tegnkortTilLerred(kort).toDataURL('image/png'));
    } catch {
      billeder.set(navn, '');
    }
  }
  return billeder.get(navn) ?? '';
}

export function OgormOpgave({ tekst, api }: { tekst: OgTekst; api: OpgaveApi }) {
  const tokens = useMemo(() => parseOgTekst(tekst.tekst), [tekst]);
  const [tilstand, setTilstand] = useState<OgTilstand>(tomOgTilstand);
  const [nytStort, setNytStort] = useState<number | null>(null);
  const [av, setAv] = useState<{ i: number; nr: number } | null>(null);
  const dele = stykker(tokens, tilstand);
  const tilbage = tokens.filter((x, i) => x.ogType === 's' && !tilstand.punktummer.includes(i)).length;
  const stykkeTekst = (s: number[]) => visTekst(tokens.filter((_, i) => s.includes(i)), { punktummer: [], skiftet: [] }).replace(/^./, (f) => f);

  function klipVed(i: number) {
    if (api.laast) return;
    const r = klip(tokens, tilstand, i);
    if (!r.ok) {
      setAv((x) => ({ i, nr: (x?.nr ?? 0) + 1 }));
      api.tjek(false, t('ogorm.fejl.bliv'));
      return;
    }
    setAv(null);
    setTilstand(r.tilstand);
    setNytStort(r.stort);
    if (klippetFaerdig(tokens, r.tilstand)) api.tjek(true);
  }

  const hoved = uri('orm-hoved', ORM_HOVED);
  const hale = uri('orm-hale', ORM_HALE);

  return (
    <div className="ogorm ogorm-klip" data-tekst-id={tekst.id}>
      <p className="instruks">{t('ogorm.klip.instruks')}</p>
      <p className="lille-tekst">{t('ogorm.pas.paa')}</p>
      <LaesOpKnap auto dele={(['ogorm.klip.instruks', 'ogorm.pas.paa'] as const).map((id) => ({ tekst: t(id), figur: 'fortaeller' as const }))} />

      <div className="orm-bane">
        {dele.map((stykke, si) => (
          <div className={`orm-stykke${dele.length > 1 ? ' delt' : ''}`} key={stykke[0]} style={{ animationDelay: `${si * 0.15}s` }}>
            {hale && <img className="orm-hale" src={hale} alt="" aria-hidden="true" />}
            <div className="orm-krop">
              {stykke.map((i) => {
                const tok = tokens[i];
                if (tok.erOg)
                  return (
                    <button
                      key={`${i}-${av?.i === i ? av.nr : 0}`}
                      type="button"
                      data-token={i}
                      className={`orm-led${av?.i === i ? ' av' : ''}`}
                      aria-label={t('ogorm.klip.her')}
                      disabled={api.laast}
                      onClick={() => klipVed(i)}
                    >
                      <span className="orm-saks" aria-hidden="true" />
                      og
                    </button>
                  );
                return (
                  <span key={i} className={`orm-ord${i === nytStort ? ' nyt-stort' : ''}`}>
                    {visOrd(tokens, tilstand, i)}
                    {tok.tegn}
                  </span>
                );
              })}
              {si < dele.length - 1 && <span className="orm-punktum">.</span>}
            </div>
            {hoved && <img className="orm-hoved" src={hoved} alt="" aria-hidden="true" />}
            <LaesOpKnap tekst={stykkeTekst(stykke)} figur="fortaeller" ikon />
          </div>
        ))}
      </div>

      <div aria-live="polite">
        {nytStort !== null && !api.loest && (
          <p className="ogorm-ny">{t('ogorm.klip.stort', { ord: visOrd(tokens, tilstand, nytStort) })}</p>
        )}
        {!api.loest && tilbage > 0 && <p className="lille-tekst">{tilbage === 1 ? t('ogorm.klip.tilbage.et') : t('ogorm.klip.tilbage', { antal: tilbage })}</p>}
        {api.loest && <p className="facit">{visTekst(tokens, tilstand)}</p>}
      </div>
    </div>
  );
}
