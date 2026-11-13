import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { avatarnavn, harTekst, hentKapitel, kapitler, t, type DialogValg, type OrdOpgaveArt, type Replik, type RumFund, type RumTrin, type Trin, type ValgMulighed } from '../content';
import { erFaerdighed, type FaerdighedId } from '../engine/faerdigheder';
import { opfyldt, udvaelg } from '../engine/betingelse';
import type { GemtSpil, Indstillinger } from '../engine/gem';
import { afslutTrin, aktueltSted, aktueltTrin, kapitelSlut } from '../engine/kapitel';
import { MAKS_VENLIGHED, minderFor, nyeTing, taskeFor, type TingId } from '../engine/taske';
import { antalBlade, bladFundet, medSkaar, missionFor, missionStartet, missionStatus, skjulteBlade } from '../engine/frivillig';
import { KampVindue } from '../ui/KampVindue';
import { registrerSvar, type Haendelse } from '../engine/tilpasning';
import { PhaserVerden, type BaneStyring } from '../game/PhaserVerden';
import { erMinde, mindeTitel, SKAAR_MINDE, skaarMinder, type MindeId } from '../content/minder';
import { OrdOpgaveVindue } from '../ui/OrdOpgaveVindue';
import { DialogBoks } from '../ui/DialogBoks';
import { Kvittering } from '../ui/Kvittering';
import { Overgang, type OvergangType } from '../ui/Overgang';
import { Tilbageblik } from '../ui/Tilbageblik';
import { saetMusikOverride } from '../ui/musik/afspiller';
import { FundVindue, KodeVindue, ManglerVindue } from '../ui/RumVindue';
import { NyTingBesked, TaskeVindue } from '../ui/TaskeVindue';
import { LaesOpKnap } from '../ui/Tekst';
import { Ydelse } from '../ui/Ydelse';
import { BevisjagtVindue, OpgaveVindue } from './OpgaveVindue';
import { spilEffekt } from '../ui/effekter';
import { skalaFraAdresse } from '../game/KortScene';
import { ALLE_SKAAR } from '../engine/betingelse';

type Props = {
  spil: GemtSpil;
  opdater: (s: GemtSpil) => void;
  indstillinger: Indstillinger;
  andetVindueAabent: boolean;
  onMenu: () => void;
  onDelSlut: (del: number) => void;
  onKapitelSlut: () => void;
  /** Fin grafik gik for langsomt: skift til hurtig grafik. */
  onLangsomGrafik?: () => void;
};

/** Kun de replikker og valgmuligheder, hvis betingelse er opfyldt. */
function tilpasDialog(replikker: Replik[], valg: DialogValg | undefined, spil: GemtSpil): { replikker: Replik[]; valg?: DialogValg } {
  return {
    replikker: udvaelg(replikker, spil),
    valg: !valg || !opfyldt(valg.hvis, spil) ? undefined : { ...valg, muligheder: udvaelg(valg.muligheder, spil).map((m) => ({ ...m, replikker: udvaelg(m.replikker, spil) })) },
  };
}

/** Hvilken færdighed en lille ordopgave øver (ordsten og sidemissioner). */
function ordFaerdighed(art: OrdOpgaveArt | undefined): FaerdighedId {
  if (art === 'rim' || art === 'ikkerim') return 'laes.rim';
  if (art === 'fortaeller') return 'fort.fortaeller_tid';
  if (art === 'stavning') return 'stav.vokal_dobbeltkonsonant';
  if (art === 'genre') return 'laes.forstaaelse';
  return 'laes.ordforraad';
}

const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

