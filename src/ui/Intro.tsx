import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { t, type TekstId } from '../content';
import { tegnkortTilLerred } from '../game/pixel/lerred';
import {
  INTRO_B,
  INTRO_H,
  STUDIE_MAERKE,
  tegnKaelder,
  tegnLand,
  tegnMaane,
  tegnRegn,
  tegnVaerelse,
} from '../game/pixel/intro';
import { useApp } from './Kontekst';
import { LaesOpKnap, type Del } from './Tekst';

/**
 * Introen (31. oktober 2026). Den skal vække nysgerrighed uden at afsløre forhistorien
 * (se docs/historie.md): man ser en skuffe blive lukket, men ikke hvad der ligger i den.
 * Al tekst er HTML, grafikken er pixelbilleder, og bevægelsen er CSS. Kan springes over.
 */
type SceneId = 'studie' | 'regn' | 'skuffe' | 'land' | 'moerke' | 'kaelder' | 'titel';
type Scene = { id: SceneId; tekst?: TekstId; hvisken?: TekstId; slut?: TekstId };

export const SCENER: Scene[] = [
  { id: 'studie' },
  { id: 'regn', tekst: 'intro.1' },
  { id: 'skuffe', tekst: 'intro.2' },
  { id: 'land', tekst: 'intro.3' },
  { id: 'moerke', tekst: 'intro.4', hvisken: 'intro.4.hvisken' },
  { id: 'kaelder', tekst: 'intro.5', slut: 'intro.5.slut' },
  { id: 'titel' },
];

/** Pause efter oplæsningen, før næste scene starter. */
const PAUSE_MS = 1500;
/** Studiets navn står så længe. */
const STUDIE_MS = 4000;

type Billeder = Record<'aaben' | 'lukket' | 'regn' | 'land' | 'kaelder' | 'maerke' | 'm1' | 'm2' | 'm3', string>;

let cache: Billeder | null | undefined;
/** Tegner alle billeder én gang. I et miljø uden canvas (fx enhedstests) bliver det null, og introen viser kun tekst. */
function hentBilleder(): Billeder | null {
  if (cache !== undefined) return cache;
  try {
    const url = (c: HTMLCanvasElement) => c.toDataURL('image/png');
    cache = {
      aaben: url(tegnVaerelse(true)),
      lukket: url(tegnVaerelse(false)),
      regn: url(tegnRegn()),
      land: url(tegnLand()),
      kaelder: url(tegnKaelder()),
      maerke: url(tegnkortTilLerred(STUDIE_MAERKE)),
      m1: url(tegnMaane(9, '#f3ead2')),
      m2: url(tegnMaane(5, '#f0c45a')),
      m3: url(tegnMaane(6, '#c9dcf2')),
    };
  } catch {
    cache = null;
  }
  return cache;
}

/** Placering i procent af billedet (320 x 180), så alt skalerer med skærmen. */
const pos = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  left: `${(x / INTRO_B) * 100}%`,
  top: `${(y / INTRO_H) * 100}%`,
  ...(w !== undefined ? { width: `${(w / INTRO_B) * 100}%` } : {}),
  ...(h !== undefined ? { height: `${(h / INTRO_H) * 100}%` } : {}),
});

function Maaner({ b }: { b: Billeder }) {
  return (
    <>
      <img className="intro-lag intro-maane m1" src={b.m1} alt="" style={pos(40, 18, 19, 19)} />
      <img className="intro-lag intro-maane m2" src={b.m2} alt="" style={pos(70, 12, 11, 11)} />
      <img className="intro-lag intro-maane m3" src={b.m3} alt="" style={pos(88, 28, 13, 13)} />
      <span className="intro-lag intro-fyrlys" style={pos(245, 55, 40, 32)} />
    </>
  );
}

function Billede({ scene, b }: { scene: SceneId; b: Billeder }) {
  if (scene === 'studie') return <img className="intro-maerke" src={b.maerke} alt="" />;
  if (scene === 'regn' || scene === 'skuffe')
    return (
      <>
        <img className="intro-lag" src={b.aaben} alt="" />
        <img className={`intro-lag intro-lukket${scene === 'skuffe' ? ' vis' : ''}`} src={b.lukket} alt="" />
        <span className="intro-lag intro-vindue" style={pos(122, 22, 76, 66)}>
          <img className="intro-regn" src={b.regn} alt="" />
        </span>
      </>
    );
  if (scene === 'kaelder')
    return (
      <span className="intro-lag intro-zoom">
        <img className="intro-lag" src={b.kaelder} alt="" />
        <span className="intro-lag intro-skuffelys" style={pos(137, 130, 24, 18)} />
        <span className="intro-lag intro-vignet" />
      </span>
    );
  return (
    <>
      <span className={`intro-lag intro-pan${scene === 'moerke' ? ' falmer' : ''}`}>
        <img className="intro-lag" src={b.land} alt="" />
        <Maaner b={b} />
      </span>
      {scene === 'moerke' && <span className="intro-lag intro-skygge" />}
    </>
  );
}

