import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { fortaellersaetninger, halvData, kapitler, korrekturData, rimord, stumme, synonymer, t, type KampTrin, type TekstId } from '../content';
import { lavKrusedulleOpgave, type FejlType } from '../mechanics/korrektur';
import { KRUSEDULLE } from '../game/pixel/blaeksoe';
import { HALVSAETNING } from '../game/pixel/sidstesiden';
import { lavHalvsaetningOpgave } from '../mechanics/halvsaetning';
import type { Avatar } from '../engine/gem';
import type { Haendelse as Tilpasning } from '../engine/tilpasning';
import { FJENDE_PLADS, HOLD_PLADS, KAMP_B, KAMP_H, MARKOER, tegnKampBaggrund } from '../game/pixel/kampscene';
import { tegnkortTilLerred } from '../game/pixel/lerred';
import { avatarPixel, FUGL, KLATTEN, type Tegnkort } from '../game/pixel/sprites';
import { STUMMING, TOMORD, VIMS } from '../game/pixel/viskeskov';
import { EKKO } from '../game/pixel/rimbjerg';
import { TVIVL } from '../game/pixel/arkiv';
import { antalTure, lavEkkoOpgave, lavTvivlOpgave, lavStummingOpgave, lavTomordOpgave, tjekKamp, viskUd, type KampOpgave, type VaesenId } from '../mechanics/kamp';
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
import { lydForTrin, trinFor, type Effekt, type Trin } from './kampEffekter';
import { useApp } from './Kontekst';
import { hentMusikOverride, saetMusikOverride } from './musik/afspiller';
import { Modal } from './Modal';
import { beskedDele } from './OpgaveRamme';
import { LaesOpKnap } from './Tekst';
import { spilEffekt } from './effekter';

/**
 * Turbaseret kamp i fuld skærm (Henrik, 8. november 2026): som Pokémon, Final Fantasy og Expedition 33.
 * Scenen fylder skærmen. Liv står som bjælker ved figurerne, væsnernes næste angreb vises som et mærke og et sigte
 * på den, de vil ramme, og hvert slag og angreb er en animation med en kort linje. Menuen er lille og står nederst.
 * Al tekst er HTML (krav 1). Ingen tid (krav 5): animationerne kan springes over, og der er aldrig noget, man skal nå.
 * Et forkert svar rammer ved siden af og giver regel og eksempel (krav 6). Logikken står i src/mechanics/kampmotor.ts.
 */
