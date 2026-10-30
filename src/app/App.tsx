import { useEffect, useState } from 'react';
import { hentKapitel, navne, t } from '../content';
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
import { kapitelSlut } from '../engine/kapitel';
import { AvatarDesigner } from '../ui/AvatarDesigner';
import { GemmekodeVindue, IndlaesSide } from '../ui/Gemmekode';
import { IndstillingerVindue } from '../ui/IndstillingerVindue';
import { Kontekst } from '../ui/Kontekst';
import { Laererkig } from '../ui/Laererkig';
import { Modal } from '../ui/Modal';
import { OrdkortVindue } from '../ui/OrdkortVindue';
import { Samling } from '../ui/Samling';
import { Verden } from './Verden';

type Skaerm = 'start' | 'ny-avatar' | 'ret-avatar' | 'verden' | 'indlaes' | 'laerer' | 'samling';

export function App() {
  const [skaerm, setSkaerm] = useState<Skaerm>('start');
  const [spil, setSpil] = useState<GemtSpil | null>(() => hentGemtSpil());
  const [indstillinger, setIndstillinger] = useState<Indstillinger>(() => hentIndstillinger());
  const [ordkort, setOrdkort] = useState<string | null>(null);
  const [visIndstillinger, setVisIndstillinger] = useState(false);
  const [visMenu, setVisMenu] = useState(false);
  const [gemmekode, setGemmekode] = useState<{ del?: number } | null>(null);
  const [bekraeftNyt, setBekraeftNyt] = useState(false);
  const [ventendeIndlaes, setVentendeIndlaes] = useState<GemtSpil | null>(null);

  useEffect(() => {
    const r = document.documentElement;
    r.dataset.skrift = indstillinger.skrift;
    r.dataset.stoerrelse = String(indstillinger.stoerrelse);
  }, [indstillinger]);

  function opdater(s: GemtSpil) {
    setSpil(s);
    gemSpil(s);
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
    setVentendeIndlaes(null);
    setSkaerm('verden');
  }

  const kapitel = spil ? hentKapitel(spil.kapitel) : undefined;
  const slut = !!(spil && kapitel && kapitelSlut(spil, kapitel));
  const vindueAabent = !!(ordkort || visIndstillinger || visMenu || gemmekode);

  return (
    <Kontekst.Provider value={{ indstillinger, visOrdkort }}>
      {skaerm === 'start' && (
        <main className="side start">
          <h1 className="titel">{t('app.titel')}</h1>
          <p className="undertitel">{t('app.undertitel')}</p>
          <div className="startknapper">
            {spil && (
              <button type="button" className="knap knap-primaer" onClick={() => setSkaerm('verden')} autoFocus>
                {t('start.fortsaet')}
              </button>
            )}
            <button
              type="button"
              className={`knap ${spil ? '' : 'knap-primaer'}`}
              onClick={() => (spil ? setBekraeftNyt(true) : setSkaerm('ny-avatar'))}
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
            <button type="button" className="knap knap-diskret" onClick={() => setSkaerm('laerer')}>
              {t('start.laererkig')}
            </button>
          </div>
          <p className="lille-tekst">{t('app.pladsholder')}</p>
        </main>
      )}

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

      {skaerm === 'verden' && spil && (
        <Verden
          spil={spil}
          opdater={opdater}
          indstillinger={indstillinger}
          andetVindueAabent={vindueAabent}
          onMenu={() => setVisMenu(true)}
          onDelSlut={(del) => setGemmekode({ del })}
          onKapitelSlut={() => setSkaerm('samling')}
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
                setSkaerm('ny-avatar');
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
        <Modal titel={t('menu.titel')} onLuk={() => setVisMenu(false)}>
          <h2>{t('menu.titel')}</h2>
          <div className="menu">
            <button type="button" className="knap" autoFocus onClick={() => { setVisMenu(false); setGemmekode({}); }}>
              {t('menu.gemmekode')}
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
        </Modal>
      )}

      {gemmekode && spil && <GemmekodeVindue spil={spil} del={gemmekode.del} onLuk={() => setGemmekode(null)} />}
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
