import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hentKapitel, t, type RumFund, type RumTrin, type Trin } from '../content';
import { erFaerdighed } from '../engine/faerdigheder';
import type { GemtSpil, Indstillinger } from '../engine/gem';
import { afslutTrin, aktueltSted, aktueltTrin, kapitelSlut } from '../engine/kapitel';
import { registrerSvar, type Haendelse } from '../engine/tilpasning';
import { PhaserVerden } from '../game/PhaserVerden';
import { avatarDataUri } from '../ui/avatarSvg';
import { DialogBoks } from '../ui/DialogBoks';
import { saetMusikOverride } from '../ui/musik/afspiller';
import { FundVindue, KodeVindue, ManglerVindue } from '../ui/RumVindue';
import { LaesOpKnap } from '../ui/Tekst';
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
  const [hint, setHint] = useState<{ x: number; y: number } | null>(null);
  const [forskraek, setForskraek] = useState(0);
  /** Den, der taler i dialogen lige nu. Kameraet zoomer ind på dem. */
  const [taler, setTaler] = useState<string | null>(null);
  const [uhyggeBesked, setUhyggeBesked] = useState('');
  const fpsRef = useRef<() => number>(() => 0);
  const gaaTilRef = useRef<((id: string) => void) | null>(null);
  // Til test (kun med ?hop): lad gennemspilningen gå hen til et objekt og undersøge det.
  useEffect(() => {
    if (typeof location === 'undefined' || !new URLSearchParams(location.search).has('hop')) return;
    (window as unknown as { __pennedal?: unknown }).__pennedal = { gaaTil: (id: string) => gaaTilRef.current?.(id) };
  }, []);
  const baneRef = useRef<{ styr: (knap: 'venstre' | 'hoejre' | 'hop', nede: boolean) => void; baerOver: () => void } | null>(null);
  /** Platformbane: Æseløre tilbyder hjælp efter nogle fald. */
  const [hjaelp, setHjaelp] = useState(false);
  const spilRef = useRef(spil);
  spilRef.current = spil;

  // Escape room: alt i rummet kan undersøges, og fundene kommer i tasken (gemt i spil.valg).
  const rum = trin?.type === 'rum' ? trin : null;
  const [rumVindue, setRumVindue] = useState<{ type: 'fund'; fund: RumFund } | { type: 'mangler' } | { type: 'kode' } | null>(null);
  const aktive = rum && !aktivtTrin ? [...rum.fund.map((f) => f.objekt), rum.laas.objekt] : undefined;
  const taske = Object.keys(spil.valg)
    .filter((k) => k.startsWith('taske.'))
    .map((k) => k.slice(6));

  // Platformbane: er målet (skift-trinnet med objektet maal på stedet) allerede klaret?
  const maalNr = kapitel.trin.findIndex((x) => x.sted === stedId && x.objekt === 'maal');
  const baneKlaret = !!sted.bane && maalNr >= 0 && spil.trin > maalNr;
  const aktivtObjekt = trin && !aktivtTrin ? trin.objekt : null;
  const objektNavn = sted.objekter.find((o) => o.id === (rum ? naer : aktivtObjekt))?.navn;
  // Objekter, der er forsvundet, fordi kapitlet er nået forbi deres skjulFra-trin.
  const skjulteObjekter = sted.objekter
    .filter((o) => {
      // visFra: skjult, indtil kapitlet når trinnet. skjulFra: væk fra trinnet og frem.
      if (o.visFra) {
        const nr = kapitel.trin.findIndex((t) => t.id === o.visFra);
        if (nr >= 0 && spil.trin < nr) return true;
      }
      if (!o.skjulFra) return false;
      const nr = kapitel.trin.findIndex((t) => t.id === o.skjulFra);
      return nr >= 0 && spil.trin >= nr;
    })
    .map((o) => o.id);
  // Æseløre er skjult, indtil eleven har fundet ham (kapitlets fuglFra-trin).
  const fuglNr = kapitel.fuglFra ? kapitel.trin.findIndex((t) => t.id === kapitel.fuglFra) : -1;
  const skjulte = fuglNr >= 0 && spil.trin < fuglNr ? [...skjulteObjekter, 'aeseloere'] : skjulteObjekter;

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

  // Trin uden objekt starter af sig selv. Et escape room er ikke et vindue, det er hele stedet.
  useEffect(() => {
    if (trin && trin.objekt === null && trin.type !== 'rum' && !aktivtTrin && !andetVindueAabent) startTrin(trin);
  }, [trin, aktivtTrin, andetVindueAabent, startTrin]);

  // Mørket: når Den Ufærdige er til stede, forsvinder farverne, og hans musik tager over.
  const moerke = !!aktivtTrin?.moerke;
  useEffect(() => {
    saetMusikOverride(moerke ? 'ufaerdige' : null);
    return () => saetMusikOverride(null);
  }, [moerke]);

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

  function rumHandling(r: RumTrin, id: string) {
    const fund = r.fund.find((f) => f.objekt === id);
    if (fund) {
      if (fund.ting && !taske.includes(fund.ting)) {
        const s = spilRef.current;
        opdater({ ...s, valg: { ...s.valg, [`taske.${fund.ting}`]: fund.tingNavn ?? fund.ting } });
      }
      setRumVindue({ type: 'fund', fund });
      return;
    }
    if (id === r.laas.objekt) setRumVindue(r.laas.kraever.every((k) => taske.includes(k)) ? { type: 'kode' } : { type: 'mangler' });
  }

  function rumAabnet() {
    const r = rum;
    setRumVindue(null);
    if (!r) return;
    opdater(afslutTrin(spilRef.current, kapitel));
    if (r.slutDel) onDelSlut(r.slutDel);
  }

  function interaktion(id: string) {
    if (rum && !aktivtTrin && !rumVindue && !andetVindueAabent && aktive?.includes(id)) {
      rumHandling(rum, id);
      return;
    }
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
  const laast = !!aktivtTrin || andetVindueAabent || !!rumVindue;

  return (
    <main className={`verden${moerke ? ' moerke' : ''}${moerke && indstillinger.mindreUhygge ? ' moerke-mild' : ''}`}>
      <div className="spilflade-ramme">
        <PhaserVerden
          stedId={stedId}
          sted={sted}
          aktiv={aktivtObjekt}
          aktive={aktive}
          baneKlaret={baneKlaret}
          avatarUri={avatarUri}
          avatar={spil.avatar}
          skjulte={skjulte}
          laast={laast}
          mindreUhygge={indstillinger.mindreUhygge}
          forskraekSignal={forskraek}
          taler={taler}
          kroge={{ onInteraktion: interaktion, onNaer: setNaer, onHint: setHint, onHjaelp: setHjaelp }}
          label={t('verden.sted', { sted: sted.navn })}
          fpsRef={fpsRef}
          baneRef={baneRef}
          gaaTilRef={gaaTilRef}
        />
        {sted.bane && !laast && (
          // Knapper på skærmen til platformbanen (touch og mus). Tastatur: pilene, A og D, og mellemrum eller W for at hoppe.
          <div className="bane-knapper">
            {(['venstre', 'hoejre', 'hop'] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={`knap bane-knap bane-knap-${k}`}
                tabIndex={-1}
                aria-label={t(`bane.knap.${k}`)}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture?.(e.pointerId);
                  baneRef.current?.styr(k, true);
                }}
                onPointerUp={() => baneRef.current?.styr(k, false)}
                onPointerCancel={() => baneRef.current?.styr(k, false)}
                onLostPointerCapture={() => baneRef.current?.styr(k, false)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <span aria-hidden="true">{k === 'venstre' ? '◀' : k === 'hoejre' ? '▶' : '▲'}</span>
              </button>
            ))}
          </div>
        )}
        {hint && naer && objektNavn && !laast && (
          // Lille hint over tingen: tryk E. På en touchskærm kan man trykke på hintet.
          <button
            type="button"
            className="tast-hint"
            tabIndex={-1}
            style={{ left: `${hint.x}%`, top: `${hint.y}%` }}
            aria-label={t('verden.undersoeg', { navn: objektNavn })}
            onClick={() => interaktion(naer)}
          >
            <kbd>{t('verden.tast.e')}</kbd>
          </button>
        )}
        <span className="pladsholder-maerke">{t('verden.pladsholder')}</span>
        {DEBUG && <Ydelse fps={() => fpsRef.current()} />}
      </div>

      <aside className="panel">
        <p className="sted-navn">{t('verden.sted', { sted: sted.navn })}</p>
        {sted.bane && !slut && trin?.objekt === 'maal' && (
          <>
            <p className="naeste-overskrift">{t('verden.naeste')}</p>
            <p className="naeste-tekst">{trin?.opgavetekst ?? t('bane.maal')}</p>
            <p className="lille-tekst">{t('bane.styring')}</p>
            {hjaelp && (
              <div className="besked besked-info">
                <p>{t('bane.hjaelp.tekst')}</p>
                <button type="button" className="knap knap-primaer" onClick={() => baneRef.current?.baerOver()}>
                  {t('bane.hjaelp.knap')}
                </button>
              </div>
            )}
          </>
        )}
        {slut ? (
          <>
            <p className="stor-ros">{t('samling.kapitel.slut', { nr: spil.kapitel })}</p>
            <button type="button" className="knap knap-primaer" onClick={onKapitelSlut}>
              {t('samling.fyrtaarn')}
            </button>
          </>
        ) : rum ? (
          <>
            <p className="naeste-overskrift">{t('verden.naeste')}</p>
            <p className="naeste-tekst">{rum.opgavetekst}</p>
            {rum.opgavetekst && <LaesOpKnap tekst={rum.opgavetekst} figur="fortaeller" auto={!aktivtTrin && !andetVindueAabent && !rumVindue} />}
            {naer && objektNavn && (
              <button type="button" className="knap knap-primaer" disabled={laast} onClick={() => interaktion(naer)}>
                {t('verden.undersoeg', { navn: objektNavn })}
              </button>
            )}
            <p className="lille-tekst" aria-live="polite">
              {naer && objektNavn && !laast ? t('verden.tryk.enter', { navn: objektNavn }) : t('rum.udforsk')}
            </p>
            <div className="taske">
              <p className="naeste-overskrift">{t('rum.taske')}</p>
              {taske.length === 0 ? (
                <p className="lille-tekst">{t('rum.taske.tom')}</p>
              ) : (
                <ul>
                  {taske.map((k) => (
                    <li key={k}>{spil.valg[`taske.${k}`]}</li>
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
              <LaesOpKnap tekst={trin.opgavetekst} figur="fortaeller" auto={!aktivtTrin && !andetVindueAabent} />
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

      {rum && rumVindue?.type === 'fund' && (
        <FundVindue
          titel={sted.objekter.find((o) => o.id === rumVindue.fund.objekt)?.navn ?? ''}
          fund={rumVindue.fund}
          onLuk={() => setRumVindue(null)}
        />
      )}
      {rum && rumVindue?.type === 'mangler' && (
        <ManglerVindue titel={sted.objekter.find((o) => o.id === rum.laas.objekt)?.navn ?? ''} tekst={rum.laas.mangler} onLuk={() => setRumVindue(null)} />
      )}
      {rum && rumVindue?.type === 'kode' && (
        <KodeVindue
          titel={sted.objekter.find((o) => o.id === rum.laas.objekt)?.navn ?? ''}
          laas={rum.laas}
          onSvar={(r, f) => onSvar(rum.faerdighed, r, f)}
          onAaben={rumAabnet}
          onLuk={() => setRumVindue(null)}
        />
      )}
      {aktivtTrin?.type === 'dialog' && <DialogBoks replikker={aktivtTrin.replikker} onFaerdig={afslut} onTaler={setTaler} />}
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
