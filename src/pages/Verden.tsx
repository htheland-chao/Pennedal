import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { avatarnavn, hentKapitel, kapitler, t, type RumTrin, type Trin, type ValgMulighed } from '../content';
import { erFaerdighed } from '../engine/faerdigheder';
import { opfyldt } from '../engine/betingelse';
import type { GemtSpil, Indstillinger } from '../data/gem';
import { afslutTrin, aktueltSted, aktueltTrin, kapitelSlut } from '../engine/kapitel';
import { MAKS_VENLIGHED, minderFor, nyeTing, taskeFor, type TingId } from '../engine/taske';
import { medSkaar } from '../engine/frivillig';
import { KampVindue } from '../ui/KampVindue';
import { registrerSvar, type Haendelse } from '../engine/tilpasning';
import { PhaserVerden, type BaneStyring } from '../game/PhaserVerden';
import { erMinde, SKAAR_MINDE, skaarMinder, type MindeId } from '../content/minder';
import { DialogBoks } from '../ui/DialogBoks';
import { Kvittering } from '../ui/Kvittering';
import { Overgang } from '../ui/Overgang';
import { saetMusikOverride } from '../ui/musik/afspiller';
import { NyTingBesked, TaskeVindue } from '../ui/TaskeVindue';
import { Ydelse } from '../ui/Ydelse';
import { BevisjagtVindue, OpgaveVindue } from '../app/OpgaveVindue';
import { spilEffekt } from '../ui/effekter';
import { skalaFraAdresse } from '../game/KortScene';
import { samtalerPaaStedet, tilpasDialog, type Gentagelse } from './verden/dialog';
import { skjulteObjekter } from './verden/synlighed';
import { BaneKnapper } from './verden/BaneKnapper';
import { VerdenPanel } from './verden/VerdenPanel';
import { useSkaarFlyv } from './verden/useSkaarFlyv';
import { useFrivillig } from './verden/useFrivillig';
import { OrdstenVindue } from './verden/OrdstenVindue';
import { MissionVindue } from './verden/MissionVindue';
import { RumVinduer, type RumVisning } from './verden/RumVinduer';
import { hvadKanUndersoeges } from './verden/undersoeg';
import { MindeBeskeder } from './verden/MindeBeskeder';
import { useTestKroge } from './verden/useTestKroge';
import { useOvergang } from './verden/useOvergang';

type Props = {
  spil: GemtSpil;
  opdater: (s: GemtSpil) => void;
  indstillinger: Indstillinger;
  andetVindueAabent: boolean;
  onMenu: () => void;
  onDelSlut: (del: number) => void;
  /** Får det gemte spil, som det er lige efter sidste trin. */
  onKapitelSlut: (spil: GemtSpil) => void;
  /** Fin grafik gik for langsomt: skift til hurtig grafik. */
  onLangsomGrafik?: () => void;
};

const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

