import { useEffect, useMemo, useRef, useState } from 'react';
import { kapitler, t, type KampTrin, type TekstId } from '../content';
import type { Avatar } from '../data/gem';
import type { Haendelse as Tilpasning } from '../engine/tilpasning';
import { FJENDE_PLADS, HOLD_PLADS, MARKOER, tegnKampBaggrund } from '../game/pixel/kampscene';
import type { FigurId } from '../game/pixel/kampliv';
import { hentKendte, huskKendte } from '../data/bestiarium';
import { avatarPixel, FUGL, KLATTEN, type Tegnkort } from '../game/pixel/sprites';
import { VIMS } from '../game/pixel/viskeskov';
import { antalTure, tjekKamp, viskUd, type VaesenId } from '../mechanics/kamp';
import {
  brugEvne,
  brugTing,
  fjendensTur,
  forsvar,
  levende,
  SLAG,
  SLAG_FAERDIGHED,
  SLAG_OPGAVE,
  slaa,
  startKamp,
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
import { hentMusikOverride, saetMusikOverride } from '../lyd/musik/afspiller';
import { Modal } from './Modal';
import { spilEffekt } from '../lyd/effekter';
import { LaesOpKnap } from './Tekst';
import { FJENDE_SKALA, fodskygge, HOLD_SKALA, plads, procent, SPEJLET, SPRITE, SPRITE_SPEJLET, uri } from './kamp/figurbilleder';
import { HoldPanel } from './kamp/HoldPanel';
import { KampEffekter } from './kamp/KampEffekter';
import { KampMenu } from './kamp/KampMenu';
import { KampOpgaveKort } from './kamp/KampOpgaveKort';
import { KampSlut } from './kamp/KampSlut';
import { LevendeSprite } from './kamp/LevendeSprite';
import { nyOpgave } from './kamp/opgaver';
import { useAfspilning } from './kamp/useAfspilning';
import type { Visning } from './kamp/visning';

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
  /** Væsner, hvis svage punkt holdet kender (efter Lyt eller et træffende slag). Huskes fra kamp til kamp i bestiariet. */
  const [kendt, setKendt] = useState<number[]>(() => {
    const kendte = hentKendte();
    return kamp.fjender.filter((f) => kendte.includes(f.vaesen)).map((f) => f.nr);
  });
  useEffect(() => {
    if (kendt.length) huskKendte(kendt.map((nr) => kamp.fjender[nr].vaesen));
  }, [kendt]);
  /** Et væsen varsler et stort angreb mod hele holdet: Forsvar er et godt valg (spilletest 13. november 2026). */
  const stortVarslet = kamp.fjender.some((f) => f.liv > 0 && f.varsel?.stort);
  const [peg, setPeg] = useState<number | null>(null);
  const [hjaelp, setHjaelp] = useState(false);
  const viskNaeste = useRef(false);
  /** Den korte linje om, hvad der lige skete. */
  const [linje, setLinje] = useState<string | null>(null);
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
  }, []);
  const medlemNavn = (id: MedlemId) => (id === 'avatar' ? avatarNavn : t(`taler.${id}` as TekstId));

  // Baggrunden følger stedets tema (Viskeskoven eller Rimbjerget).
  // Blækdybet har sin egen baggrund (14. november 2026). Dens kampe hører ikke til et kapitel.
  const tema = trin.sted === 'dybet' ? 'dybet' : (kapitler.find((k) => k.trin.some((x) => x.id === trin.id))?.steder[trin.sted]?.tema ?? 'viskeskov');
  const baggrund = uri(`kamp.${trin.sted}.${daempet}`, () => tegnKampBaggrund(tema, !daempet));
  // Holdet står til venstre og kigger mod højre, mod væsnerne. Hjælperne er tegnet, så de kigger mod venstre, og spejles.
  const avatarKort = useMemo(() => avatarPixel(avatar, 'hoejre', 0), [avatar]);
  const holdKort: Record<MedlemId, Tegnkort> = { avatar: avatarKort, aeseloere: SPEJLET.fugl, vims: SPEJLET.vims, klatten: SPEJLET.klatten };
  /** Figurerne, som de er tegnet (før spejling), til deres egne bevægelser. */
  const holdBase: Record<MedlemId, { kort: Tegnkort; id: FigurId; spejlet: boolean }> = {
    avatar: { kort: avatarKort, id: 'avatar', spejlet: false },
    aeseloere: { kort: FUGL, id: 'fugl', spejlet: true },
    vims: { kort: VIMS, id: 'vims', spejlet: true },
    klatten: { kort: KLATTEN, id: 'klatten', spejlet: true },
  };

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
  const { effekter, visLiv, ryst, oploest, smelter, faldet, felt, overgang, afspil, springOver } = useAfspilning({
    kamp,
    setKamp,
    setVisning,
    setNotat,
    setLinje,
    navne,
    medlemNavn,
    midtFjende,
    midtMedlem,
    daempet,
  });

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
    if (f.varsel.stort) return t('kamp.varsel.stort', { navn: navne[nr], skade: varselSkade(nr) });
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

  const o = visning.type === 'opgave' ? visning : null;
  const slut = visning.type === 'slut' ? kamp.udfald : null;

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
                {!vaek && <span className="kamp-fodskygge" aria-hidden="true" style={fodskygge(sted, kort, FJENDE_SKALA)} />}
                <LevendeSprite
                  key={`${f.nr}-${ramt ? ryst.nr : 0}-${vaek}`}
                  className={`kamp-sprite kamp-fjende${vaek ? (smelter.includes(f.nr) && visning.type === 'afspil' ? ' rolig' : ' borte') : ramt ? ' ramt' : ''}${f.lammet && !vaek ? ' lammet' : ''}`}
                  noegle={`vaesen.${f.vaesen}`}
                  id={f.vaesen}
                  base={SPRITE[f.vaesen]}
                  spejlet
                  retning={-1}
                  stille={vaek || !!f.lammet}
                  fase={f.nr * 2}
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
                      <span className={`kamp-varsel${f.varsel.alle ? ' alle' : ''}${f.varsel.stort ? ' stort' : ''}`} title={varselTekst(f.nr) ?? ''}>
                        <span aria-hidden="true">{f.varsel.alle ? '⚡' : '⚔'} </span>
                        {f.varsel.stort
                          ? t('kamp.varsel.kort.stort', { skade: varselSkade(f.nr) })
                          : f.varsel.alle
                            ? t('kamp.varsel.kort.alle', { skade: varselSkade(f.nr) })
                            : t('kamp.varsel.kort', { hvem: medlemNavn(f.varsel.maal ?? 'avatar'), skade: varselSkade(f.nr) })}
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
                {!nede && <span className="kamp-fodskygge hold" aria-hidden="true" style={fodskygge(HOLD_PLADS[i], kort, HOLD_SKALA)} />}
                <LevendeSprite
                  key={`${m.id}-${ramt ? ryst.nr : 0}`}
                  className={`kamp-sprite kamp-medlem${nede ? ' faldet' : ''}${ramt ? ' ramt' : ''}${slut === 'vundet' ? ' jubler' : ''}`}
                  noegle={m.id === 'avatar' ? `avatar.${JSON.stringify(avatar)}` : `medlem.${m.id}`}
                  id={holdBase[m.id].id}
                  base={holdBase[m.id].kort}
                  spejlet={holdBase[m.id].spejlet}
                  retning={1}
                  stille={nede}
                  fase={i * 3 + 1}
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

          <KampEffekter effekter={effekter} />

          {visning.type === 'afspil' && (
            <button type="button" className="kamp-spring" onClick={springOver}>
              {t('kamp.spring')}
            </button>
          )}
        </div>

        {/* Holdet: navne og liv nederst til højre, som i et rollespil. */}
        <HoldPanel kamp={kamp} livMedlem={livMedlem} medlemNavn={medlemNavn} />

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
              <KampOpgaveKort o={o} kamp={kamp} hjaelpere={hjaelpere} navne={navne} svar={svar} setNotat={setNotat} evneIOpgave={evneIOpgave} efterSvar={efterSvar} />
            ) : (
              <KampMenu
                visning={visning}
                kamp={kamp}
                slagListe={slagListe}
                hjaelpere={hjaelpere}
                navne={navne}
                medlemNavn={medlemNavn}
                stortVarslet={stortVarslet}
                setVisning={setVisning}
                setPeg={setPeg}
                onForsvar={() => {
                  const r = forsvar(kamp);
                  afslutRunde(r.kamp, r.haendelser);
                }}
                onGaaVaek={gaaVaek}
                vaelgSlag={vaelgSlag}
                startOpgave={startOpgave}
                lyt={lyt}
                evneIMenu={evneIMenu}
                ting={ting}
              />
            )}
            {notat && (
              <div className="besked besked-info kamp-notat" aria-live="polite">
                <p>{notat}</p>
              </div>
            )}
          </section>
        )}

        {/* Slutningen: sejr eller blødt nederlag. */}
        {slut && <KampSlut slut={slut} onVundet={onVundet} onGaaVaek={gaaVaek} />}

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
