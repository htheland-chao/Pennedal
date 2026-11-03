import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { stumme, synonymer, t, type KampTrin, type TekstId } from '../content';
import type { Avatar } from '../engine/gem';
import type { Haendelse as Tilpasning } from '../engine/tilpasning';
import { FJENDE_PLADS, HOLD_PLADS, KAMP_B, KAMP_H, MARKOER, tegnKampBaggrund } from '../game/pixel/kampscene';
import { tegnkortTilLerred } from '../game/pixel/lerred';
import { avatarPixel, FUGL, type Tegnkort } from '../game/pixel/sprites';
import { STUMMING, TOMORD, VIMS } from '../game/pixel/viskeskov';
import { antalTure, lavStummingOpgave, lavTomordOpgave, tjekKamp, viskUd, type KampOpgave, type VaesenId } from '../mechanics/kamp';
import {
  brugEvne,
  brugTing,
  fjendensTur,
  forsvar,
  kanBrugeEvne,
  KOMBI,
  KRUMMER_LIV,
  levende,
  SLAG,
  SLAG_FAERDIGHED,
  SLAG_OPGAVE,
  slaa,
  startKamp,
  stortSlagKlar,
  SVAGHED,
  type EvneId,
  type Haendelse,
  type HjaelperId,
  type Kamp,
  type KampTingId,
  type MedlemId,
  type Slag,
} from '../mechanics/kampmotor';
import { useApp } from './Kontekst';
import { Modal } from './Modal';
import { beskedDele } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';

/**
 * Turbaseret kamp (3. november 2026): væsnerne til venstre, holdet til højre og menuerne nederst, som i gamle rollespil.
 * Al tekst er HTML (krav 1). Ingen tid (krav 5). Et forkert svar rammer ved siden af og giver regel og eksempel (krav 6).
 * Skaden kommer fra væsnernes varslede angreb. Logikken står i src/mechanics/kampmotor.ts.
 */
type Props = {
  trin: KampTrin;
  niveauFor: (faerdighed: string) => number;
  /** Skade, holdet allerede har givet i en afbrudt kamp. */
  fremskridt: number;
  avatar: Avatar;
  avatarNavn: string;
  taske: readonly string[];
  onSvar: (faerdighed: string, rigtigt: boolean, forsoeg: number) => Tilpasning;
  onFremskridt: (givet: number) => void;
  onVundet: () => void;
  onPause: () => void;
};

type Visning =
  | { type: 'menu' }
  | { type: 'slag' }
  | { type: 'maal'; slag: Slag; stort: boolean }
  | { type: 'lyt' }
  | { type: 'opgave'; slag: Slag; stort: boolean; fjende: number; opgave: KampOpgave; vaek: string[]; svaret: string | null; forklaret: boolean }
  | { type: 'hjaelper' }
  | { type: 'lap' }
  | { type: 'slet' }
  | { type: 'taske' }
  | { type: 'punktum' }
  | { type: 'runde'; linjer: string[] };

const SPRITE: Record<VaesenId, Tegnkort> = { tomordet: TOMORD, stumming: STUMMING };

/** Ord, der er brugt i denne session, så de ikke kommer igen med det samme. */
const brugt: Record<VaesenId, string[]> = { tomordet: [], stumming: [] };
function nyOpgave(vaesen: VaesenId, niveau: number): KampOpgave {
  const o =
    vaesen === 'tomordet'
      ? lavTomordOpgave(synonymer.ord, niveau, Math.random, brugt.tomordet)
      : lavStummingOpgave(stumme.ord, niveau, Math.random, brugt.stumming);
  brugt[vaesen].push(o.id);
  if (brugt[vaesen].length > 8) brugt[vaesen].shift();
  return o;
}

function regelFor(o: KampOpgave): { regel: string; eksempel: string } {
  if (o.vaesen === 'tomordet') return { regel: t('kamp.tomordet.regel'), eksempel: t('kamp.tomordet.eksempel') };
  const andre = stumme.ord
    .filter((x) => x.type === o.type && x.ord !== o.ord && x.svaerhed === 1)
    .slice(0, 3)
    .map((x) => x.ord)
    .join(', ');
  return { regel: stumme.regler[o.type ?? 'd'], eksempel: t('kamp.stumming.eksempel', { ord: andre }) };
}

const k = (o: KampOpgave, del: string) => `kamp.${o.vaesen}.${del}` as TekstId;