export function Verden({ spil, opdater, indstillinger, andetVindueAabent, onMenu, onDelSlut, onKapitelSlut, onLangsomGrafik }: Props) {
  const kapitel = hentKapitel(spil.kapitel)!;
  const trin = aktueltTrin(spil, kapitel);
  const slut = kapitelSlut(spil, kapitel);
  // Udflugt (Henrik, 9. november 2026): et frivilligt sted, fx en svær platformbane. Er ikke et trin og gemmes ikke.
  const [udflugt, setUdflugt] = useState<string | null>(null);
  const stedId = udflugt ?? aktueltSted(spil, kapitel);
  const sted = kapitel.steder[stedId];
  const [aktivtTrin, setAktivtTrin] = useState<Trin | null>(null);
  // Frivillige minder (Henrik, 8. november 2026): et tilbageblik afbryder ikke dialogen. Eleven får besked
  // og kan se mindet nu eller senere i tasken.
  const [nytMinde, setNytMinde] = useState<MindeId | null>(null);
  const [visMinde, setVisMinde] = useState<MindeId | null>(null);
  const { overgang, slutOvergang } = useOvergang(stedId);
  const [naer, setNaer] = useState<string | null>(null);
  const [hint, setHint] = useState<{ x: number; y: number } | null>(null);
  const [forskraek, setForskraek] = useState(0);
  /** Den, der taler i dialogen lige nu. Kameraet zoomer ind på dem. */
  const [taler, setTaler] = useState<string | null>(null);
  const [uhyggeBesked, setUhyggeBesked] = useState('');
  const fpsRef = useRef<() => number>(() => 0);
  const { gaaTilRef, spillerXRef, baneKameraRef } = useTestKroge();
  const baneRef = useRef<BaneStyring | null>(null);
  /** Viskeskovens bane: den ordsten, eleven står ved og svarer på. */
  const [ordsten, setOrdsten] = useState<number | null>(null);
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
  const { taskeKnap, skaarFlyv, taskePuls, flyvTilTasken } = useSkaarFlyv();
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
  const [rumVindue, setRumVindue] = useState<RumVisning | null>(null);
  const aktive = rum && !aktivtTrin ? [...rum.fund.map((f) => f.objekt), rum.laas.objekt] : undefined;
  const taske = Object.keys(spil.valg)
    .filter((k) => k.startsWith('taske.'))
    .map((k) => k.slice(6));

  // Platformbane: er målet (skift-trinnet med objektet maal på stedet) allerede klaret?
  const maalNr = kapitel.trin.findIndex((x) => x.sted === stedId && x.objekt === 'maal');
  const baneKlaret = !udflugt && !!sted.bane && maalNr >= 0 && spil.trin > maalNr;
  const aktivtObjekt = udflugt ? 'maal' : trin && !aktivtTrin ? trin.objekt : null;
  const skjulte = skjulteObjekter(spil, kapitel, sted, aktivtTrin?.id);

  const gentag = useMemo(() => samtalerPaaStedet(kapitel, spil, stedId), [kapitel, spil.trin, spil.valg, stedId]); // eslint-disable-line react-hooks/exhaustive-deps
  /** En dialog uden for trinnene: tal igen, sidemissionen eller en udflugt. */
  const [gentagelse, setGentagelse] = useState<Gentagelse | null>(null);
  // Replikker og valg med betingelser (hvis) vælges, når dialogen starter, så listen ikke ændrer sig undervejs,
  // fx når et valg giver venlighed.
  const gentagDialog = useMemo(() => (gentagelse ? tilpasDialog(gentagelse.replikker, gentagelse.valg, spilRef.current) : null), [gentagelse]);
  const trinDialog = useMemo(
    () => (aktivtTrin?.type === 'dialog' ? tilpasDialog(aktivtTrin.replikker, aktivtTrin.valg, spilRef.current) : null),
    [aktivtTrin],
  );
  const gentagValg = useRef<ValgMulighed | null>(null);
  const { kanGentages, frivillige, undersoegbare } = hvadKanUndersoeges({
    sted, gentag, skjulte, trinObjekt: trin?.objekt, aktivtObjekt, aktive, slut, udflugt: !!udflugt,
  });
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
    if (t0.slutKapitel) onKapitelSlut(nyt);
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

  const { frivilligHandling, udflugtKlaret, missionOpgave, setMissionOpgave, bladBesked, skjulBlad } = useFrivillig({
    kapitel,
    sted,
    udflugt,
    spilRef,
    opdater,
    setUdflugt,
    setHjaelp,
    setGentagelse,
    nytSkaar,
  });

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
        {sted.bane && !laast && <BaneKnapper baneRef={baneRef} />}
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

      <VerdenPanel
        sted={sted}
        kapitelNr={spil.kapitel}
        trin={trin}
        slut={slut}
        rum={rum}
        udflugt={!!udflugt}
        hjaelp={hjaelp}
        travl={{ trin: !!aktivtTrin, andetVindue: andetVindueAabent, rumVindue: !!rumVindue }}
        laast={laast}
        naer={naer}
        objektNavn={objektNavn}
        aktivtNavn={aktivtNavn}
        rumTing={taske.map((k) => spil.valg[`taske.${k}`])}
        antalTing={tingITasken.length + taske.length}
        taskeKnap={taskeKnap}
        taskePuls={taskePuls}
        uhyggeBesked={uhyggeBesked}
        onUndersoeg={interaktion}
        onBaerOver={() => baneRef.current?.baerOver()}
        onTilbage={() => setUdflugt(null)}
        onKapitelSlut={() => onKapitelSlut(spil)}
        onTaske={() => setVisTaske(true)}
        onMenu={onMenu}
      />

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
      {rum && rumVindue && (
        <RumVinduer
          rum={rum}
          visning={rumVindue}
          sted={sted}
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
        <OrdstenVindue
          sted={sted}
          niveauFor={niveauFor}
          onSvar={(fd, r, f) => onSvar(fd, r, f)}
          onGenskab={() => {
            baneRef.current?.genskab(ordsten);
            setOrdsten(null);
          }}
          onPause={() => setOrdsten(null)}
        />
      )}
      {missionOpgave && kapitel.missioner?.[missionOpgave] && (
        <MissionVindue
          mission={kapitel.missioner[missionOpgave]}
          niveauFor={niveauFor}
          onSvar={(fd, r, f) => onSvar(fd, r, f)}
          onFaerdig={() => {
            const m = kapitel.missioner![missionOpgave];
            setMissionOpgave(null);
            setGentagelse({ replikker: m.faerdig, efter: () => nytSkaar(m.skaar) });
          }}
          onPause={() => setMissionOpgave(null)}
        />
      )}
      {bladBesked && <Kvittering tekst={bladBesked} onSkjul={skjulBlad} luk={t('kvittering.luk')} />}
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
      <MindeBeskeder
        skaarMinde={nytSkaarMinde}
        nytMinde={nytMinde}
        vist={visMinde}
        antalSkaar={spil.skaar.length}
        kanVise={{ skaar: !aktivtTrin && !gentagelse, minde: !aktivtTrin }}
        setSkaarMinde={setNytSkaar}
        setNytMinde={setNytMinde}
        setVist={setVisMinde}
      />
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