type Props = {
  trin: KampTrin;
  niveauFor: (faerdighed: string) => number;
  /** Skade, holdet allerede har givet i en afbrudt kamp. */
  fremskridt: number;
  avatar: Avatar;
  avatarNavn: string;
  taske: readonly string[];
  /** Klatten er med på holdet (kapitel 6 og frem, når eleven har været venlig mod ham). */
  klattenMed?: boolean;
  /** Hjælpere, der ikke er med i denne kamp (kapitel 7: Æseløre, hvis eleven ikke tilgav ham). */
  uden?: readonly HjaelperId[];
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
  | { type: 'afspil' }
  | { type: 'slut' };

const SPRITE: Record<VaesenId, Tegnkort> = { tomordet: TOMORD, stumming: STUMMING, ekko: EKKO, tvivl: TVIVL, krusedulle: KRUSEDULLE, halvsaetning: HALVSAETNING };
/** Et billede spejlet vandret. */
const spejl = (k: Tegnkort): Tegnkort => ({ ...k, raekker: k.raekker.map((r) => [...r].reverse().join('')) });
/** Hjælperne og væsnerne spejles, så alle kigger mod hinanden (holdet til venstre, væsnerne til højre). */
const SPEJLET = { fugl: spejl(FUGL), vims: spejl(VIMS), klatten: spejl(KLATTEN) };
const SPRITE_SPEJLET = Object.fromEntries(Object.entries(SPRITE).map(([k, v]) => [k, spejl(v)])) as Record<VaesenId, Tegnkort>;
/** Figurernes størrelse på scenen (gange pixel). */
const FJENDE_SKALA = 2.4;
const HOLD_SKALA = 1.8;

/** Ord, der er brugt i denne session, så de ikke kommer igen med det samme. */
const brugt: Record<VaesenId, string[]> = { tomordet: [], stumming: [], ekko: [], tvivl: [], krusedulle: [], halvsaetning: [] };
/** Halvsætningerne skifter mellem en slutning og et sætningstegn. */
let halvNr = 0;
function nyOpgave(vaesen: VaesenId, niveau: number): KampOpgave {
  const o =
    vaesen === 'tomordet'
      ? lavTomordOpgave(synonymer.ord, niveau, Math.random, brugt.tomordet)
      : vaesen === 'ekko'
        ? lavEkkoOpgave(rimord.rim, niveau, Math.random, brugt.ekko)
        : vaesen === 'tvivl'
          ? lavTvivlOpgave(fortaellersaetninger.fortsaet, niveau, Math.random, brugt.tvivl)
          : vaesen === 'krusedulle'
            ? lavKrusedulleOpgave(korrekturData.tekster, niveau, Math.random, brugt.krusedulle)
            : vaesen === 'halvsaetning'
              ? lavHalvsaetningOpgave(halvData, halvNr++, niveau, Math.random, brugt.halvsaetning)
            : lavStummingOpgave(stumme.ord, niveau, Math.random, brugt.stumming);
  brugt[vaesen].push(o.id);
  if (brugt[vaesen].length > 8) brugt[vaesen].shift();
  return o;
}

/** Sand, når eleven har bedt computeren om mindre bevægelse. Så er der ingen zoom, overgang eller slowmotion. */
function roligBevaegelse(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function regelFor(o: KampOpgave): { regel: string; eksempel: string } {
  if (o.vaesen === 'tomordet') return { regel: t('kamp.tomordet.regel'), eksempel: t('kamp.tomordet.eksempel') };
  if (o.vaesen === 'ekko') return { regel: t('rim.regel'), eksempel: t('rim.eksempel') };
  if (o.vaesen === 'tvivl') return { regel: t('fortaeller.regel'), eksempel: t('fortaeller.eksempel') };
  if (o.vaesen === 'halvsaetning') {
    const type = o.fejlType === 'tegn' ? 'tegn' : 'slut';
    return { regel: halvData.regler[type], eksempel: halvData.eksempler[type] };
  }
  if (o.vaesen === 'krusedulle') {
    const type = (o.fejlType ?? 'stumme') as FejlType;
    return { regel: korrekturData.regler[type], eksempel: korrekturData.eksempler[type] };
  }
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

const bredde = (kort: Tegnkort) => Math.max(...kort.raekker.map((r) => r.length));

/** Placering af et billede i procent af scenen ud fra fodpunktet, så alt skalerer med skærmen. */
function plads([x, y]: [number, number], kort: Tegnkort, skala = 1): CSSProperties {
  const b = bredde(kort) * skala;
  const h = kort.raekker.length * skala;
  return { left: `${((x - b / 2) / KAMP_B) * 100}%`, top: `${((y - h) / KAMP_H) * 100}%`, width: `${(b / KAMP_B) * 100}%` };
}
/** Et punkt i procent af scenen. */
const procent = ([x, y]: [number, number]): [number, number] => [(x / KAMP_B) * 100, (y / KAMP_H) * 100];

/** Piletasterne flytter fokus mellem knapperne i en menu. */
function piletaster(e: KeyboardEvent<HTMLElement>) {
  if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const knapper = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
  const i = knapper.indexOf(document.activeElement as HTMLButtonElement);
  if (i < 0 || knapper.length === 0) return;
  e.preventDefault();
  const frem = e.key === 'ArrowDown' || e.key === 'ArrowRight';
  knapper[(i + (frem ? 1 : knapper.length - 1)) % knapper.length].focus();
}

/** Nogle små stykker blæk eller lys, der flyver ud fra et punkt. Retningerne er faste, så det ser ens ud hver gang. */
const STYKKER = Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * 360 + (i % 2) * 17, r: 0.7 + (i % 3) * 0.25 }));

