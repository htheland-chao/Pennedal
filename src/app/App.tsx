import { ALLE_SKAAR } from '../engine/betingelse';
import { useCallback, useEffect, useState } from 'react';
import { hentKapitel, kapitler, navne, t } from '../content';
import {
  gemIndstillinger,
  gemSpil,
  hentGemtSpil,
  hentIndstillinger,
  nytSpil,
  STANDARD_AVATAR,
  type GemtSpil,
  type Indstillinger,
} from '../engine/gem';
import { aktueltSted, kapitelSlut, naesteKapitel, spilVedIKapitler } from '../engine/kapitel';
import { saetMusik } from '../ui/musik/afspiller';
import { saetEffekter } from '../ui/effekter';
import { AvatarDesigner } from '../ui/AvatarDesigner';
import { GemmekodeVindue, IndlaesSide } from '../ui/Gemmekode';
import { Intro } from '../ui/Intro';
import { Titelskaerm } from '../ui/Titelskaerm';
import { IndstillingerVindue } from '../ui/IndstillingerVindue';
import { Kontekst } from '../ui/Kontekst';
import { Laererkig } from '../ui/Laererkig';
import { Modal } from '../ui/Modal';
import { OrdkortVindue } from '../ui/OrdkortVindue';
import { Kvittering } from '../ui/Kvittering';
import { Samling } from '../ui/Samling';
import { Verden } from './Verden';
import { Kapitelkort } from '../ui/Kapitelkort';

type Skaerm = 'start' | 'intro' | 'ny-avatar' | 'ret-avatar' | 'verden' | 'indlaes' | 'laerer' | 'samling' | 'hop';

/**
 * Til test: ?hop viser en liste over steder, ?hop=kaelder (et sted eller et trins id) starter direkte der.
 * Et hop-spil bliver aldrig gemt, så et rigtigt spil i browseren ikke bliver overskrevet.
 */
const HOP = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('hop') : null;
const HOP_SPIL = HOP ? medHopValg(spilVedIKapitler(kapitler, HOP, nytSpil(STANDARD_AVATAR, { adjektiv: 0, dyr: 0 }))) : null;

/** Til test med ?hop: &valg=a,b sætter valg, &venlighed=n sætter Klattens venlighed, og &skaar=alle giver alle hukommelsesskår. */
function medHopValg(spil: GemtSpil | null): GemtSpil | null {
  if (!spil || typeof location === 'undefined') return spil;
  const q = new URLSearchParams(location.search);
  const valg = (q.get('valg') ?? '').split(',').filter(Boolean);
  const venlighed = Number(q.get('venlighed') ?? spil.venlighed);
  const skaar = q.get('skaar') === 'alle' ? [...ALLE_SKAAR] : spil.skaar;
  return { ...spil, skaar, valg: { ...spil.valg, ...Object.fromEntries(valg.map((v) => [v, 'ja'])) }, venlighed: Number.isFinite(venlighed) ? venlighed : spil.venlighed };
}