export function Intro({ onFaerdig }: { onFaerdig: () => void }) {
  const { indstillinger } = useApp();
  const [nr, setNr] = useState(0);
  const [naeste, setNaeste] = useState(false);
  const scene = SCENER[nr];
  const sidste = nr === SCENER.length - 1;
  const b = useMemo(() => hentBilleder(), []);

  const videre = useCallback(() => {
    setNaeste(false);
    if (nr < SCENER.length - 1) setNr(nr + 1);
    else onFaerdig();
  }, [nr, onFaerdig]);

  const dele: Del[] = [];
  if (scene.tekst) dele.push({ tekst: t(scene.tekst), figur: 'fortaeller' });
  if (scene.hvisken) dele.push({ tekst: t(scene.hvisken), figur: 'ufaerdige' });
  if (scene.slut) dele.push({ tekst: t(scene.slut), figur: 'fortaeller' });

  // Studiets navn går selv videre. Scener med tekst går videre, når teksten er læst op.
  // Uden oplæsning får eleven god tid til at læse selv. Titlen venter altid på eleven.
  useEffect(() => {
    if (sidste || !indstillinger.autoVidere) return;
    let ms: number | null = null;
    if (scene.id === 'studie') ms = STUDIE_MS;
    else if (naeste) ms = PAUSE_MS;
    else if (!indstillinger.oplaesning) ms = 4000 + dele.reduce((s, d) => s + d.tekst.length, 0) * 90;
    if (ms === null) return;
    const ur = window.setTimeout(videre, ms);
    return () => window.clearTimeout(ur);
    // dele afhænger kun af scenen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nr, naeste, sidste, indstillinger.autoVidere, indstillinger.oplaesning, videre]);

  useEffect(() => {
    const tast = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onFaerdig();
      }
    };
    window.addEventListener('keydown', tast);
    return () => window.removeEventListener('keydown', tast);
  }, [onFaerdig]);

  const mild = indstillinger.mindreUhygge ? ' mild' : '';
  return (
    <main className={`intro scene-${scene.id}${mild}`} aria-label={t('intro.titel')}>
      <div className="intro-scene" aria-hidden="true">
        {b && <Billede key={scene.id === 'skuffe' ? 'regn' : scene.id} scene={scene.id} b={b} />}
      </div>

      {scene.id === 'studie' && (
        <div className="intro-studie">
          <p className="intro-studie-navn">{t('intro.studie')}</p>
          <p className="intro-praesenterer">{t('intro.praesenterer')}</p>
        </div>
      )}

      {scene.id === 'titel' && (
        <div className="intro-titelkort">
          <h1 className="titel">{t('app.titel')}</h1>
          <p className="undertitel">{t('app.undertitel')}</p>
          <button type="button" className="knap knap-primaer" onClick={onFaerdig} autoFocus>
            {t('intro.begynd')}
          </button>
          <p className="intro-af">{t('intro.af')}</p>
        </div>
      )}

      {dele.length > 0 && (
        <div className="intro-tekst" key={nr} aria-live="polite">
          {scene.tekst && <p>{t(scene.tekst)}</p>}
          {scene.hvisken && <p className="intro-hvisken">{t(scene.hvisken)}</p>}
          {scene.slut && <p className="intro-slut">{t(scene.slut)}</p>}
          <LaesOpKnap key={nr} dele={dele} auto vedFaerdig={() => setNaeste(true)} />
        </div>
      )}

      <div className="intro-knapper">
        {!sidste && (
          <button type="button" className="knap" key={`v${nr}`} onClick={videre} autoFocus>
            {t('intro.videre')}
          </button>
        )}
        {!sidste && (
          <button type="button" className="knap knap-diskret" onClick={onFaerdig}>
            {t('intro.spring')}
          </button>
        )}
      </div>
      <p className="sr-only">{t('intro.styring')}</p>
    </main>
  );
}
