import { useMemo, useRef, useState } from 'react';
import { avatarnavn, kapitler, t, type KampTrin, type Sted } from '../content';
import {
  erBedre,
  faarGave,
  fejlPris,
  gaverFor,
  holdFor,
  laesKode,
  lavKode,
  nyTur,
  ordstenFaerdighed,
  rekordkode,
  rumFor,
  rumKlaret,
  svar,
  tilfaeldigtFroe,
  vaelgGave,
  type GaveId,
  type OrdstenArt,
  type Rekord,
  type Rum,
  type Tur,
} from '../engine/dybet';
import { erFaerdighed } from '../engine/faerdigheder';
import type { GemtSpil } from '../engine/gem';
import { taskeFor } from '../engine/taske';
import { registrerSvar, type Haendelse } from '../engine/tilpasning';
import { spilEffekt } from '../ui/effekter';
import { KampVindue } from '../ui/KampVindue';
import { OrdOpgaveVindue } from '../ui/OrdOpgaveVindue';
import { LaesOpKnap } from '../ui/Tekst';
import { useApp } from '../ui/Kontekst';
import { PhaserVerden, type BaneStyring } from '../game/PhaserVerden';
import { skalaFraAdresse } from '../game/KortScene';

/** Rekorderne gemmes kun i denne browser (krav 4). */
const NOEGLE = 'pennedal.dybet.v1';
type Gemt = { bedste: Rekord | null; perKode: Record<string, Rekord> };
function hentRekorder(): Gemt {
  try {
    const d = JSON.parse(localStorage.getItem(NOEGLE) ?? 'null');
    if (d && typeof d === 'object') return { bedste: d.bedste ?? null, perKode: d.perKode ?? {} };
  } catch {
    // Ingen eller ødelagte data: start forfra.
  }
  return { bedste: null, perKode: {} };
}
function gemRekord(r: Rekord): { ny: boolean; nyKode: boolean } {
  const g = hentRekorder();
  const ny = erBedre(r, g.bedste);
  const nyKode = erBedre(r, g.perKode[r.froe] ?? null);
  if (ny) g.bedste = r;
  if (nyKode) g.perKode[r.froe] = r;
  try {
    localStorage.setItem(NOEGLE, JSON.stringify(g));
  } catch {
    // Kan ikke gemme (privat vindue): rekorden vises stadig.
  }
  return { ny, nyKode };
}

/** Blækdybet er åbent, når det sidste kapitel er gennemført. */
export function dybetAabent(spil: GemtSpil | null): boolean {
  if (!spil) return false;
  const sidste = Math.max(...kapitler.map((k) => k.kapitel));
  const k = kapitler.find((x) => x.kapitel === sidste)!;
  return spil.kapitel > sidste || (spil.kapitel === sidste && spil.trin >= k.trin.length);
}

/** Stedet fra spillet, som en platformbane i dybet låner. */
function baneSted(id: string): Sted {
  for (const k of kapitler) if (k.steder[id]) return k.steder[id];
  throw new Error(`Ukendt bane: ${id}`);
}
/** Slags ordsten på banen (som i spillet). */
const baneArt = (id: string): OrdstenArt => (baneSted(id).ordsten as OrdstenArt | undefined) ?? 'synonym';

/** Introen til en ordsten (som i spillet). */
function ordstenIntro(art: OrdstenArt): string {
  if (art === 'synonym') return t('ordsten.intro');
  return t(`ordsten.${art}.intro`);
}

/** Rummet som et trin, kampvinduet forstår. */
function kampTrin(rum: Extract<Rum, { type: 'kamp' }>, vims: boolean): KampTrin {
  return {
    id: 'dybet-kamp',
    type: 'kamp',
    del: 1,
    sted: 'dybet',
    objekt: null,
    vaesen: rum.vaesner[0],
    vaesner: rum.vaesner,
    faerdighed: rum.faerdighed,
    antal: rum.antal,
    hold: vims ? ['aeseloere', 'vims'] : ['aeseloere'],
    slag: rum.slag,
  };
}

type Fase = { type: 'start' } | { type: 'rum'; inde: boolean; nr: number } | { type: 'gave'; valg: GaveId[] } | { type: 'slut'; ny: boolean };

/**
 * Blækdybet (Henrik, 13. november 2026). En tur er en række rum. Rekorden er dybden og antal rigtige, aldrig tid.
 * Samme udfordringskode giver samme tur for alle i klassen. Opgaverne følger elevens eget niveau.
 */
