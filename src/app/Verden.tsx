import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hentKapitel, t, type Trin } from '../content';
import { erFaerdighed } from '../engine/faerdigheder';
import type { GemtSpil, Indstillinger } from '../engine/gem';
import { afslutTrin, aktueltSted, aktueltTrin, kapitelSlut } from '../engine/kapitel';
import { registrerSvar, type Haendelse } from '../engine/tilpasning';
import { PhaserVerden } from '../game/PhaserVerden';
import { avatarDataUri } from '../ui/avatarSvg';
import { DialogBoks } from '../ui/DialogBoks';
import { Ydelse } from '../ui/Ydelse';
import { BevisjagtVindue, OpgaveVindue } from './OpgaveVindue';

type Props = {
  spil: GemtSpil;
  opdater: (s: GemtSpil) => void;
  indstillinger: Indstillinger;
  andetVindueAabent: boolean;
  onMenu: () => void;
  onDelSlut: (del: number) => void;
  onKapitelSlut: () => void;
};

const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

export function Verden({ spil, opdater, indstillinger, andetVindueAabent, onMenu, onDelSlut, onKapitelSlut }: Props) {
  const kapitel = hentKapitel(spil.kapitel)!;
  const trin = aktueltTrin(spil, kapitel);
  const slut = kapitelSlut(spil, kapitel);
  const stedId = aktueltSted(spil, kapitel);
  const sted = kapitel.steder[stedId];
  const [aktivtTrin, setAktivtTrin] = useState<Trin | null>(null);
  const [naer, setNaer] = useState<string | null>(null);
  const [forskraek, setForskraek] = useState(0);
  const [uhyggeBesked, setUhyggeBesked] = useState('');
  const fpsRef = useRef<() => number>(() => 0);
  const spilRef = useRef(spil);
  spilRef.current = spil;

  const aktivtObjekt = trin && !aktivtTrin ? trin.objekt : null;
  const objektNavn = sted.objekter.find((o) => o.id === aktivtObjekt)?.navn;
  // Objekter, der er forsvundet, fordi kapitlet er nået forbi deres skjulFra-trin.
  const skjulte = sted.objekter
    .filter((o) => {
      if (!o.skjulFra) return false;
      const nr = kapitel.trin.findIndex((t) => t.id === o.skjulFra);
      return nr >= 0 && spil.trin >= nr;
    })
    .map((o) => o.id);

  const startTrin = useCallback(
    (t: Trin) => {
      if (t.type === 'skift') {
        opdater(afslutTrin(spilRef.current, kapitel));
        return;
      }
      if (t.uhygge && !indstillinger.mindreUhygge) setForskraek((n) => n + 1);
      setAktivtTrin(t);
    },
    [kapitel, opdater, indstillinger.mindreUhygge],
  );

  // Trin uden objekt starter af sig selv.
  useEffect(() => {
    if (trin && trin.objekt === null && !aktivtTrin && !andetVindueAabent) startTrin(trin);
  }, [trin, aktivtTrin, andetVindueAabent, startTrin]);

  useEffect(() => {
    if (forskraek > 0 && !indstillinger.mindreUhygge) setUhyggeBesked(t('uhygge.ryst'));
  }, [forskraek, indstillinger.mindreUhygge]);

  function afslut() {
    const t0 = aktivtTrin;
    setAktivtTrin(null);
    if (!t0) return;
    const nyt = afslutTrin(spilRef.current, kapitel);
    opdater(nyt);
    if (t0.slutDel) onDelSlut(t0.slutDel);
    if (t0.slutKapitel) onKapitelSlut();
  }

  function interaktion(id: string) {
    if (aktivtTrin || andetVindueAabent || !trin || trin.objekt !== id) return;
    startTrin(trin);
  }

  function onSvar(faerdighed: string, rigtigt: boolean, forsoeg: number): Haendelse {
    if (!erFaerdighed(faerdighed)) return null;
    const s = spilRef.current;
    const r = registrerSvar(s.faerdigheder[faerdighed], { rigtigt, forsoeg });
    opdater({ ...s, faerdigheder: { ...s.faerdigheder, [faerdighed]: r.status } });
    return r.haendelse;
  }

  function onLoest(antal: number, info?: { ord?: string; historie?: boolean }) {
    const s = spilRef.current;
    const samling = info?.ord && !s.samling.includes(info.ord) ? [...s.samling, info.ord] : s.samling;
    const nyt: GemtSpil = {
      ...s,
      samling,
      trinFremskridt: s.trinFremskridt + 1,
      faerdigeHistorier: s.faerdigeHistorier + (info?.historie ? 1 : 0),
    };
    if (nyt.trinFremskridt >= antal) {
      spilRef.current = nyt;
      afslut();
      return;
    }
    opdater(nyt);
  }

  const avatarUri = useMemo(() => avatarDataUri(spil.avatar), [spil.avatar]);
  const laast = !!aktivtTrin || andetVindueAabent;

  return (
    <main className="verden">
      <div className="spilflade-ramme">
        <PhaserVerden
          stedId={stedId}
          sted={sted}
          aktiv={aktivtObjekt}
          avatarUri={avatarUri}
          avatar={spil.avatar}
          skjulte={skjulte}
          laast={laast}
          mindreUhygge={indstillinger.mindreUhygge}
          forskraekSignal={forskraek}
          kroge={{ onInteraktion: interaktion, onNaer: setNaer }}
          label={t('verden.sted', { sted: sted.navn })}
          fpsRef={fpsRef}
        />
        <span className="pladsholder-maerke">{t('verden.pladsholder')}</span>
        {DEBUG && <Ydelse fps={() => fpsRef.current()} />}
      </div>

      <aside className="panel">
        <p className="sted-navn">{t('verden.sted', { sted: sted.navn })}</p>
        {slut ? (
          <>
            <p className="stor-ros">{t('samling.kapitel.slut')}</p>
            <button type="button" className="knap knap-primaer" onClick={onKapitelSlut}>
              {t('samling.fyrtaarn')}
            </button>
          </>
        ) : (
          trin?.objekt &&
          trin.opgavetekst && (
            <>
              <p className="naeste-overskrift">{t('verden.naeste')}</p>
              <p className="naeste-tekst">{trin.opgavetekst}</p>
              {objektNavn && (
                <button
                  type="button"
                  className="knap knap-primaer"
                  disabled={laast}
                  onClick={() => interaktion(trin.objekt!)}
                >
                  {t('verden.undersoeg', { navn: objektNavn })}
                </button>
              )}
              <p className="lille-tekst" aria-live="polite">
                {naer && objektNavn && !laast ? t('verden.tryk.enter', { navn: objektNavn }) : ''}
              </p>
            </>
          )
        )}
        <p className="lille-tekst">{t('verden.styring')}</p>
        <button type="button" className="knap" onClick={onMenu}>
          <span aria-hidden="true">☰ </span>
          {t('verden.menu')}
        </button>
        <p className="sr-only" aria-live="assertive">
          {uhyggeBesked}
        </p>
      </aside>

      {aktivtTrin?.type === 'dialog' && <DialogBoks replikker={aktivtTrin.replikker} onFaerdig={afslut} />}
      {aktivtTrin?.type === 'opgave' && (
        <OpgaveVindue
          trin={aktivtTrin}
          niveau={spil.faerdigheder[aktivtTrin.faerdighed as keyof GemtSpil['faerdigheder']]?.niveau ?? 1}
          loeste={spil.trinFremskridt}
          onSvar={(r, f) => onSvar(aktivtTrin.faerdighed, r, f)}
          onLoest={(info) => onLoest(aktivtTrin.antal, info)}
          onPause={() => setAktivtTrin(null)}
        />
      )}
      {aktivtTrin?.type === 'bevisjagt' && (
        <BevisjagtVindue
          trin={aktivtTrin}
          loeste={spil.trinFremskridt}
          onSvar={(r, f) => onSvar(aktivtTrin.faerdighed, r, f)}
          onLoest={() => onLoest(aktivtTrin.spoergsmaal.length)}
          onPause={() => setAktivtTrin(null)}
        />
      )}
    </main>
  );
}