const billeder = new Map<string, string>();
function uri(noegle: string, kort: Tegnkort | (() => HTMLCanvasElement)): string {
  if (!billeder.has(noegle)) {
    try {
      billeder.set(noegle, (typeof kort === 'function' ? kort() : tegnkortTilLerred(kort)).toDataURL('image/png'));
    } catch {
      billeder.set(noegle, '');
    }
  }
  return billeder.get(noegle) ?? '';
}

/** Placering af et billede i procent af scenen ud fra fodpunktet, så alt skalerer med skærmen. */
function plads([x, y]: [number, number], kort: Tegnkort, skala = 1): CSSProperties {
  const b = Math.max(...kort.raekker.map((r) => r.length)) * skala;
  const h = kort.raekker.length * skala;
  return { left: `${((x - b / 2) / KAMP_B) * 100}%`, top: `${((y - h) / KAMP_H) * 100}%`, width: `${(b / KAMP_B) * 100}%` };
}

/** Piletasterne flytter fokus mellem knapperne i en menu. */
function piletaster(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const knapper = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  const i = knapper.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0 || knapper.length === 0) return;
  e.preventDefault();
  knapper[(i + (e.key === 'ArrowDown' ? 1 : knapper.length - 1)) % knapper.length].focus();
}

export function KampVindue({ trin, niveauFor, fremskridt, avatar, avatarNavn, taske, onSvar, onFremskridt, onVundet, onPause }: Props) {
  const { indstillinger } = useApp();
  const daempet = indstillinger.mindreUhygge;
  const vaesner = trin.vaesner ?? [trin.vaesen];
  const hjaelpere: HjaelperId[] = trin.hold ?? ['aeseloere', ...(trin.hjaelper === 'vims' ? (['vims'] as const) : [])];
  const slagListe = trin.slag ?? SLAG;
  const [kamp, setKamp] = useState<Kamp>(() =>
    startKamp({
      vaesner,
      ture: antalTure(trin.antal, niveauFor(trin.faerdighed)),
      hjaelpere,
      taske,
      givet: fremskridt,
      daempet,
      niveau: niveauFor(trin.faerdighed),
      rnd: Math.random,
    }),
  );
  const [visning, setVisning] = useState<Visning>({ type: 'menu' });
  /** Kort besked fra en hjælper, der ikke koster avatarens tur. */
  const [notat, setNotat] = useState<string | null>(null);
  /** Væsner, hvis svage punkt holdet kender (efter Lyt eller et træffende slag). */
  const [kendt, setKendt] = useState<number[]>([]);
  const [peg, setPeg] = useState<number | null>(null);
  const [ramt, setRamt] = useState<{ fjender: number[]; hold: MedlemId[]; nr: number }>({ fjender: [], hold: [], nr: 0 });
  const viskNaeste = useRef(false);

  const navne = useMemo(() => {
    const ens = (v: VaesenId) => vaesner.filter((x) => x === v).length > 1;
    const taeller: Partial<Record<VaesenId, number>> = {};
    return vaesner.map((v) => {
      const navn = t(`kamp.${v}.navn` as TekstId);
      if (!ens(v)) return navn;
      taeller[v] = (taeller[v] ?? 0) + 1;
      return `${navn} ${taeller[v]}`;
    });
    // Væsnerne ændrer sig ikke i en kamp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const medlemNavn = (id: MedlemId) => (id === 'avatar' ? avatarNavn : t(`taler.${id}` as TekstId));

  const baggrund = uri(`kamp.${trin.sted}.${daempet}`, () => tegnKampBaggrund('viskeskov', !daempet));
  // Spillet laver venstre ved at spejle højre. Her spejles billedet, så avataren vender mod væsnerne.
  const avatarKort = useMemo(() => {
    const h = avatarPixel(avatar, 'hoejre', 0);
    return { ...h, raekker: h.raekker.map((r) => [...r].reverse().join('')) };
  }, [avatar]);
  const holdKort: Record<MedlemId, Tegnkort> = { avatar: avatarKort, aeseloere: FUGL, vims: VIMS };

  /** Tekster til det, der skete. Bruges både i runde-oversigten og som oplæsning. */
  function tekst(h: Haendelse): string | null {
    const navn = h.type !== 'kombi' && 'fjende' in h && h.fjende !== undefined ? navne[h.fjende] : '';
    switch (h.type) {
      case 'ramt':
        return t(h.svag ? 'kamp.haendelse.svag' : 'kamp.haendelse.ramt', { navn, skade: h.skade });
      case 'forbi':
        return t('kamp.haendelse.forbi', { navn });
      case 'rolig':
        return t('kamp.haendelse.rolig', { navn });
      case 'kombi':
        return t('kamp.haendelse.kombi');
      case 'forsvar':
        return t('kamp.haendelse.forsvar');
      case 'ting':
        return h.ting === 'krummer' ? t('kamp.haendelse.krummer', { liv: KRUMMER_LIV }) : t(`kamp.haendelse.${h.ting}` as TekstId, { navn });
      case 'angreb':
        return h.skade > 0
          ? t(`kamp.haendelse.angreb.${h.angreb}` as TekstId, { navn, hvem: medlemNavn(h.hvem), skade: h.skade })
          : t('kamp.haendelse.afvist', { navn, hvem: medlemNavn(h.hvem) });
      case 'misser':
        return t('kamp.haendelse.misser', { navn });
      case 'lammet':
        return t('kamp.haendelse.lammet', { navn });
      case 'faldet':
        return h.hvem === 'avatar' ? null : t('kamp.haendelse.faldet', { hvem: medlemNavn(h.hvem) });
      case 'vundet':
        return t('kamp.vundet');
      case 'slaaet':
        return t('kamp.slaaet');
      case 'evne':
        if (h.evne === 'lap') return t('kamp.haendelse.lap', { hvem: medlemNavn(h.hvem ?? 'avatar'), liv: h.liv ?? 0 });
        if (h.evne === 'slet') return t('kamp.haendelse.slet', { navn });
        if (h.evne === 'visk') return t('kamp.vims.visk');
        return t('kamp.haendelse.forklar');
    }
  }

  function vis(hs: Haendelse[]) {
    setRamt((r) => ({
      fjender: hs.flatMap((h) => (h.type === 'ramt' ? [h.fjende] : [])),
      hold: hs.flatMap((h) => (h.type === 'angreb' && h.skade > 0 ? [h.hvem] : [])),
      nr: r.nr + 1,
    }));
  }

  /** Avataren har handlet: væsnerne svarer igen, og runden vises. */
  function afslutRunde(efterAvatar: Kamp, foer: Haendelse[]) {
    let k2 = efterAvatar;
    let alle = [...foer];
    if (!k2.udfald) {
      const r = fjendensTur(k2, Math.random);
      k2 = r.kamp;
      alle = [...alle, ...r.haendelser];
    }
    setKamp(k2);
    vis(alle);
    setNotat(null);
    if (k2.givet !== kamp.givet) onFremskridt(k2.givet);
    setVisning({ type: 'runde', linjer: alle.map(tekst).filter((x): x is string => !!x) });
  }

  function vaelgSlag(slag: Slag, stort: boolean) {
    const live = levende(kamp.fjender);
    if (stort || live.length === 1) startOpgave(slag, stort, live[0].nr);
    else setVisning({ type: 'maal', slag, stort });
  }

  function startOpgave(slag: Slag, stort: boolean, fjende: number) {
    const opgave = nyOpgave(SLAG_OPGAVE[slag], niveauFor(SLAG_FAERDIGHED[slag]));
    const vaek: string[] = [];
    if (viskNaeste.current) {
      viskNaeste.current = false;
      const m = viskUd(opgave, vaek, Math.random);
      if (m) vaek.push(m);
    }
    setPeg(fjende);
    setNotat(null);
    setVisning({ type: 'opgave', slag, stort, fjende, opgave, vaek, svaret: null, forklaret: false });
  }

  function svar(valg: string) {
    if (visning.type !== 'opgave' || visning.svaret || visning.vaek.includes(valg)) return;
    const rigtigt = tjekKamp(visning.opgave, valg);
    onSvar(SLAG_FAERDIGHED[visning.slag], rigtigt, 1);
    setVisning({ ...visning, svaret: valg });
  }

  function efterSvar() {
    if (visning.type !== 'opgave' || !visning.svaret) return;
    const rigtigt = tjekKamp(visning.opgave, visning.svaret);
    const r = slaa(kamp, { slag: visning.slag, fjende: visning.fjende, rigtigt, stort: visning.stort });
    const svage = r.haendelser.flatMap((h) => (h.type === 'ramt' && h.svag ? [h.fjende] : []));
    if (svage.length) setKendt((x) => [...new Set([...x, ...svage])]);
    afslutRunde(r.kamp, r.haendelser);
  }

  function evneIOpgave(evne: 'forklar' | 'visk') {
    if (visning.type !== 'opgave' || visning.svaret) return;
    const r = brugEvne(kamp, evne);
    if (!r.haendelser.length) return;
    setKamp(r.kamp);
    if (evne === 'forklar') setVisning({ ...visning, forklaret: true });
    else {
      const m = viskUd(visning.opgave, visning.vaek, Math.random);
      setVisning({ ...visning, vaek: m ? [...visning.vaek, m] : visning.vaek });
      setNotat(m ? t('kamp.vims.visk') : t('kamp.vims.ingen'));
    }
  }

  function evneIMenu(evne: EvneId, v: { hvem?: MedlemId; fjende?: number } = {}) {
    const r = brugEvne(kamp, evne, v);
    if (!r.haendelser.length) return;
    setKamp(r.kamp);
    if (evne === 'visk') viskNaeste.current = true;
    setNotat(r.haendelser.map(tekst).filter(Boolean).join(' '));
    setVisning({ type: 'menu' });
  }

  function ting(id: KampTingId, fjende?: number) {
    const r = brugTing(kamp, id, { fjende });
    if (!r.haendelser.length) return;
    afslutRunde(r.kamp, r.haendelser);
  }

  function lyt(fjende: number) {
    setKendt((x) => [...new Set([...x, fjende])]);
    setPeg(fjende);
    setNotat(`${t(`kamp.${kamp.fjender[fjende].vaesen}.lyt` as TekstId)} ${t('kamp.lyt.svag', { navn: navne[fjende], svaghed: t(`kamp.svaghed.${SVAGHED[kamp.fjender[fjende].vaesen]}` as TekstId) })}`);
    setVisning({ type: 'menu' });
  }

  function gaaVaek() {
    onFremskridt(kamp.givet);
    onPause();
  }

  const varselTekst = (nr: number) => {
    const f = kamp.fjender[nr];
    if (!f.varsel || f.liv <= 0) return null;
    const skade = daempet ? Math.ceil(f.varsel.skade / 2) : f.varsel.skade;
    return t(`kamp.varsel.${f.varsel.angreb}` as TekstId, { navn: navne[nr], hvem: medlemNavn(f.varsel.maal ?? 'avatar'), skade });
  };

  const tilbage = (
    <button type="button" className="knap knap-diskret" onClick={() => setVisning({ type: 'menu' })}>
      {t('kamp.tilbage')}
    </button>
  );

  const fjendeKnapper = (handling: (nr: number) => void, kun?: (nr: number) => boolean) => (
    <div className="kamp-menu" onKeyDown={piletaster}>
      {kamp.fjender.map((f) =>
        f.liv > 0 && (!kun || kun(f.nr)) ? (
          <button key={f.nr} type="button" className="knap" onClick={() => handling(f.nr)} onFocus={() => setPeg(f.nr)} onMouseEnter={() => setPeg(f.nr)}>
            {navne[f.nr]}
          </button>
        ) : null,
      )}
      {tilbage}
    </div>
  );

  let menu: ReactNode = null;
  if (visning.type === 'menu')
    menu = (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.hvad')}</legend>
        <button type="button" className="knap knap-primaer" onClick={() => setVisning({ type: 'slag' })} autoFocus>
          {t('kamp.menu.slaa')}
        </button>
        <button type="button" className="knap" onClick={() => setVisning({ type: 'lyt' })}>
          {t('kamp.lyt')}
        </button>
        <button type="button" className="knap" onClick={() => {
            const r = forsvar(kamp);
            afslutRunde(r.kamp, r.haendelser);
          }}>
          {t('kamp.menu.forsvar')}
        </button>
        <button type="button" className="knap" onClick={() => setVisning({ type: 'hjaelper' })} disabled={hjaelpere.length === 0}>
          {t('kamp.menu.hjaelpere')}
        </button>
        <button type="button" className="knap" onClick={() => setVisning({ type: 'taske' })}>
          {t('kamp.menu.taske')}
        </button>
        <button type="button" className="knap knap-diskret" onClick={gaaVaek}>
          {t('kamp.gaa')}
        </button>
      </fieldset>
    );
  else if (visning.type === 'slag')
    menu = (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.slag.hvad')}</legend>
        {slagListe.map((s, i) => (
          <button key={s} type="button" className="knap" onClick={() => vaelgSlag(s, false)} autoFocus={i === 0}>
            {t(`kamp.slag.${s}` as TekstId)}
          </button>
        ))}
        {stortSlagKlar(kamp) &&
          slagListe.map((s) => (
            <button key={`stort-${s}`} type="button" className="knap knap-primaer" onClick={() => vaelgSlag(s, true)}>
              {t('kamp.slag.stort', { slag: t(`kamp.slag.${s}` as TekstId) })}
            </button>
          ))}
        {tilbage}
      </fieldset>
    );
  else if (visning.type === 'maal')
    menu = (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.maal.hvem')}</p>
        {fjendeKnapper((nr) => startOpgave(visning.slag, visning.stort, nr))}
      </div>
    );
  else if (visning.type === 'lyt')
    menu = (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.maal.lyt')}</p>
        {fjendeKnapper(lyt)}
      </div>
    );
  else if (visning.type === 'hjaelper') {
    const evner: EvneId[] = [...(hjaelpere.includes('aeseloere') ? (['lap'] as const) : []), ...(hjaelpere.includes('vims') ? (['visk', 'slet'] as const) : [])];
    menu = (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.menu.hjaelpere')}</legend>
        {evner.map((e, i) => (
          <button
            key={e}
            type="button"
            className="knap"
            autoFocus={i === 0}
            disabled={!kanBrugeEvne(kamp, e)}
            onClick={() => (e === 'lap' ? setVisning({ type: 'lap' }) : e === 'slet' ? setVisning({ type: 'slet' }) : evneIMenu(e))}
          >
            {t(`kamp.evne.${e}` as TekstId, { antal: kamp.evner[e] ?? 0 })}
          </button>
        ))}
        <p className="lille-tekst">{t('kamp.evne.forklaring')}</p>
        {tilbage}
      </fieldset>
    );
  } else if (visning.type === 'lap')
    menu = (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.lap.hvem')}</legend>
        {kamp.hold.map((m, i) => (
          <button key={m.id} type="button" className="knap" autoFocus={i === 0} disabled={m.liv >= m.maks} onClick={() => evneIMenu('lap', { hvem: m.id })}>
            {t('kamp.medlem.liv', { navn: medlemNavn(m.id), liv: m.liv, maks: m.maks })}
          </button>
        ))}
        {tilbage}
      </fieldset>
    );
  else if (visning.type === 'slet')
    menu = (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.slet.hvem')}</p>
        {fjendeKnapper((nr) => evneIMenu('slet', { fjende: nr }), (nr) => !!kamp.fjender[nr].varsel)}
      </div>
    );
  else if (visning.type === 'taske') {
    const tilgaengelige = (Object.keys(kamp.ting) as KampTingId[]).filter((x) => kamp.ting[x]);
    menu = (
      <fieldset className="kamp-menu" onKeyDown={piletaster}>
        <legend>{t('kamp.menu.taske')}</legend>
        {tilgaengelige.length === 0 && <p className="lille-tekst">{t('kamp.ting.ingen')}</p>}
        {tilgaengelige.map((x, i) => (
          <button key={x} type="button" className="knap" autoFocus={i === 0} onClick={() => (x === 'punktum' ? setVisning({ type: 'punktum' }) : ting(x))}>
            {t(`kamp.ting.${x}` as TekstId, { liv: KRUMMER_LIV })}
          </button>
        ))}
        {tilbage}
      </fieldset>
    );
  } else if (visning.type === 'punktum')
    menu = (
      <div>
        <p className="kamp-spoergsmaal">{t('kamp.punktum.hvem')}</p>
        {fjendeKnapper((nr) => ting('punktum', nr))}
      </div>
    );

  const o = visning.type === 'opgave' ? visning : null;
  const regel = useMemo(() => (o ? regelFor(o.opgave) : null), [o?.opgave]); // eslint-disable-line react-hooks/exhaustive-deps
  const rigtigt = o?.svaret ? tjekKamp(o.opgave, o.svaret) : null;
  const beskedTekst = o?.svaret
    ? rigtigt
      ? t(k(o.opgave, 'rigtig'), { svar: o.opgave.svar, ord: o.opgave.ord })
      : t(k(o.opgave, 'fejl'), { valgt: o.svaret, ord: o.opgave.ord })
    : null;

  const runde = visning.type === 'runde' ? visning : null;
  const slut = kamp.udfald;
  const varsler = kamp.fjender.map((f) => varselTekst(f.nr)).filter((x): x is string => !!x);

  return (
    <Modal titel={t('kamp.titel')} onLuk={gaaVaek} bred klasse={`opgave kamp kampscene${daempet ? ' mild' : ''}`}>
      {/* Til gennemspilningen: hvilken opgave, der vises (ikke svaret). */}
      {o && <span hidden data-opgave-id={o.opgave.id} data-opgave-vaesen={o.opgave.vaesen} />}
      <h2 className="sr-only">{t('kamp.titel')}</h2>

      <div className="kamp-felt" aria-hidden="true">
        {baggrund && <img className="kamp-lag" src={baggrund} alt="" />}
        {kamp.fjender.map((f) => {
          const sted = FJENDE_PLADS[Math.min(2, kamp.fjender.length - 1)][f.nr] ?? [70, 130];
          const kort = SPRITE[f.vaesen];
          return (
            <span key={f.nr}>
              <img
                className={`kamp-sprite kamp-fjende${f.liv <= 0 ? ' rolig' : ''}${ramt.fjender.includes(f.nr) ? ' ramt' : ''}`}
                key={`${f.nr}-${ramt.fjender.includes(f.nr) ? ramt.nr : 0}`}
                src={uri(`vaesen.${f.vaesen}`, kort)}
                alt=""
                style={plads(sted, kort, 2)}
              />
              {peg === f.nr && f.liv > 0 && !slut && (
                <img className="kamp-sprite kamp-markoer" src={uri('markoer', MARKOER)} alt="" style={plads([sted[0] - 24, sted[1] - 12], MARKOER, 1.5)} />
              )}
            </span>
          );
        })}
        {kamp.hold.map((m, i) => {
          const kort = holdKort[m.id];
          return (
            <img
              key={`${m.id}-${ramt.hold.includes(m.id) ? ramt.nr : 0}`}
              className={`kamp-sprite kamp-medlem${m.liv <= 0 ? ' faldet' : ''}${ramt.hold.includes(m.id) ? ' ramt' : ''}`}
              src={uri(m.id === 'avatar' ? `avatar.${JSON.stringify(avatar)}` : `medlem.${m.id}`, kort)}
              alt=""
              style={plads(HOLD_PLADS[i], kort, 1.5)}
            />
          );
        })}
      </div>

      <div className="kamp-vinduer">
        <section className="kamp-vindue kamp-fjender" aria-label={t('kamp.vaesner')}>
          <ul>
            {kamp.fjender.map((f) => (
              <li key={f.nr} className={f.liv <= 0 ? 'rolig' : ''}>
                <span className="kamp-navn">{navne[f.nr]}</span>
                <span className="kamp-maaler" aria-hidden="true">
                  <span style={{ width: `${(f.liv / f.maks) * 100}%` }} />
                </span>
                <span className="lille-tekst">
                  {t('kamp.liv', { liv: f.liv, maks: f.maks })}
                  {' - '}
                  {kendt.includes(f.nr) ? t(`kamp.svaghed.${SVAGHED[f.vaesen]}` as TekstId) : t('kamp.svaghed.ukendt')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="kamp-vindue kamp-midte">
          {runde ? (
            <div className="kamp-runde" aria-live="polite">
              <p className="naeste-overskrift">{t('kamp.runde', { runde: slut ? kamp.runde : kamp.runde - 1 })}</p>
              <ul>
                {runde.linjer.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
              <div className="knaprad">
                <LaesOpKnap dele={runde.linjer.map((l) => ({ tekst: l }))} etiket={t('kamp.laes')} auto />
                {slut === 'vundet' ? (
                  <button type="button" className="knap knap-primaer" onClick={onVundet} autoFocus>
                    {t('kamp.videre')}
                  </button>
                ) : slut === 'slaaet' ? (
                  <button type="button" className="knap knap-primaer" onClick={gaaVaek} autoFocus>
                    {t('kamp.tilbage')}
                  </button>
                ) : (
                  <button type="button" className="knap knap-primaer" onClick={() => setVisning({ type: 'menu' })} autoFocus>
                    {t('kamp.naeste')}
                  </button>
                )}
              </div>
            </div>
          ) : o ? (
            <div className="opgave-krop kamp-opgave">
              <p className="naeste-overskrift">{o.stort ? t('kamp.slag.stort', { slag: t(`kamp.slag.${o.slag}` as TekstId) }) : `${t(`kamp.slag.${o.slag}` as TekstId)} - ${navne[o.fjende]}`}</p>
              <p className="kamp-saetning">
                {o.opgave.foer}
                <mark>{o.opgave.vist}</mark>
                {o.opgave.efter}
              </p>
              <p className="kamp-spoergsmaal">{t(k(o.opgave, 'spoergsmaal'), { ord: o.opgave.ord, vist: o.opgave.vist })}</p>
              {o.forklaret && regel && (
                <div className="besked besked-info regel">
                  <p>{t('kamp.haendelse.forklar')}</p>
                  <p>
                    <strong>{t('feedback.regel')}:</strong> {regel.regel}
                  </p>
                  <p>
                    <strong>{t('feedback.eksempel')}:</strong> {regel.eksempel}
                  </p>
                </div>
              )}
              <div className="kamp-muligheder">
                {o.opgave.muligheder.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`knap kamp-mulighed${o.svaret && m === o.opgave.svar ? ' rigtig' : ''}`}
                    disabled={o.vaek.includes(m) || !!o.svaret}
                    onClick={() => svar(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {!o.svaret ? (
                <div className="knaprad">
                  <LaesOpKnap tekst={o.opgave.saetning} figur="fortaeller" etiket={t('kamp.laes')} />
                  <button type="button" className="knap" onClick={() => setNotat(t(k(o.opgave, 'lyt')))}>
                    {t('kamp.lyt')}
                  </button>
                  {hjaelpere.includes('aeseloere') && (
                    <button type="button" className="knap" disabled={!kanBrugeEvne(kamp, 'forklar') || o.forklaret} onClick={() => evneIOpgave('forklar')}>
                      {t('kamp.evne.forklar', { antal: kamp.evner.forklar ?? 0 })}
                    </button>
                  )}
                  {hjaelpere.includes('vims') && (
                    <button type="button" className="knap" disabled={!kanBrugeEvne(kamp, 'visk')} onClick={() => evneIOpgave('visk')}>
                      {t('kamp.evne.visk', { antal: kamp.evner.visk ?? 0 })}
                    </button>
                  )}
                </div>
              ) : (
                <div className="opgave-feedback" aria-live="polite">
                  <div className={`besked besked-${rigtigt ? 'god' : 'fejl'}`}>
                    <p>{beskedTekst}</p>
                    {regel && (
                      <div className="regel">
                        <p>
                          <strong>{t('feedback.regel')}:</strong> {regel.regel}
                        </p>
                        <p>
                          <strong>{t('feedback.eksempel')}:</strong> {regel.eksempel}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="knaprad">
                    <LaesOpKnap auto dele={beskedDele(beskedTekst ?? '', regel, null, false)} />
                    <button type="button" className="knap knap-primaer" onClick={efterSvar} autoFocus>
                      {t('kamp.videre')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            menu
          )}
          {notat && !runde && (
            <div className="besked besked-info" aria-live="polite">
              <p>{notat}</p>
            </div>
          )}
        </section>

        <section className="kamp-vindue kamp-hold" aria-label={t('kamp.holdet')}>
          <ul>
            {kamp.hold.map((m) => (
              <li key={m.id} className={m.liv <= 0 ? 'faldet' : ''}>
                <span className="kamp-navn">{medlemNavn(m.id)}</span>
                <span className="kamp-maaler liv" aria-hidden="true">
                  <span style={{ width: `${(m.liv / m.maks) * 100}%` }} />
                </span>
                <span className="lille-tekst">{t('kamp.liv', { liv: m.liv, maks: m.maks })}</span>
              </li>
            ))}
          </ul>
          <p className="lille-tekst">{stortSlagKlar(kamp) ? t('kamp.stort.klar') : t('kamp.kombi', { antal: kamp.kombi, maks: KOMBI })}</p>
        </section>
      </div>

      {!slut && varsler.length > 0 && (
        <div className="kamp-varsler">
          <p className="naeste-overskrift">{t('kamp.varsel.overskrift')}</p>
          <ul>
            {varsler.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="lille-tekst">{t('kamp.forklaring')}</p>
    </Modal>
  );
}