export function Blaekdybet({ spil, opdater, onTilbage }: { spil: GemtSpil; opdater: (s: GemtSpil) => void; onTilbage: () => void }) {
  const [fase, setFase] = useState<Fase>({ type: 'start' });
  const [tur, setTur] = useState<Tur | null>(null);
  const [kodeFelt, setKodeFelt] = useState('');
  const [kodeFejl, setKodeFejl] = useState(false);
  const { indstillinger } = useApp();
  const baneRef = useRef<BaneStyring | null>(null);
  /** Platformbane: nummeret på den ordsten, eleven står ved (null, når ingen opgave er åben). */
  const [baneSten, setBaneSten] = useState<number | null>(null);
  const skala = skalaFraAdresse() ?? (indstillinger.grafik === 'hurtig' || navigator.webdriver ? 1 : 2);
  const rekorder = useMemo(hentRekorder, [fase.type]);
  const taske = useMemo(() => taskeFor(spil, kapitler), [spil]);
  const rum = tur ? rumFor(tur.froe, tur.dybde) : null;
  // Dybet bliver sværere jo længere ned: elevens eget niveau, men aldrig under rummets mindste niveau.
  const niveauFor = (f: string) => Math.max(erFaerdighed(f) ? spil.faerdigheder[f].niveau : 1, rum && rum.type !== 'hvile' ? rum.minNiveau : 1);

  function start(froe: number) {
    setTur(nyTur(froe));
    setFase({ type: 'rum', inde: false, nr: 0 });
  }

  function slutTur(t2: Tur) {
    const { ny } = gemRekord({
      froe: t2.froe,
      dybde: t2.dybde,
      rigtige: t2.rigtige,
    });
    setFase({ type: 'slut', ny });
  }

  /** Et svar i et rum: tilpasningen opdateres som i spillet, og blækket regnes. */
  function onSvar(faerdighed: string, rigtigt: boolean, forsoeg: number): Haendelse {
    let haendelse: Haendelse = null;
    if (erFaerdighed(faerdighed)) {
      const r = registrerSvar(spil.faerdigheder[faerdighed], {
        rigtigt,
        forsoeg,
      });
      haendelse = r.haendelse;
      opdater({
        ...spil,
        faerdigheder: { ...spil.faerdigheder, [faerdighed]: r.status },
      });
    }
    setTur((t1) => {
      if (!t1) return t1;
      const t2 = svar(t1, rigtigt);
      if (t2.slut && !t1.slut) window.setTimeout(() => slutTur(t2), 1200);
      return t2;
    });
    return haendelse;
  }

  function klaret() {
    if (!tur || !rum || tur.slut) return;
    const t2 = rumKlaret(tur, rum);
    setTur(t2);
    spilEffekt('skaar');
    if (faarGave(t2.dybde)) setFase({ type: 'gave', valg: gaverFor(t2.froe, t2.dybde, t2.gaver) });
    else setFase({ type: 'rum', inde: false, nr: (fase.type === 'rum' ? fase.nr : 0) + 1 });
  }

  /** At gå ud af et rum eller tabe en kamp koster en dråbe. Rummet kan prøves igen. */
  function udAfRum() {
    if (!tur || tur.slut) return;
    const t2 = {
      ...tur,
      blaek: tur.blaek - 1,
      stribe: 0,
      slut: tur.blaek - 1 <= 0,
    };
    setTur(t2);
    if (t2.slut) slutTur(t2);
    else
      setFase({
        type: 'rum',
        inde: false,
        nr: (fase.type === 'rum' ? fase.nr : 0) + 1,
      });
  }

  const blaekDraaber = tur && (
    <p className="dybet-blaek" aria-label={t('dybet.blaek', { blaek: tur.blaek, maks: tur.maksBlaek })}>
      {Array.from({ length: tur.maksBlaek }, (_, i) => (
        <span key={i} className={`dybet-draabe${i < tur.blaek ? ' fuld' : ''}`} aria-hidden="true" />
      ))}
    </p>
  );

  const hud = tur && (
    <div className="dybet-hud">
      <p className="dybet-dybde">{t('dybet.dybde', { dybde: tur.dybde })}</p>
      {blaekDraaber}
      <p>{t('dybet.rigtige', { rigtige: tur.rigtige, stribe: tur.stribe })}</p>
      {tur.skjold > 0 && <p className="dybet-skjold">{t('dybet.skjold', { antal: tur.skjold })}</p>}
      <p className="lille-tekst">{t('dybet.kode', { kode: lavKode(tur.froe) })}</p>
      {tur.gaver.length > 0 && (
        <ul className="dybet-gaver-liste" aria-label={t('dybet.dine.gaver')}>
          {tur.gaver.map((g, i) => (
            <li key={i}>{t(`dybet.gave.${g}.navn`)}</li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <main className="dybet">
      {fase.type === 'start' && (
        <section className="dybet-kort">
          <h1 className="dybet-titel">{t('dybet.titel')}</h1>
          <p>{t('dybet.intro')}</p>
          <ul className="dybet-regler">
            <li>{t('dybet.regel.blaek')}</li>
            <li>{t('dybet.regel.gaver')}</li>
            <li>{t('dybet.regel.rekord')}</li>
          </ul>
          <LaesOpKnap
            auto
            dele={(['dybet.intro', 'dybet.regel.blaek', 'dybet.regel.gaver', 'dybet.regel.rekord'] as const).map((id) => ({
              tekst: t(id),
              figur: 'fortaeller' as const,
            }))}
          />
          {rekorder.bedste && (
            <p className="dybet-rekord">
              {t('dybet.din.rekord', {
                dybde: rekorder.bedste.dybde,
                rigtige: rekorder.bedste.rigtige,
              })}
            </p>
          )}
          <div className="knaprad">
            <button type="button" className="knap knap-primaer" autoFocus onClick={() => start(tilfaeldigtFroe())}>
              {t('dybet.ny.tur')}
            </button>
          </div>
          <form
            className="dybet-kodeform"
            onSubmit={(e) => {
              e.preventDefault();
              const froe = laesKode(kodeFelt);
              if (froe === null) setKodeFejl(true);
              else start(froe);
            }}
          >
            <label>
              {t('dybet.kode.felt')}
              <input
                type="text"
                value={kodeFelt}
                inputMode="text"
                autoComplete="off"
                placeholder={t('dybet.kode.eksempel')}
                onChange={(e) => {
                  setKodeFelt(e.target.value);
                  setKodeFejl(false);
                }}
              />
            </label>
            <button type="submit" className="knap">
              {t('dybet.kode.spil')}
            </button>
            {kodeFejl && <p className="besked besked-fejl">{t('dybet.kode.fejl')}</p>}
          </form>
          <button type="button" className="knap knap-diskret" onClick={onTilbage}>
            {t('dybet.tilbage')}
          </button>
        </section>
      )}

      {fase.type === 'rum' && tur && rum && (
        <>
          {!(fase.inde && rum.type === 'bane') && hud}
          {!(fase.inde && rum.type === 'bane') && (
            <section className={`dybet-kort dybet-rum dybet-rum-${rum.type}`}>
              <p className="dybet-rum-nr">{t('dybet.rum.nr', { nr: tur.dybde + 1 })}</p>
              <h2>{t(`dybet.rum.${rum.type}.titel`)}</h2>
              <p>{t(`dybet.rum.${rum.type}.tekst`)}</p>
            {rum.type !== 'hvile' && fejlPris(tur.dybde) > 1 && <p className="besked besked-fejl dybet-tryk">{t('dybet.tryk')}</p>}
              <LaesOpKnap key={`${tur.dybde}-${fase.nr}`} auto tekst={t(`dybet.rum.${rum.type}.tekst`)} figur="fortaeller" />
              <div className="knaprad">
                {rum.type === 'hvile' ? (
                  <button type="button" className="knap knap-primaer" autoFocus onClick={klaret}>
                    {t('dybet.hvil')}
                  </button>
                ) : (
                  <button type="button" className="knap knap-primaer" autoFocus onClick={() => setFase({ type: 'rum', inde: true, nr: fase.nr })}>
                    {t('dybet.gaa.ind')}
                  </button>
                )}
                <button type="button" className="knap knap-diskret" onClick={() => slutTur(tur)}>
                  {t('dybet.stop')}
                </button>
              </div>
            </section>
          )}
          {fase.inde && rum.type === 'kamp' && (
            <KampVindue
              key={`kamp-${tur.dybde}-${fase.nr}`}
              trin={kampTrin(rum, holdFor(tur).vims)}
              niveauFor={niveauFor}
              klattenMed={holdFor(tur).klatten}
              fremskridt={0}
              avatar={spil.avatar}
              avatarNavn={avatarnavn(spil.avatarnavn)}
              taske={taske}
              onSvar={onSvar}
              onFremskridt={() => undefined}
              onVundet={klaret}
              onPause={udAfRum}
            />
          )}
          {fase.inde && rum.type === 'bane' && (
            <div className="dybet-bane" role="region" aria-label={t('dybet.rum.bane.titel')}>
              <div className="spilflade-ramme">
                <PhaserVerden
                  key={`bane-${tur.dybde}-${fase.nr}-${skala}`}
                  skala={skala}
                  stedId={rum.sted}
                  sted={baneSted(rum.sted)}
                  aktiv="maal"
                  svaer
                  avatar={spil.avatar}
                  skjulte={[]}
                  laast={baneSten !== null || tur.slut}
                  mindreUhygge={indstillinger.mindreUhygge}
                  forskraekSignal={0}
                  kroge={{
                    onInteraktion: (id) => {
                      if (id === 'maal') klaret();
                    },
                    onNaer: () => undefined,
                    onOrdsten: setBaneSten,
                  }}
                  label={t('verden.sted', { sted: baneSted(rum.sted).navn })}
                  baneRef={baneRef}
                />
                {baneSten === null && (
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
              </div>
              <div className="dybet-bane-bar">
                <p className="dybet-dybde">{t('dybet.dybde', { dybde: tur.dybde })}</p>
                {blaekDraaber}
                <p className="dybet-bane-hjaelp">{t('dybet.rum.bane.hjaelp')}</p>
                <button type="button" className="knap knap-diskret" onClick={udAfRum}>
                  {t('dybet.forlad')}
                </button>
              </div>
              {baneSten !== null && !tur.slut && (
                <OrdOpgaveVindue
                  key={`banesten-${baneSten}`}
                  titel={t('dybet.rum.ordsten.titel')}
                  intro={ordstenIntro(baneArt(rum.sted))}
                  antal={1}
                  art={baneArt(rum.sted)}
                  niveau={niveauFor(ordstenFaerdighed(baneArt(rum.sted)))}
                  onSvar={(r, f, fd) => onSvar(fd ?? ordstenFaerdighed(baneArt(rum.sted)), r, f)}
                  faerdigTekst={t('ordsten.genskab')}
                  pauseTekst={t('ordsten.vaek')}
                  onFaerdig={() => {
                    baneRef.current?.genskab(baneSten);
                    setBaneSten(null);
                  }}
                  onPause={() => setBaneSten(null)}
                />
              )}
            </div>
          )}
          {fase.inde && rum.type === 'ordsten' && !tur.slut && (
            <OrdOpgaveVindue
              key={`ord-${tur.dybde}-${fase.nr}`}
              titel={t('dybet.rum.ordsten.titel')}
              intro={ordstenIntro(rum.art)}
              antal={rum.antal}
              art={rum.art}
              niveau={niveauFor(ordstenFaerdighed(rum.art))}
              onSvar={(r, f, fd) => onSvar(fd ?? ordstenFaerdighed(rum.art), r, f)}
              faerdigTekst={t('dybet.videre')}
              pauseTekst={t('dybet.forlad')}
              onFaerdig={klaret}
              onPause={udAfRum}
            />
          )}
        </>
      )}

      {fase.type === 'gave' && tur && (
        <>
          {hud}
          <section className="dybet-kort">
            <h2>{t('dybet.gave.titel')}</h2>
            <p>{t('dybet.gave.tekst')}</p>
            <LaesOpKnap auto tekst={t('dybet.gave.tekst')} figur="fortaeller" />
            <div className="dybet-gaver">
              {fase.valg.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  className="dybet-gave"
                  autoFocus={i === 0}
                  onClick={() => {
                    setTur(vaelgGave(tur, g));
                    setFase({ type: 'rum', inde: false, nr: 0 });
                  }}
                >
                  <span className={`dybet-gave-ikon dybet-gave-${g}`} aria-hidden="true" />
                  <strong>{t(`dybet.gave.${g}.navn`)}</strong>
                  <span>{t(`dybet.gave.${g}.tekst`)}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {fase.type === 'slut' && tur && (
        <section className="dybet-kort dybet-slut">
          <h2>{t('dybet.slut.titel')}</h2>
          <p className="dybet-slut-tal">
            {t('dybet.slut.tal', {
              dybde: tur.dybde,
              rigtige: tur.rigtige,
              stribe: tur.bedsteStribe,
            })}
          </p>
          {fase.ny && <p className="dybet-ny-rekord">{t('dybet.ny.rekord')}</p>}
          <p>{t('dybet.slut.tekst')}</p>
          <LaesOpKnap auto dele={[{ tekst: t('dybet.slut.tekst'), figur: 'fortaeller' }]} />
          <p className="dybet-rekordkode-tekst">{t('dybet.rekordkode')}</p>
          <p
            className="dybet-rekordkode"
            data-rekordkode={rekordkode({
              froe: tur.froe,
              dybde: tur.dybde,
              rigtige: tur.rigtige,
            })}
          >
            {rekordkode({
              froe: tur.froe,
              dybde: tur.dybde,
              rigtige: tur.rigtige,
            })}
          </p>
          <div className="knaprad">
            <button type="button" className="knap knap-primaer" autoFocus onClick={() => start(tur.froe)}>
              {t('dybet.igen.kode', { kode: lavKode(tur.froe) })}
            </button>
            <button type="button" className="knap" onClick={() => start(tilfaeldigtFroe())}>
              {t('dybet.ny.tur')}
            </button>
            <button type="button" className="knap knap-diskret" onClick={() => setFase({ type: 'start' })}>
              {t('dybet.tilbage.dybet')}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