export function KampVindue({ trin, niveauFor, fremskridt, avatar, avatarNavn, taske, klattenMed, uden = [], onSvar, onFremskridt, onVundet, onPause }: Props) {
  const { indstillinger } = useApp();
  const daempet = indstillinger.mindreUhygge;
  const vaesner = trin.vaesner ?? [trin.vaesen];
  const hjaelpere: HjaelperId[] = [
    ...(trin.hold ?? ['aeseloere', ...(trin.hjaelper === 'vims' ? (['vims'] as const) : [])]).filter((h) => !uden.includes(h)),
    ...(klattenMed ? (['klatten'] as const) : []),
  ];
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
  /** En kort linje fra en hjælper eller et tip, der ikke koster en tur. */
  const [notat, setNotat] = useState<string | null>(null);
  /** Væsner, hvis svage punkt holdet kender (efter Lyt eller et træffende slag). */
  const [kendt, setKendt] = useState<number[]>([]);
  const [peg, setPeg] = useState<number | null>(null);
  const [hjaelp, setHjaelp] = useState(false);
  const viskNaeste = useRef(false);

  // Animationerne: trin, der spilles ét ad gangen. Livet på skærmen følger trinnene og passer med kampen til sidst.
  const [effekter, setEffekter] = useState<(Effekt & { id: number })[]>([]);
  const [linje, setLinje] = useState<string | null>(null);
  const [visLiv, setVisLiv] = useState<{ fjender: number[]; hold: Record<string, number> } | null>(null);
  const [ryst, setRyst] = useState<{ fjender: number[]; hold: MedlemId[]; skaerm: boolean; nr: number }>({ fjender: [], hold: [], skaerm: false, nr: 0 });
  const [oploest, setOploest] = useState<number[]>(() => kamp.fjender.filter((f) => f.liv <= 0).map((f) => f.nr));
  const oploestRef = useRef(oploest);
  oploestRef.current = oploest;
  // Kun de væsner, der falder til ro i denne afspilning, smelter. De, der allerede er væk, bliver væk (Henrik, 10. november 2026).
  const [smelter, setSmelter] = useState<number[]>([]);
  const [faldet, setFaldet] = useState<MedlemId[]>([]);
  const afspilning = useRef<{ ur: number | null; trin: Trin[]; i: number; slut: (() => void) | null }>({ ur: null, trin: [], i: 0, slut: null });
  const effektNr = useRef(0);
  const felt = useRef<HTMLDivElement>(null);

  // Skærmen ryster ved hårde slag. Det sker med en animation på elementet, så scenen ikke tegnes forfra
  // (ellers ville et væsen, der allerede er faldet, dukke op igen).
  useEffect(() => {
    if (!ryst.skaerm || !felt.current?.animate) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    felt.current.animate(
      [{ transform: 'translate(-1cqw, 0.6cqh)' }, { transform: 'translate(1cqw, -0.6cqh)' }, { transform: 'translate(-0.5cqw, 0.3cqh)' }, { transform: 'none' }],
      { duration: 350, easing: 'steps(4)' },
    );
  }, [ryst]);

  useEffect(() => () => {
    if (afspilning.current.ur !== null) window.clearTimeout(afspilning.current.ur);
  }, []);

  // Overgangen ind i kampen (Henrik, 10. november 2026): bjælker af blæk lukker og åbner skærmen som i gamle rollespil.
  const [overgang, setOvergang] = useState(() => !roligBevaegelse());
  useEffect(() => {
    if (!overgang) return;
    felt.current?.animate?.([{ scale: '1.25' }, { scale: '1.25', offset: 0.4 }, { scale: '1' }], { duration: 1000, easing: 'ease-out' });
    const ur = window.setTimeout(() => setOvergang(false), 1000);
    return () => window.clearTimeout(ur);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Kameraet (Henrik, 10. november 2026): zoomer kort ind på den, der bliver ramt. Bruger CSS-egenskaben scale,
   * så det ikke støder sammen med rystelsen, der bruger transform.
   */
  function kamera(x: number, y: number, zoom: number, varighed: number) {
    if (!felt.current?.animate || roligBevaegelse()) return;
    felt.current.animate(
      [
        { scale: '1', transformOrigin: `${x}% ${y}%` },
        { scale: String(zoom), transformOrigin: `${x}% ${y}%`, offset: 0.35 },
        { scale: String(zoom), transformOrigin: `${x}% ${y}%`, offset: 0.7 },
        { scale: '1', transformOrigin: `${x}% ${y}%` },
      ],
      { duration: varighed, easing: 'ease-in-out' },
    );
  }

  // Kampmusik (9. november 2026): hurtig og ildevarslende, så længe kampen er åben. Bagefter spiller stedets musik igen.
  useEffect(() => {
    const foer = hentMusikOverride();
    saetMusikOverride('kamp');
    spilEffekt('kampstart');
    return () => saetMusikOverride(foer);
  }, []);

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

  // Baggrunden følger stedets tema (Viskeskoven eller Rimbjerget).
  const tema = kapitler.find((k) => k.trin.some((x) => x.id === trin.id))?.steder[trin.sted]?.tema ?? 'viskeskov';
  const baggrund = uri(`kamp.${trin.sted}.${daempet}`, () => tegnKampBaggrund(tema, !daempet));
  // Holdet står til venstre og kigger mod højre, mod væsnerne. Hjælperne er tegnet, så de kigger mod venstre, og spejles.
  const avatarKort = useMemo(() => avatarPixel(avatar, 'hoejre', 0), [avatar]);
  const holdKort: Record<MedlemId, Tegnkort> = { avatar: avatarKort, aeseloere: SPEJLET.fugl, vims: SPEJLET.vims, klatten: SPEJLET.klatten };

  const fjendeSted = (nr: number): [number, number] => FJENDE_PLADS[Math.min(2, kamp.fjender.length - 1)][nr] ?? [70, 130];
  const holdSted = (id: MedlemId): [number, number] => HOLD_PLADS[Math.max(0, kamp.hold.findIndex((m) => m.id === id))] ?? HOLD_PLADS[0];
  /** Midten af en figur i procent, til effekterne. */
  const midtFjende = (nr: number) => {
    const [x, y] = fjendeSted(nr);
    return procent([x, y - (SPRITE[kamp.fjender[nr].vaesen].raekker.length * FJENDE_SKALA) / 2]);
  };
  const midtMedlem = (id: MedlemId) => {
    const [x, y] = holdSted(id);
    return procent([x, y - (holdKort[id].raekker.length * HOLD_SKALA) / 2]);
  };

  /** Spiller trinnene. Til sidst sættes kampen til sin rigtige tilstand, og man kommer tilbage til menuen eller slutningen. */
  function afspil(hs: Haendelse[], ny: Kamp) {
    const trinListe = trinFor(hs, { fjende: midtFjende, medlem: midtMedlem }, { fjende: (nr) => navne[nr], medlem: medlemNavn }, ny.hold.map((m) => m.id));
    setVisLiv({ fjender: kamp.fjender.map((f) => f.liv), hold: Object.fromEntries(kamp.hold.map((m) => [m.id, m.liv])) });
    setVisning({ type: 'afspil' });
    setNotat(null);
    const a = afspilning.current;
    a.trin = trinListe;
    a.i = 0;
    a.slut = () => {
      a.ur = null;
      a.slut = null;
      setEffekter([]);
      setVisLiv(null);
      setKamp(ny);
      setOploest(ny.fjender.filter((f) => f.liv <= 0).map((f) => f.nr));
      setSmelter([]);
      setFaldet(ny.hold.filter((m) => m.liv <= 0).map((m) => m.id));
      setVisning(ny.udfald ? { type: 'slut' } : { type: 'menu' });
      if (!ny.udfald) setLinje(null);
    };
    naesteTrin();
  }

  function naesteTrin() {
    const a = afspilning.current;
    if (a.i >= a.trin.length) {
      a.slut?.();
      return;
    }
    const tr = a.trin[a.i++];
    const lyd = lydForTrin(tr);
    if (lyd) spilEffekt(lyd);
    // Det sidste væsen, der opløses, vises langsomt (som en filmisk slowmotion).
    const sidste = !!tr.oploest?.length && kamp.fjender.every((f) => oploestRef.current.includes(f.nr) || tr.oploest!.includes(f.nr));
    const fart = sidste && !roligBevaegelse() ? 0.5 : 1;
    const ramt = tr.effekter.find((e) => e.type === 'nedslag' || e.type === 'oploes');
    const angreb = tr.effekter.find((e) => e.type.startsWith('angreb-'));
    // Varigheden er uden slowmotion: playbackRate herunder gør også kameraet langsommere.
    if (ramt) kamera(ramt.x, ramt.y, sidste ? 1.3 : tr.effekter.some((e) => e.type === 'stort') ? 1.18 : 1.1, tr.varighed);
    else if (angreb) kamera(angreb.tx ?? angreb.x, angreb.ty ?? angreb.y, 1.06, tr.varighed);
    if (fart !== 1) requestAnimationFrame(() => felt.current?.getAnimations?.({ subtree: true }).forEach((x) => (x.playbackRate = fart)));
    setEffekter(tr.effekter.map((e) => ({ ...e, id: ++effektNr.current })));
    if (tr.linje) setLinje(t(tr.linje.noegle as TekstId, tr.linje.vaerdier));
    if (tr.fjendeLiv || tr.holdLiv)
      setVisLiv((v) => {
        if (!v) return v;
        const fjender = [...v.fjender];
        for (const d of tr.fjendeLiv ?? []) fjender[d.nr] = Math.max(0, fjender[d.nr] + d.delta);
        const hold = { ...v.hold };
        for (const d of tr.holdLiv ?? []) {
          const m = kamp.hold.find((x) => x.id === d.id);
          hold[d.id] = Math.max(0, Math.min(m?.maks ?? 99, (hold[d.id] ?? 0) + d.delta));
        }
        return { fjender, hold };
      });
    if (tr.ryst) setRyst((r) => ({ fjender: tr.ryst?.fjender ?? [], hold: tr.ryst?.hold ?? [], skaerm: !!tr.ryst?.skaerm && !daempet, nr: r.nr + 1 }));
    if (tr.oploest) {
      setOploest((o) => [...new Set([...o, ...tr.oploest!])]);
      setSmelter((x) => [...x, ...tr.oploest!]);
    }
    if (tr.faldet) setFaldet((f) => [...new Set([...f, ...tr.faldet!])]);
    a.ur = window.setTimeout(naesteTrin, tr.varighed / fart);
  }

  /** Spring animationerne over: alt sker med det samme. */
  function springOver() {
    const a = afspilning.current;
    if (a.ur !== null) window.clearTimeout(a.ur);
    a.i = a.trin.length;
    a.slut?.();
  }

  /** Avataren har handlet: væsnerne svarer igen, og det hele spilles. */
  function afslutRunde(efterAvatar: Kamp, foer: Haendelse[]) {
    let k2 = efterAvatar;
    let alle = [...foer];
    if (!k2.udfald) {
      const r = fjendensTur(k2, Math.random);
      k2 = r.kamp;
      alle = [...alle, ...r.haendelser];
    }
    if (k2.udfald) alle = alle.filter((h) => h.type !== 'kombi');
    if (k2.givet !== kamp.givet) onFremskridt(k2.givet);
    afspil(alle, k2);
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
    setLinje(null);
    setVisning({ type: 'opgave', slag, stort, fjende, opgave, vaek, svaret: null, forklaret: false });
  }

  function svar(valg: string) {
    if (visning.type !== 'opgave' || visning.svaret || visning.vaek.includes(valg)) return;
    const rigtigt = tjekKamp(visning.opgave, valg);
    onSvar(visning.opgave.faerdighed ?? SLAG_FAERDIGHED[visning.slag], rigtigt, 1);
    spilEffekt(rigtigt ? 'rigtig' : 'forkert');
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

  function evneIOpgave(evne: 'forklar' | 'visk' | 'fejl') {
    if (visning.type !== 'opgave' || visning.svaret) return;
    const r = brugEvne(kamp, evne);
    if (!r.haendelser.length) return;
    setKamp(r.kamp);
    if (evne === 'forklar') setVisning({ ...visning, forklaret: true });
    else {
      const m = viskUd(visning.opgave, visning.vaek, Math.random);
      setVisning({ ...visning, vaek: m ? [...visning.vaek, m] : visning.vaek });
      if (evne === 'fejl') setNotat(m ? t('kamp.klatten.fejl', { ord: m }) : t('kamp.klatten.ingen'));
      else setNotat(m ? t('kamp.vims.visk') : t('kamp.vims.ingen'));
    }
  }

  /** Hjælpernes evner koster ikke avatarens tur. lap og slet bliver også vist som en animation. */
  function evneIMenu(evne: EvneId, v: { hvem?: MedlemId; fjende?: number } = {}) {
    const r = brugEvne(kamp, evne, v);
    if (!r.haendelser.length) return;
    if (evne === 'visk') {
      viskNaeste.current = true;
      setKamp(r.kamp);
      setNotat(t('kamp.kort.visk'));
      setVisning({ type: 'menu' });
      return;
    }
    afspil(r.haendelser, r.kamp);
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
    if (visning.type === 'afspil') springOver();
    onFremskridt(kamp.givet);
    onPause();
  }

  const livFjende = (nr: number) => visLiv?.fjender[nr] ?? kamp.fjender[nr].liv;
  const livMedlem = (id: MedlemId) => visLiv?.hold[id] ?? kamp.hold.find((m) => m.id === id)?.liv ?? 0;
  const varselSkade = (nr: number) => {
    const v = kamp.fjender[nr].varsel;
    return v ? (daempet ? Math.ceil(v.skade / 2) : v.skade) : 0;
  };
  const varselTekst = (nr: number) => {
    const f = kamp.fjender[nr];
    if (!f.varsel || f.liv <= 0) return null;
    return t(`kamp.varsel.${f.varsel.angreb}` as TekstId, { navn: navne[nr], hvem: medlemNavn(f.varsel.maal ?? 'avatar'), skade: varselSkade(nr) });
  };
  /** Hvem væsnerne sigter på i næste runde. Vises som et rødt sigte over figuren. */
  const sigtet = useMemo(() => {
    const s = new Set<MedlemId>();
    for (const f of kamp.fjender) {
      if (!f.varsel || f.liv <= 0) continue;
      if (f.varsel.alle) kamp.hold.filter((m) => m.liv > 0).forEach((m) => s.add(m.id));
      else s.add(f.varsel.maal ?? 'avatar');
    }
    return s;
  }, [kamp]);

  const tilbage = (
    <button type="button" className="knap knap-diskret" onClick={() => setVisning({ type: 'menu' })}>
      {t('kamp.tilbage')}
    </button>
  );

  const fjendeKnapper = (handling: (nr: number) => void, kun?: (nr: number) => boolean) => (
    <div className="kamp-menu" onKeyDown={piletaster}>
      {kamp.fjender.map((f, i) =>
        f.liv > 0 && (!kun || kun(f.nr)) ? (
          <button
            key={f.nr}
            type="button"
            className="knap"
            autoFocus={i === kamp.fjender.findIndex((x) => x.liv > 0)}
            onClick={() => handling(f.nr)}
            onFocus={() => setPeg(f.nr)}
            onMouseEnter={() => setPeg(f.nr)}
          >
            {navne[f.nr]}
          </button>
        ) : null,
      )}
      {tilbage}
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
  const slut = visning.type === 'slut' ? kamp.udfald : null;

  let menu: ReactNode = null;
  if (visning.type === 'menu')
    menu = (
      <fieldset className="kamp-menu kamp-hovedmenu" onKeyDown={piletaster}>
        <legend className="sr-only">{t('kamp.hvad')}</legend>
        <button type="button" className="knap knap-primaer" onClick={() => setVisning({ type: 'slag' })} autoFocus>
          {t('kamp.menu.slaa')}
        </button>
        <button type="button" className="knap" onClick={() => setVisning({ type: 'lyt' })}>
          {t('kamp.lyt')}
        </button>
        <button
          type="button"
          className="knap"
          onClick={() => {
            const r = forsvar(kamp);
            afslutRunde(r.kamp, r.haendelser);
          }}
        >
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
            <button key={`stort-${s}`} type="button" className="knap knap-primaer kamp-stort" onClick={() => vaelgSlag(s, true)}>
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
    const evner: EvneId[] = [
      ...(hjaelpere.includes('aeseloere') ? (['lap'] as const) : []),
      ...(hjaelpere.includes('vims') ? (['visk', 'slet'] as const) : []),
      ...(hjaelpere.includes('klatten') ? (['skjul'] as const) : []),
    ];
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

  return (
    <Modal titel={t('kamp.titel')} onLuk={gaaVaek} klasse={`kamp kampscene${daempet ? ' mild' : ''}`}>
      {/* Til gennemspilningen: hvilken opgave, der vises (ikke svaret). */}
      {o && <span hidden data-opgave-id={o.opgave.id} data-opgave-vaesen={o.opgave.vaesen} />}
      <h2 className="sr-only">{t('kamp.titel')}</h2>

      <div className="kamp-skaerm" data-fase={visning.type}>
        {overgang && (
          <div className="kamp-overgang" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${(i % 5) * 40}ms` }} />
            ))}
          </div>
        )}
        <div className="kamp-felt" ref={felt}>
          {baggrund && <img className="kamp-lag" src={baggrund} alt="" aria-hidden="true" />}

          {kamp.fjender.map((f) => {
            const sted = fjendeSted(f.nr);
            const kort = SPRITE_SPEJLET[f.vaesen];
            const vaek = oploest.includes(f.nr);
            const ramt = ryst.fjender.includes(f.nr);
            const liv = livFjende(f.nr);
            const [ex, ey] = procent([sted[0], sted[1] - kort.raekker.length * FJENDE_SKALA - 4]);
            return (
              <div key={f.nr}>
                <img
                  key={`${f.nr}-${ramt ? ryst.nr : 0}-${vaek}`}
                  className={`kamp-sprite kamp-fjende${vaek ? (smelter.includes(f.nr) && visning.type === 'afspil' ? ' rolig' : ' borte') : ramt ? ' ramt' : ''}${f.lammet && !vaek ? ' lammet' : ''}`}
                  src={uri(`vaesen.spejlet.${f.vaesen}`, kort)}
                  alt=""
                  aria-hidden="true"
                  style={plads(sted, kort, FJENDE_SKALA)}
                />
                {!vaek && (
                  <div className={`kamp-etiket kamp-fjende-etiket${liv <= 0 ? ' rolig' : ''}`} style={{ left: `${ex}%`, top: `${ey}%` }}>
                    <span className="kamp-navn">{navne[f.nr]}</span>
                    <span className="kamp-maaler" aria-hidden="true">
                      <span style={{ width: `${(liv / f.maks) * 100}%` }} />
                    </span>
                    <span className="sr-only">{t('kamp.liv', { liv, maks: f.maks })}</span>
                    {kendt.includes(f.nr) && <span className="kamp-svag">{t(`kamp.svaghed.${SVAGHED[f.vaesen]}` as TekstId)}</span>}
                    {f.varsel && liv > 0 && visning.type !== 'afspil' && !slut && (
                      <span className={`kamp-varsel${f.varsel.alle ? ' alle' : ''}`} title={varselTekst(f.nr) ?? ''}>
                        <span aria-hidden="true">{f.varsel.alle ? '⚡' : '⚔'} </span>
                        {f.varsel.alle ? t('kamp.varsel.kort.alle', { skade: varselSkade(f.nr) }) : t('kamp.varsel.kort', { hvem: medlemNavn(f.varsel.maal ?? 'avatar'), skade: varselSkade(f.nr) })}
                        <span className="sr-only">{varselTekst(f.nr)}</span>
                      </span>
                    )}
                  </div>
                )}
                {peg === f.nr && !vaek && !slut && visning.type !== 'afspil' && (
                  <img className="kamp-sprite kamp-markoer" src={uri('markoer', MARKOER)} alt="" aria-hidden="true" style={plads([sted[0] - 28, sted[1] - 14], MARKOER, 2)} />
                )}
              </div>
            );
          })}

          {kamp.hold.map((m, i) => {
            const kort = holdKort[m.id];
            const ramt = ryst.hold.includes(m.id);
            const nede = faldet.includes(m.id) && livMedlem(m.id) <= 0;
            return (
              <div key={m.id}>
                <img
                  key={`${m.id}-${ramt ? ryst.nr : 0}`}
                  className={`kamp-sprite kamp-medlem${nede ? ' faldet' : ''}${ramt ? ' ramt' : ''}${slut === 'vundet' ? ' jubler' : ''}`}
                  src={uri(m.id === 'avatar' ? `avatar.hoejre.${JSON.stringify(avatar)}` : `medlem.spejlet.${m.id}`, kort)}
                  alt=""
                  aria-hidden="true"
                  style={{ ...plads(HOLD_PLADS[i], kort, HOLD_SKALA), animationDelay: `${i * 0.2}s` }}
                />
                {sigtet.has(m.id) && visning.type !== 'afspil' && !slut && (
                  <span className="kamp-sigte" aria-hidden="true" style={{ left: `${midtMedlem(m.id)[0]}%`, top: `${midtMedlem(m.id)[1]}%` }} />
                )}
              </div>
            );
          })}

          <div className="kamp-effekter" aria-hidden="true">
            {effekter.map((e) => (
              <span
                key={e.id}
                className={`fx fx-${e.type}${e.slags ? ` fx-${e.slags}` : ''}`}
                style={
                  {
                    left: `${e.x}%`,
                    top: `${e.y}%`,
                    '--dx': `${(e.tx ?? e.x) - e.x}`,
                    '--dy': `${(e.ty ?? e.y) - e.y}`,
                  } as CSSProperties
                }
              >
                {e.tekst}
                {['nedslag', 'oploes', 'krummer', 'lap', 'sejr', 'kombi', 'angreb-stjael'].includes(e.type) &&
                  STYKKER.map((s, j) => <i key={j} style={{ '--a': `${s.a}deg`, '--r': s.r } as CSSProperties} />)}
                {e.type === 'ordplads' && [0, 1, 2, 3, 4].map((j) => <b key={j} style={{ '--j': j } as CSSProperties} />)}
              </span>
            ))}
          </div>

          {visning.type === 'afspil' && (
            <button type="button" className="kamp-spring" onClick={springOver}>
              {t('kamp.spring')}
            </button>
          )}
        </div>

        {/* Holdet: navne og liv nederst til højre, som i et rollespil. */}
        <section className="kamp-hud kamp-hold" aria-label={t('kamp.holdet')}>
          <ul>
            {kamp.hold.map((m) => {
              const liv = livMedlem(m.id);
              return (
                <li key={m.id} className={liv <= 0 ? 'faldet' : ''}>
                  <span className="kamp-navn">{medlemNavn(m.id)}</span>
                  <span className={`kamp-maaler liv${liv / m.maks <= 0.34 ? ' lav' : ''}`} aria-hidden="true">
                    <span style={{ width: `${(liv / m.maks) * 100}%` }} />
                  </span>
                  <span className="kamp-tal">{t('kamp.liv.kort', { liv, maks: m.maks })}</span>
                </li>
              );
            })}
          </ul>
          {!kamp.udfald && <p className={`kamp-kombi${stortSlagKlar(kamp) ? ' klar' : ''}`}>{stortSlagKlar(kamp) ? t('kamp.stort.klar') : t('kamp.kombi', { antal: kamp.kombi, maks: KOMBI })}</p>}
        </section>

        {/* Den korte linje: hvad der lige skete. */}
        {linje && (visning.type === 'afspil' || slut) && (
          <div className="kamp-linje" aria-live="polite">
            <p>{linje}</p>
          </div>
        )}

        {/* Menuen eller opgaven nederst til venstre. */}
        {visning.type !== 'afspil' && !slut && (
          <section className={`kamp-hud kamp-styring${o ? ' kamp-opgave-kort' : ''}`}>
            {o ? (
              <div className="opgave-krop kamp-opgave">
                <p className="naeste-overskrift">
                  {o.stort ? t('kamp.slag.stort', { slag: t(`kamp.slag.${o.slag}` as TekstId) }) : `${t(`kamp.slag.${o.slag}` as TekstId)} - ${navne[o.fjende]}`}
                </p>
                <p className="kamp-saetning">
                  {o.opgave.foer}
                  <mark>{o.opgave.vist}</mark>
                  {o.opgave.efter}
                </p>
                <p className="kamp-spoergsmaal">{t(k(o.opgave, 'spoergsmaal'), { ord: o.opgave.ord, vist: o.opgave.vist })}</p>
                {o.forklaret && regel && (
                  <div className="besked besked-info regel">
                    <p>
                      <strong>{t('feedback.regel')}:</strong> {regel.regel}
                    </p>
                    <p>
                      <strong>{t('feedback.eksempel')}:</strong> {regel.eksempel}
                    </p>
                    {/* Æseløre siger selv reglen, når eleven beder ham forklare den (Henrik, 10. november 2026). */}
                    <LaesOpKnap auto dele={beskedDele('', regel, null, false)} />
                  </div>
                )}
                <div className="kamp-muligheder">
                  {o.opgave.muligheder.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`knap kamp-mulighed${o.svaret && m === o.opgave.svar ? ' rigtig' : ''}${o.svaret === m && m !== o.opgave.svar ? ' forkert' : ''}`}
                      disabled={o.vaek.includes(m) || !!o.svaret}
                      onClick={() => svar(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {!o.svaret ? (
                  <div className="knaprad kamp-hjaelperad">
                    <LaesOpKnap tekst={o.opgave.saetning} figur="fortaeller" etiket={t('kamp.laes')} />
                    <button type="button" className="knap knap-lille" onClick={() => setNotat(t(k(o.opgave, 'lyt')))}>
                      {t('kamp.lyt')}
                    </button>
                    {hjaelpere.includes('aeseloere') && (
                      <button type="button" className="knap knap-lille" disabled={!kanBrugeEvne(kamp, 'forklar') || o.forklaret} onClick={() => evneIOpgave('forklar')}>
                        {t('kamp.evne.forklar', { antal: kamp.evner.forklar ?? 0 })}
                      </button>
                    )}
                    {hjaelpere.includes('vims') && (
                      <button type="button" className="knap knap-lille" disabled={!kanBrugeEvne(kamp, 'visk')} onClick={() => evneIOpgave('visk')}>
                        {t('kamp.evne.visk', { antal: kamp.evner.visk ?? 0 })}
                      </button>
                    )}
                    {hjaelpere.includes('klatten') && (
                      <button type="button" className="knap knap-lille" disabled={!kanBrugeEvne(kamp, 'fejl')} onClick={() => evneIOpgave('fejl')}>
                        {t('kamp.evne.fejl', { antal: kamp.evner.fejl ?? 0 })}
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
                        {rigtigt ? t('kamp.slaa.nu') : t('kamp.videre')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              menu
            )}
            {notat && (
              <div className="besked besked-info kamp-notat" aria-live="polite">
                <p>{notat}</p>
              </div>
            )}
          </section>
        )}

        {/* Slutningen: sejr eller blødt nederlag. */}
        {slut && (
          <section className={`kamp-hud kamp-slut kamp-slut-${slut}`}>
            <p className="kamp-slut-titel">{slut === 'vundet' ? t('kamp.slut.vundet') : t('kamp.slut.slaaet')}</p>
            <p>{slut === 'vundet' ? t('kamp.vundet') : t('kamp.slaaet')}</p>
            <div className="knaprad">
              <LaesOpKnap tekst={slut === 'vundet' ? t('kamp.vundet') : t('kamp.slaaet')} figur="fortaeller" auto />
              {slut === 'vundet' ? (
                <button type="button" className="knap knap-primaer" onClick={onVundet} autoFocus>
                  {t('kamp.videre')}
                </button>
              ) : (
                <button type="button" className="knap knap-primaer" onClick={gaaVaek} autoFocus>
                  {t('kamp.tilbage')}
                </button>
              )}
            </div>
          </section>
        )}

        <button type="button" className="kamp-hjaelp-knap" aria-expanded={hjaelp} onClick={() => setHjaelp((x) => !x)}>
          {t('kamp.hjaelp')}
        </button>
        {hjaelp && (
          <div className="kamp-hud kamp-hjaelp">
            <p>{t('kamp.forklaring')}</p>
            <LaesOpKnap tekst={t('kamp.forklaring')} figur="fortaeller" ikon />
          </div>
        )}
      </div>
    </Modal>
  );
}