export function Verden({ spil, opdater, indstillinger, andetVindueAabent, onMenu, onDelSlut, onKapitelSlut, onLangsomGrafik }: Props) {
  const kapitel = hentKapitel(spil.kapitel)!;
  const trin = aktueltTrin(spil, kapitel);
  const slut = kapitelSlut(spil, kapitel);
  // Udflugt (Henrik, 9. november 2026): et frivilligt sted, fx en svær platformbane. Er ikke et trin og gemmes ikke.
  const [udflugt, setUdflugt] = useState<string | null>(null);
  const stedId = udflugt ?? aktueltSted(spil, kapitel);
  const forrigeSted = useRef(stedId);
  const sted = kapitel.steder[stedId];
  const [aktivtTrin, setAktivtTrin] = useState<Trin | null>(null);
  // Frivillige minder (Henrik, 8. november 2026): et tilbageblik afbryder ikke dialogen. Eleven får besked
  // og kan se mindet nu eller senere i tasken.
  const [nytMinde, setNytMinde] = useState<MindeId | null>(null);
  const [visMinde, setVisMinde] = useState<MindeId | null>(null);
  const skjulMinde = useCallback(() => setNytMinde(null), []);
  // Overgang mellem steder (8. november 2026): portalen fra kælderen til Pennedal, ellers et kort blækstrøg.
  const [overgang, setOvergang] = useState<{ type: OvergangType; nr: number } | null>(null);
  const slutOvergang = useCallback(() => setOvergang(null), []);
  useEffect(() => {
    const fra = forrigeSted.current;
    forrigeSted.current = stedId;
    if (fra === stedId) return;
    spilEffekt('sted');
    setOvergang((o) => ({ type: fra === 'kaelder' && stedId === 'pennedal' ? 'portal' : 'skift', nr: (o?.nr ?? 0) + 1 }));
  }, [stedId]);
  const [naer, setNaer] = useState<string | null>(null);
  const [hint, setHint] = useState<{ x: number; y: number } | null>(null);
  const [forskraek, setForskraek] = useState(0);
  /** Den, der taler i dialogen lige nu. Kameraet zoomer ind på dem. */
  const [taler, setTaler] = useState<string | null>(null);
  const [uhyggeBesked, setUhyggeBesked] = useState('');
  const fpsRef = useRef<() => number>(() => 0);
  const gaaTilRef = useRef<((id: string) => void) | null>(null);
  const spillerXRef = useRef<(() => number) | null>(null);
  const baneKameraRef = useRef<(() => { x: number; y: number; sx: number; sy: number } | null) | null>(null);
  // Til test (kun med ?hop): lad gennemspilningen gå hen til et objekt og undersøge det.
  useEffect(() => {
    if (typeof location === 'undefined' || !new URLSearchParams(location.search).has('hop')) return;
    (window as unknown as { __pennedal?: unknown }).__pennedal = {
      gaaTil: (id: string) => gaaTilRef.current?.(id),
      spillerX: () => spillerXRef.current?.() ?? NaN,
      baneKamera: () => baneKameraRef.current?.() ?? null,
    };
  }, []);
  const baneRef = useRef<BaneStyring | null>(null);
  /** Viskeskovens bane: den ordsten, eleven står ved og svarer på. */
  const [ordsten, setOrdsten] = useState<number | null>(null);
  /** Sidemissionens opgave til sidst (Halvsangens sang). */
  const [missionOpgave, setMissionOpgave] = useState<string | null>(null);
  /** Steder, hvis intro er vist i denne omgang. */
  const [introVist, setIntroVist] = useState<string[]>([]);
  /** Platformbane: Æseløre tilbyder hjælp efter nogle fald. */
  const [hjaelp, setHjaelp] = useState(false);
  const spilRef = useRef(spil);
  spilRef.current = spil;

  // Tasken regnes ud fra, hvor langt eleven er (se src/engine/taske.ts).
  const tingITasken = useMemo(() => taskeFor(spil, kapitler), [spil.kapitel, spil.trin, spil.valg]);
  const [visTaske, setVisTaske] = useState(false);
  // Grafik (10. november 2026): fin som standard, hurtig hvis eleven har valgt det, eller spillet har skiftet selv.
  // Under automatiske test er den hurtig, medmindre ?skala står i adressen.
  const skala = skalaFraAdresse() ?? (indstillinger.grafik === 'hurtig' || navigator.webdriver ? 1 : 2);
  /** Den dialog, der er vist på skærmen. En ny dialog starter først, når andre vinduer er lukket. */
  const [dialogIGang, setDialogIGang] = useState<string | null>(null);
  useEffect(() => {
    if (!aktivtTrin) setDialogIGang(null);
    else if (aktivtTrin.type === 'dialog' && !overgang && !andetVindueAabent) setDialogIGang(aktivtTrin.id);
  }, [aktivtTrin, overgang, andetVindueAabent]);
  /**
   * Et skår flyver op i tasken (Henrik, 10. november 2026): et lysende stykke papir flyver fra midten af skærmen hen
   * til knappen Taske, som derefter pulserer. Slået fra med reducer bevægelse.
   */
  const taskeKnap = useRef<HTMLButtonElement>(null);
  const [skaarFlyv, setSkaarFlyv] = useState<{ nr: number; x: number; y: number } | null>(null);
  const [taskePuls, setTaskePuls] = useState(false);
  function flyvTilTasken() {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = taskeKnap.current?.getBoundingClientRect();
    if (!r) return;
    setSkaarFlyv((f) => ({ nr: (f?.nr ?? 0) + 1, x: r.left + r.width / 2, y: r.top + r.height / 2 }));
    window.setTimeout(() => {
      setSkaarFlyv(null);
      setTaskePuls(true);
      window.setTimeout(() => setTaskePuls(false), 900);
    }, 1100);
  }
  const [nyTing, setNyTing] = useState<TingId | null>(null);
  const forrigeTaske = useRef(tingITasken);
  useEffect(() => {
    const nye = nyeTing(forrigeTaske.current, tingITasken);
    forrigeTaske.current = tingITasken;
    if (nye.length > 0) setNyTing(nye[nye.length - 1]);
  }, [tingITasken]);
  const glemNyTing = useCallback(() => setNyTing(null), []);

  // Escape room: alt i rummet kan undersøges, og fundene kommer i tasken (gemt i spil.valg).
  const rum = trin?.type === 'rum' ? trin : null;
  const [rumVindue, setRumVindue] = useState<{ type: 'fund'; fund: RumFund } | { type: 'mangler' } | { type: 'kode' } | null>(null);
  const aktive = rum && !aktivtTrin ? [...rum.fund.map((f) => f.objekt), rum.laas.objekt] : undefined;
  const taske = Object.keys(spil.valg)
    .filter((k) => k.startsWith('taske.'))
    .map((k) => k.slice(6));

  // Platformbane: er målet (skift-trinnet med objektet maal på stedet) allerede klaret?
  const maalNr = kapitel.trin.findIndex((x) => x.sted === stedId && x.objekt === 'maal');
  const baneKlaret = !udflugt && !!sted.bane && maalNr >= 0 && spil.trin > maalNr;
  const aktivtObjekt = udflugt ? 'maal' : trin && !aktivtTrin ? trin.objekt : null;
  // Objekter, der er forsvundet, fordi kapitlet er nået forbi deres skjulFra-trin.
  const skjulteObjekter = sted.objekter
    .filter((o) => {
      if (o.hvis && !opfyldt(o.hvis, spil)) return true;
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
  // Han vises først, når skuffen bliver åbnet (fuglFra-trinnets dialog), ikke allerede når man træder ind i kælderen.
  // Kapitel 7: har eleven ikke tilgivet Æseløre, går han med Den Ufærdige for en stund (fuglVaek).
  const vaekNr = kapitel.fuglVaek ? kapitel.trin.findIndex((t) => t.id === kapitel.fuglVaek!.fra) : -1;
  const fuglVaek = vaekNr >= 0 && spil.trin > vaekNr && opfyldt(kapitel.fuglVaek!.hvis, spil);
  const fuglSkjult = fuglVaek || (fuglNr >= 0 && (spil.trin < fuglNr || (spil.trin === fuglNr && aktivtTrin?.id !== kapitel.fuglFra)));
  // Sidder Æseløre selv på kortet (kapitel 6, ved søen), følger han ikke efter hovedpersonen imens.
  const fuglPaaKortet = sted.objekter.some((o) => o.form === 'fugl' && o.felt && !skjulteObjekter.includes(o.id));
  const skjulte = [...(fuglSkjult || fuglPaaKortet ? [...skjulteObjekter, 'aeseloere'] : skjulteObjekter), ...skjulteBlade(spil, kapitel)];

  // Tal igen (Henrik, 1. november 2026): den, man har talt med på dette sted, kan man gå hen til igen
  // og høre den seneste samtale. Et valg vises med den mulighed, eleven valgte.
  const gentag = useMemo(() => {
    const m: Record<string, Replik[]> = {};
    for (const t of kapitel.trin.slice(0, spil.trin)) {
      if (t.type !== 'dialog' || !t.objekt || t.sted !== stedId) continue;
      const valgt = t.valg?.muligheder.find((v) => (v.saet ? spil.valg[v.saet] === 'ja' : false)) ?? t.valg?.muligheder.find((v) => !v.saet);
      m[t.objekt] = valgt ? [...t.replikker, ...valgt.replikker] : t.replikker;
    }
    return m;
  }, [kapitel, spil.trin, spil.valg, stedId]);
  /** En dialog uden for trinnene: tal igen, sidemissionen eller en udflugt. efter kaldes, når den lukker. */
  const [gentagelse, setGentagelse] = useState<{ replikker: Replik[]; valg?: DialogValg; efter?: (valgt: ValgMulighed | null) => void } | null>(null);
  // Replikker og valg med betingelser (hvis) vælges, når dialogen starter, så listen ikke ændrer sig undervejs,
  // fx når et valg giver venlighed.
  const gentagDialog = useMemo(() => (gentagelse ? tilpasDialog(gentagelse.replikker, gentagelse.valg, spilRef.current) : null), [gentagelse]);
  const trinDialog = useMemo(
    () => (aktivtTrin?.type === 'dialog' ? tilpasDialog(aktivtTrin.replikker, aktivtTrin.valg, spilRef.current) : null),
    [aktivtTrin],
  );
  const gentagValg = useRef<ValgMulighed | null>(null);
  const kanGentages = Object.keys(gentag).filter((id) => !skjulte.includes(id) && id !== trin?.objekt && sted.objekter.some((o) => o.id === id && o.felt));
  // Frivillige ting på stedet: kan undersøges når som helst, også når kapitlet er slut.
  const frivillige = udflugt ? [] : sted.objekter.filter((o) => o.frivillig && o.felt && !skjulte.includes(o.id)).map((o) => o.id);
  // I et rum kan de frivillige ting (sidemissionen, bladene, udflugten) også undersøges.
  const undersoegbare = aktive
    ? [...aktive, ...frivillige.filter((id) => !aktive.includes(id))]
    : (kanGentages.length || frivillige.length
      ? [...(aktivtObjekt && !slut ? [aktivtObjekt] : []), ...(slut ? [] : kanGentages), ...frivillige]
      : undefined);
  /** Navnet på det, opgaven handler om (knappen i panelet). */
  const aktivtNavn = sted.objekter.find((o) => o.id === aktivtObjekt)?.navn;
  /** Navnet på det, hovedpersonen står ved og kan undersøge lige nu. */
  const objektNavn = sted.objekter.find((o) => o.id === (rum || (naer && (kanGentages.includes(naer) || frivillige.includes(naer))) ? naer : aktivtObjekt))?.navn;

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
    if (!udflugt && trin && trin.objekt === null && trin.type !== 'rum' && !aktivtTrin && !andetVindueAabent) startTrin(trin);
  }, [trin, aktivtTrin, andetVindueAabent, startTrin, udflugt]);

  // Et sted med intro (fx Viskeskovens bane): Æseløre forklarer, første gang man kommer dertil i denne omgang.
  useEffect(() => {
    if (!sted.intro || baneKlaret || introVist.includes(stedId) || aktivtTrin || andetVindueAabent || gentagelse) return;
    setIntroVist((v) => [...v, stedId]);
    setGentagelse({ replikker: sted.intro });
  }, [stedId, sted.intro, baneKlaret, introVist, aktivtTrin, andetVindueAabent, gentagelse]);

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

  /** Et nyt hukommelsesskår: gem det og vis en besked med mindet. */
  function nytSkaar(skaar: string) {
    spilEffekt('skaar');
    flyvTilTasken();
    const s = spilRef.current;
    const nyt = medSkaar(s, skaar);
    spilRef.current = nyt;
    opdater(nyt);
    const minde = SKAAR_MINDE[skaar];
    if (minde) setNytSkaar(minde);
  }
  const [nytSkaarMinde, setNytSkaar] = useState<MindeId | null>(null);
  const skjulSkaar = useCallback(() => setNytSkaar(null), []);
  const [bladBesked, setBladBesked] = useState<string | null>(null);
  const skjulBlad = useCallback(() => setBladBesked(null), []);

  /** Frivillige ting: sidemissionen, bladene og indgangen til en udflugt. */
  function frivilligHandling(id: string) {
    const o = sted.objekter.find((x) => x.id === id);
    if (!o) return;
    if (o.frivillig === 'udflugt' && o.udflugt) {
      const u = kapitel.steder[o.udflugt]?.udflugt;
      if (!u) return;
      setGentagelse({
        replikker: u.ind,
        valg: { spoergsmaal: u.spoergsmaal, muligheder: [{ tekst: u.ja, replikker: [] }, { tekst: u.nej, replikker: [] }] },
        efter: (m) => {
          if (m?.tekst === u.ja) {
            setHjaelp(false);
            setUdflugt(o.udflugt!);
          }
        },
      });
      return;
    }
    const mf = missionFor(kapitel, id);
    if (!mf) return;
    const { id: mid, mission } = mf;
    const s = spilRef.current;
    const status = missionStatus(s, mid, mission);
    if (o.frivillig === 'blad') {
      if (status !== 'samler' || s.valg[bladFundet(id)] === 'ja') return;
      const nyt: GemtSpil = { ...s, valg: { ...s.valg, [bladFundet(id)]: 'ja' } };
      spilRef.current = nyt;
      opdater(nyt);
      const egen = `mission.blad.${mid}`;
      setBladBesked(t(harTekst(egen) ? egen : 'mission.blad', { antal: antalBlade(nyt, mission), ialt: mission.blade.length }));
      return;
    }
    if (status === 'ny') {
      const nyt: GemtSpil = { ...s, valg: { ...s.valg, [missionStartet(mid)]: 'ja' } };
      spilRef.current = nyt;
      opdater(nyt);
      // Uden blade at samle kommer opgaven lige efter samtalen (Rimfods sætning).
      setGentagelse({ replikker: mission.start, efter: mission.blade.length === 0 ? () => setMissionOpgave(mid) : undefined });
    } else if (status === 'samler') setGentagelse({ replikker: mission.mangler });
    else if (status === 'klar') setGentagelse({ replikker: mission.klar, efter: () => setMissionOpgave(mid) });
    else setGentagelse({ replikker: mission.efter });
  }

  /** Udflugten er klaret: skåret (første gang), en kort dialog, og så tilbage. */
  function udflugtKlaret() {
    const u = udflugt ? kapitel.steder[udflugt]?.udflugt : undefined;
    if (!u) return;
    const foerste = !spilRef.current.skaar.includes(u.skaar);
    setGentagelse({
      replikker: foerste ? u.faerdig : u.igen,
      efter: () => {
        setUdflugt(null);
        setHjaelp(false);
        if (foerste) nytSkaar(u.skaar);
      },
    });
  }

  function interaktion(id: string) {
    if (udflugt) {
      if (id === 'maal' && !gentagelse) udflugtKlaret();
      return;
    }
    if (!aktivtTrin && !andetVindueAabent && !gentagelse && !rumVindue && frivillige.includes(id) && id !== trin?.objekt) {
      frivilligHandling(id);
      return;
    }
    if (rum && !aktivtTrin && !rumVindue && !andetVindueAabent && aktive?.includes(id)) {
      rumHandling(rum, id);
      return;
    }
    if (!aktivtTrin && !andetVindueAabent && !gentagelse && !rum && trin?.objekt !== id && gentag[id] && kanGentages.includes(id)) {
      setGentagelse({ replikker: gentag[id] });
      return;
    }
    if (aktivtTrin || andetVindueAabent || gentagelse || !trin || trin.objekt !== id) return;
    startTrin(trin);
  }

  /** Et valg i en dialog: gemmes i spil.valg, og venlighed lægges til Klattens venlighed. */
  function vaelg(m: ValgMulighed) {
    const s = spilRef.current;
    const nyt: GemtSpil = {
      ...s,
      valg: m.saet ? { ...s.valg, [m.saet]: 'ja' } : s.valg,
      venlighed: Math.min(MAKS_VENLIGHED, s.venlighed + (m.venlighed ?? 0)),
    };
    spilRef.current = nyt;
    opdater(nyt);
  }

  const niveauFor = (faerdighed: string) => spil.faerdigheder[faerdighed as keyof GemtSpil['faerdigheder']]?.niveau ?? 1;

  /** Kampen gemmer den skade, holdet har givet væsnerne, så den kan fortsætte senere (højst 98). */
  function kampFremskridt(givet: number) {
    const nyt: GemtSpil = { ...spilRef.current, trinFremskridt: Math.min(98, Math.max(0, givet)) };
    spilRef.current = nyt;
    opdater(nyt);
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

  const laast = !!aktivtTrin || andetVindueAabent || !!rumVindue || visTaske || !!gentagelse || ordsten !== null || !!missionOpgave;
  const minder = [...minderFor(spil, kapitler), ...skaarMinder(spil.skaar)];
  const udflugtInfo = udflugt ? sted.udflugt : undefined;

  return (
    <main className={`verden tema-${sted.tema}${moerke ? ' moerke' : ''}${moerke && indstillinger.mindreUhygge ? ' moerke-mild' : ''}`}>
      <div className="spilflade-ramme">
        <PhaserVerden
          key={`skala-${skala}`}
          skala={skala}
          onLangsom={onLangsomGrafik}
          stedId={stedId}
          sted={sted}
          aktiv={aktivtObjekt}
          aktive={undersoegbare}
          baneKlaret={baneKlaret}
          svaer={!!udflugt}
          avatar={spil.avatar}
          skjulte={skjulte}
          laast={laast}
          mindreUhygge={indstillinger.mindreUhygge}
          forskraekSignal={forskraek}
          taler={taler}
          kroge={{ onInteraktion: interaktion, onNaer: setNaer, onHint: setHint, onHjaelp: setHjaelp, onOrdsten: setOrdsten }}
          label={t('verden.sted', { sted: sted.navn })}
          fpsRef={fpsRef}
          baneRef={baneRef}
          gaaTilRef={gaaTilRef}
          spillerXRef={spillerXRef}
          baneKameraRef={baneKameraRef}
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
        <NyTingBesked ting={nyTing} onFaerdig={glemNyTing} />
        <span className="pladsholder-maerke">{t('verden.pladsholder')}</span>
        {DEBUG && <Ydelse fps={() => fpsRef.current()} />}
      </div>

      <aside className="panel hud">
        <p className="sted-navn">{t('verden.sted', { sted: sted.navn })}</p>
        {udflugtInfo && (
          <>
            <p className="naeste-overskrift">{t('verden.naeste')}</p>
            <p className="naeste-tekst">{udflugtInfo.opgavetekst}</p>
            <p className="lille-tekst">{t('bane.styring')}</p>
            <button type="button" className="knap" onClick={() => setUdflugt(null)}>
              {t('udflugt.tilbage')}
            </button>
          </>
        )}
        {!udflugt && sted.bane && !slut && trin?.objekt === 'maal' && (
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
        {udflugt ? null : slut ? (
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
            {rum.opgavetekst && <LaesOpKnap tekst={rum.opgavetekst} figur="fortaeller" auto={!aktivtTrin && !andetVindueAabent && !rumVindue} ikon />}
            {naer && objektNavn && (
              <button type="button" className="knap knap-primaer hud-handling" disabled={laast} onClick={() => interaktion(naer)}>
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
              <LaesOpKnap tekst={trin.opgavetekst} figur="fortaeller" auto={!aktivtTrin && !andetVindueAabent} ikon />
              {aktivtNavn && (
                <button
                  type="button"
                  className="knap knap-primaer hud-handling"
                  disabled={laast}
                  onClick={() => interaktion(trin.objekt!)}
                >
                  {t('verden.undersoeg', { navn: aktivtNavn })}
                </button>
              )}
              <p className="lille-tekst" aria-live="polite">
                {naer && objektNavn && !laast ? t('verden.tryk.enter', { navn: objektNavn }) : ''}
              </p>
            </>
          )
        )}
        {/* Fuld skærm (Henrik, 8. november 2026): taske og menu står som små knapper i hjørnet over spillet. */}
        <div className="hud-knapper">
          <button
            type="button"
            ref={taskeKnap}
            className={`knap${taskePuls ? ' taske-puls' : ''}`}
            onClick={() => {
              spilEffekt('taske');
              setVisTaske(true);
            }}
            disabled={!!aktivtTrin || !!rumVindue}
          >
            {t('taske.knap')} ({tingITasken.length + taske.length})
          </button>
          <button type="button" className="knap" onClick={onMenu}>
            <span aria-hidden="true">☰ </span>
            {t('verden.menu')}
          </button>
        </div>
        <p className="sr-only" aria-live="assertive">
          {uhyggeBesked}
        </p>
      </aside>

      {skaarFlyv && (
        <span
          key={skaarFlyv.nr}
          className="skaar-flyv"
          aria-hidden="true"
          style={{ '--til-x': `${skaarFlyv.x}px`, '--til-y': `${skaarFlyv.y}px` } as CSSProperties}
        />
      )}
      {visTaske && (
        <TaskeVindue ting={tingITasken} minder={minder} skaar={spil.skaar.length} rumTing={taske.map((k) => spil.valg[`taske.${k}`])} onLuk={() => setVisTaske(false)} />
      )}
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
      {gentagelse && gentagDialog && (
        <DialogBoks
          replikker={gentagDialog.replikker}
          valg={gentagDialog.valg}
          onValg={(m) => (gentagValg.current = m)}
          onFaerdig={() => {
            const efter = gentagelse.efter;
            const valgt = gentagValg.current;
            gentagValg.current = null;
            setGentagelse(null);
            efter?.(valgt);
          }}
          onTaler={setTaler}
        />
      )}
      {ordsten !== null && (
        <OrdOpgaveVindue
          titel={t(sted.ordsten && sted.ordsten !== 'synonym' ? `ordsten.${sted.ordsten}.titel` : 'ordsten.titel')}
          intro={t(sted.ordsten && sted.ordsten !== 'synonym' ? `ordsten.${sted.ordsten}.intro` : 'ordsten.intro')}
          antal={1}
          art={sted.ordsten ?? 'synonym'}
          niveau={niveauFor(ordFaerdighed(sted.ordsten))}
          onSvar={(r, f, fd) => onSvar(fd ?? ordFaerdighed(sted.ordsten), r, f)}
          faerdigTekst={t('ordsten.genskab')}
          pauseTekst={t('ordsten.vaek')}
          onFaerdig={() => {
            baneRef.current?.genskab(ordsten);
            setOrdsten(null);
          }}
          onPause={() => setOrdsten(null)}
        />
      )}
      {missionOpgave && kapitel.missioner?.[missionOpgave] && (
        <OrdOpgaveVindue
          titel={kapitel.missioner[missionOpgave].titel}
          intro={kapitel.missioner[missionOpgave].intro}
          antal={kapitel.missioner[missionOpgave].antal}
          art={kapitel.missioner[missionOpgave].art ?? 'synonym'}
          niveau={niveauFor(ordFaerdighed(kapitel.missioner[missionOpgave].art))}
          onSvar={(r, f, fd) => onSvar(fd ?? ordFaerdighed(kapitel.missioner![missionOpgave].art), r, f)}
          faerdigTekst={t('ordopgave.faerdig')}
          pauseTekst={t('ordsten.vaek')}
          onFaerdig={() => {
            const m = kapitel.missioner![missionOpgave];
            setMissionOpgave(null);
            setGentagelse({ replikker: m.faerdig, efter: () => nytSkaar(m.skaar) });
          }}
          onPause={() => setMissionOpgave(null)}
        />
      )}
      {bladBesked && <Kvittering tekst={bladBesked} onSkjul={skjulBlad} luk={t('kvittering.luk')} />}
      {nytSkaarMinde && !aktivtTrin && !gentagelse && (
        <Kvittering
          tekst={`${t('skaar.fundet', { titel: mindeTitel(nytSkaarMinde), antal: spil.skaar.length, ialt: ALLE_SKAAR.length })}${
            spil.skaar.length === 1 ? ` ${t('skaar.forklaring')}` : ''
          }`}
          onSkjul={skjulSkaar}
          luk={t('kvittering.luk')}
          handling={{ tekst: t('minde.se.nu'), onKlik: () => { setVisMinde(nytSkaarMinde); setNytSkaar(null); } }}
        />
      )}
      {/* Dialogen venter, til overgangen mellem steder er færdig (et dialogvindue ligger altid øverst i browseren).
          En ny dialog venter også, mens menuen eller et andet vindue er åbent, ellers lægger den sig over menuens knapper.
          En dialog, der allerede er i gang, bliver stående. */}
      {aktivtTrin?.type === 'dialog' && !overgang && (dialogIGang === aktivtTrin.id || !andetVindueAabent) && (
        <DialogBoks
          replikker={trinDialog?.replikker ?? []}
          valg={trinDialog?.valg}
          onValg={vaelg}
          onFaerdig={() => {
            const minde = aktivtTrin.tilbageblik?.id;
            afslut();
            if (minde && erMinde(minde)) setNytMinde(minde);
          }}
          onTaler={setTaler}
        />
      )}
      {nytMinde && !aktivtTrin && (
        <Kvittering
          tekst={t('minde.nyt', { titel: mindeTitel(nytMinde) })}
          onSkjul={skjulMinde}
          luk={t('kvittering.luk')}
          handling={{ tekst: t('minde.se.nu'), onKlik: () => { setVisMinde(nytMinde); setNytMinde(null); } }}
        />
      )}
      {visMinde && <Tilbageblik id={visMinde} onFaerdig={() => setVisMinde(null)} />}
      {overgang && <Overgang key={overgang.nr} type={overgang.type} onFaerdig={slutOvergang} />}
      {aktivtTrin?.type === 'opgave' && (
        <OpgaveVindue
          trin={aktivtTrin}
          niveau={spil.faerdigheder[aktivtTrin.faerdighed as keyof GemtSpil['faerdigheder']]?.niveau ?? 1}
          loeste={spil.trinFremskridt}
          niveauFor={niveauFor}
          onSvar={(r, f, fd) => onSvar(fd ?? aktivtTrin.faerdighed, r, f)}
          onLoest={(info) => onLoest(aktivtTrin.antal, info)}
          onPause={() => setAktivtTrin(null)}
        />
      )}
      {aktivtTrin?.type === 'kamp' && (
        <KampVindue
          trin={aktivtTrin}
          niveauFor={niveauFor}
          klattenMed={!!aktivtTrin.klatten && opfyldt(aktivtTrin.klatten, spil)}
          uden={(['aeseloere', 'vims'] as const).filter((h) => aktivtTrin.holdHvis?.[h] && !opfyldt(aktivtTrin.holdHvis[h], spil))}
          fremskridt={spil.trinFremskridt}
          avatar={spil.avatar}
          avatarNavn={avatarnavn(spil.avatarnavn)}
          taske={tingITasken}
          onSvar={(faerdighed, r, f) => onSvar(faerdighed, r, f)}
          onFremskridt={kampFremskridt}
          onVundet={afslut}
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