export function App() {
  const [skaerm, setSkaerm] = useState<Skaerm>(HOP_SPIL ? 'verden' : HOP !== null ? 'hop' : 'start');
  const [spil, setSpil] = useState<GemtSpil | null>(() => HOP_SPIL ?? hentGemtSpil());
  const [indstillinger, setIndstillinger] = useState<Indstillinger>(() => hentIndstillinger());
  const [ordkort, setOrdkort] = useState<string | null>(null);
  const [visIndstillinger, setVisIndstillinger] = useState(false);
  const [visMenu, setVisMenu] = useState(false);
  const [gemmekode, setGemmekode] = useState<{ del?: number } | null>(null);
  /** Kort besked, når en del er klaret. Gem ligger i menuen (Henrik, 8. november 2026), så der kommer ingen pop op. */
  const [kvittering, setKvittering] = useState<string | null>(null);
  const skjulKvittering = useCallback(() => setKvittering(null), []);
  const [bekraeftNyt, setBekraeftNyt] = useState(false);
  const [ventendeIndlaes, setVentendeIndlaes] = useState<GemtSpil | null>(null);
  /** Hvor introen fører hen: til et nyt spil eller tilbage til forsiden. */
  const [efterIntro, setEfterIntro] = useState<'ny-avatar' | 'start'>('ny-avatar');

  function visIntro(efter: 'ny-avatar' | 'start') {
    setEfterIntro(efter);
    setSkaerm('intro');
  }

  useEffect(() => {
    const r = document.documentElement;
    r.dataset.skrift = indstillinger.skrift;
    r.dataset.stoerrelse = String(indstillinger.stoerrelse);
  }, [indstillinger]);

  function opdater(s: GemtSpil) {
    setSpil(s);
    if (!HOP_SPIL) gemSpil(s);
  }

  function skiftIndstillinger(i: Indstillinger) {
    setIndstillinger(i);
    gemIndstillinger(i);
  }

  function visOrdkort(id: string) {
    setOrdkort(id);
    if (spil && !spil.samling.includes(id)) opdater({ ...spil, samling: [...spil.samling, id] });
  }

  function brugIndlaest(s: GemtSpil) {
    opdater(s);
    visKort('fortsat');
    setVentendeIndlaes(null);
    setSkaerm('verden');
  }

  const kapitel = spil ? hentKapitel(spil.kapitel) : undefined;
  const slut = !!(spil && kapitel && kapitelSlut(spil, kapitel));

  // Baggrundsmusik: stedets egen sang i verden, ellers forsidens.
  const musikTema =
    skaerm === 'intro'
      ? 'intro'
      : skaerm === 'verden' && spil && kapitel
        ? kapitel.steder[aktueltSted(spil, kapitel)]?.tema ?? 'forside'
        : 'forside';
  useEffect(() => {
    saetMusik({ tema: musikTema, til: indstillinger.musik, styrke: indstillinger.musikStyrke, mild: indstillinger.mindreUhygge });
  }, [musikTema, indstillinger.musik, indstillinger.musikStyrke, indstillinger.mindreUhygge]);
  useEffect(() => {
    saetEffekter({ til: indstillinger.effekter, styrke: indstillinger.effektStyrke, mild: indstillinger.mindreUhygge });
  }, [indstillinger.effekter, indstillinger.effektStyrke, indstillinger.mindreUhygge]);
  /** Titelkortet: når et kapitel begynder ('start'), eller når man fortsætter et spil ('fortsat'). Ikke i hop-test. */
  const [kapitelkort, setKapitelkort] = useState<'start' | 'fortsat' | null>(null);
  const visKort = (k: 'start' | 'fortsat') => !HOP_SPIL && setKapitelkort(k);
  const vindueAabent = !!(ordkort || visIndstillinger || visMenu || gemmekode || kapitelkort);

  return (
    <Kontekst.Provider value={{ indstillinger, visOrdkort }}>
      {skaerm === 'start' && (
        <Titelskaerm fod={t('app.pladsholder')}>
          <div className="startknapper">
            {spil && (
              <button
                type="button"
                className="knap knap-primaer"
                onClick={() => {
                  visKort('fortsat');
                  setSkaerm('verden');
                }}
                autoFocus
              >
                {t('start.fortsaet')}
              </button>
            )}
            <button
              type="button"
              className={`knap ${spil ? '' : 'knap-primaer'}`}
              onClick={() => (spil ? setBekraeftNyt(true) : visIntro('ny-avatar'))}
              autoFocus={!spil}
            >
              {t('start.nyt')}
            </button>
            <button type="button" className="knap" onClick={() => setSkaerm('indlaes')}>
              {t('start.indlaes')}
            </button>
            <button type="button" className="knap" onClick={() => setVisIndstillinger(true)}>
              {t('start.indstillinger')}
            </button>
            <button type="button" className="knap knap-diskret" onClick={() => visIntro('start')}>
              {t('start.intro')}
            </button>
            <button type="button" className="knap knap-diskret" onClick={() => setSkaerm('laerer')}>
              {t('start.laererkig')}
            </button>
          </div>
        </Titelskaerm>
      )}

      {skaerm === 'hop' && (
        <main className="side start">
          <h1 className="titel">{t('hop.overskrift')}</h1>
          <p>{t('hop.forklaring')}</p>
          {kapitler.map((k) => (
            <section key={k.kapitel}>
              <h2>{t('hop.kapitel', { nr: k.kapitel, titel: k.titel })}</h2>
              <ul className="hop-liste">
                {Object.entries(k.steder).map(([id, sted]) => (
                  <li key={id}>
                    <a className="knap" href={`?hop=${id}`}>
                      {sted.navn}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <a href="./">{t('hop.forside')}</a>
        </main>
      )}

      {skaerm === 'intro' && <Intro onFaerdig={() => setSkaerm(efterIntro)} />}

      {skaerm === 'ny-avatar' && (
        <AvatarDesigner
          ny
          avatar={STANDARD_AVATAR}
          navn={{
            adjektiv: Math.floor(Math.random() * navne.adjektiver.length),
            dyr: Math.floor(Math.random() * navne.dyr.length),
          }}
          laasteOp={[]}
          onAnnuller={() => setSkaerm('start')}
          onFaerdig={(avatar, navn) => {
            opdater(nytSpil(avatar, navn));
            visKort('start');
            setSkaerm('verden');
          }}
        />
      )}

      {skaerm === 'ret-avatar' && spil && (
        <AvatarDesigner
          ny={false}
          avatar={spil.avatar}
          navn={spil.avatarnavn}
          laasteOp={spil.laasteOp}
          onAnnuller={() => setSkaerm('verden')}
          onFaerdig={(avatar, navn) => {
            opdater({ ...spil, avatar, avatarnavn: navn });
            setSkaerm('verden');
          }}
        />
      )}

      {skaerm === 'verden' && spil && HOP_SPIL && (
        <p className="hop-banner" role="status">
          {t('hop.test')}
        </p>
      )}

      {skaerm === 'verden' && spil && (
        <Verden
          spil={spil}
          opdater={opdater}
          indstillinger={indstillinger}
          andetVindueAabent={vindueAabent}
          onMenu={() => setVisMenu(true)}
          onDelSlut={(del) => setKvittering(t('gem.del.kvittering', { nr: del }))}
          onKapitelSlut={() => setSkaerm('samling')}
          onLangsomGrafik={() => skiftIndstillinger({ ...indstillinger, grafik: 'hurtig' })}
        />
      )}

      {skaerm === 'verden' && spil && kapitel && kapitelkort && (
        <Kapitelkort
          kapitel={kapitel}
          fortsat={kapitelkort === 'fortsat'}
          naeste={kapitel.trin.slice(spil.trin).find((x) => x.opgavetekst)?.opgavetekst}
          skaar={spil.skaar.length}
          onVidere={() => setKapitelkort(null)}
        />
      )}

      {skaerm === 'samling' && spil && (
        <Samling
          spil={spil}
          kapitelSlut={slut}
          onTilbage={() => setSkaerm(slut ? 'start' : 'verden')}
          onSpilIgen={() => {
            opdater({ ...spil, trin: 0, trinFremskridt: 0 });
            setSkaerm('verden');
          }}
          naesteNr={slut ? naesteKapitel(kapitler, spil.kapitel)?.kapitel : undefined}
          onNaeste={() => {
            const n = naesteKapitel(kapitler, spil.kapitel);
            if (!n) return;
            opdater({ ...spil, kapitel: n.kapitel, trin: 0, trinFremskridt: 0 });
            visKort('start');
            setSkaerm('verden');
          }}
        />
      )}

      {skaerm === 'indlaes' && (
        <IndlaesSide
          onTilbage={() => setSkaerm('start')}
          onIndlaest={(s) => (hentGemtSpil() ? setVentendeIndlaes(s) : brugIndlaest(s))}
        />
      )}

      {skaerm === 'laerer' && (
        <Laererkig
          onLuk={() => {
            setSpil(hentGemtSpil());
            setSkaerm('start');
          }}
        />
      )}

      {bekraeftNyt && (
        <Modal titel={t('start.nyt')} onLuk={() => setBekraeftNyt(false)}>
          <p>{t('start.overskriv')}</p>
          <div className="knaprad">
            <button type="button" className="knap" onClick={() => setBekraeftNyt(false)} autoFocus>
              {t('start.overskriv.nej')}
            </button>
            <button
              type="button"
              className="knap knap-fare"
              onClick={() => {
                setBekraeftNyt(false);
                visIntro('ny-avatar');
              }}
            >
              {t('start.overskriv.ja')}
            </button>
          </div>
        </Modal>
      )}

      {ventendeIndlaes && (
        <Modal titel={t('gem.indlaes.titel')} onLuk={() => setVentendeIndlaes(null)}>
          <p>{t('start.overskriv')}</p>
          <div className="knaprad">
            <button type="button" className="knap" onClick={() => setVentendeIndlaes(null)} autoFocus>
              {t('start.overskriv.nej')}
            </button>
            <button type="button" className="knap knap-fare" onClick={() => brugIndlaest(ventendeIndlaes)}>
              {t('start.overskriv.ja')}
            </button>
          </div>
        </Modal>
      )}

      {visMenu && spil && (
        <Modal titel={t('menu.titel')} onLuk={() => setVisMenu(false)} klasse="menu-skuffe">
          <h2>{t('menu.titel')}</h2>
          <div className="menu">
            <button type="button" className="knap" autoFocus onClick={() => { setVisMenu(false); setGemmekode({}); }}>
              {t('menu.gem')}
            </button>
            <button type="button" className="knap" onClick={() => { setVisMenu(false); setSkaerm('samling'); }}>
              {t('menu.samling')}
            </button>
            <button type="button" className="knap" onClick={() => { setVisMenu(false); setSkaerm('ret-avatar'); }}>
              {t('menu.avatar')}
            </button>
            <button type="button" className="knap" onClick={() => { setVisMenu(false); setVisIndstillinger(true); }}>
              {t('menu.indstillinger')}
            </button>
            <button type="button" className="knap" onClick={() => { setVisMenu(false); setSkaerm('start'); }}>
              {t('menu.forside')}
            </button>
            <button type="button" className="knap knap-primaer" onClick={() => setVisMenu(false)}>
              {t('menu.luk')}
            </button>
          </div>
          <p className="lille-tekst">{t('verden.styring')}</p>
        </Modal>
      )}

      {gemmekode && spil && <GemmekodeVindue spil={spil} del={gemmekode.del} onLuk={() => setGemmekode(null)} />}
      {kvittering && skaerm === 'verden' && <Kvittering tekst={kvittering} onSkjul={skjulKvittering} luk={t('kvittering.luk')} />}
      {visIndstillinger && (
        <IndstillingerVindue
          indstillinger={indstillinger}
          onSkift={skiftIndstillinger}
          onLuk={() => setVisIndstillinger(false)}
        />
      )}
      {ordkort && <OrdkortVindue id={ordkort} onLuk={() => setOrdkort(null)} />}
    </Kontekst.Provider>
  );
}
