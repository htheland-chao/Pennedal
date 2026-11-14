import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
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
import { TrailerKlip, type KlipId } from './IntroTrailer';

const KLIP: SceneId[] = ['steder', 'bane', 'venner', 'kamp'];
/** Scener, der viser det samme billede, beholder det, så zoom og regn fortsætter uden et klip. */
const BILLEDE_NOEGLE: Partial<Record<SceneId, string>> = { skuffe: 'regn', opgave: 'kaelder', opgave2: 'kaelder' };

/**
 * Overgange mellem scenerne (Henrik, 14. november 2026). Et gardin dækker skærmen halvvejs, scenen skifter, og
 * gardinet trækkes væk igen. sort: historien toner gennem sort. blaek: en blækklat breder sig ind i traileren.
 * klip: et hurtigt blækstrøg mellem trailerens klip. lys: et lysglimt ind i titlen. Ingen ved samme billede.
 */
type Overgang = 'sort' | 'blaek' | 'klip' | 'lys';
const HALV_MS: Record<Overgang, number> = { sort: 450, blaek: 450, klip: 220, lys: 300 };
function overgang(fra: SceneId, til: SceneId): Overgang | null {
  if (BILLEDE_NOEGLE[til] && (BILLEDE_NOEGLE[til] === BILLEDE_NOEGLE[fra] || BILLEDE_NOEGLE[til] === fra)) return null;
  if (til === 'titel') return 'lys';
  if (KLIP.includes(til)) return KLIP.includes(fra) ? 'klip' : 'blaek';
  return 'sort';
}

/**
 * Introen (31. oktober 2026). Den skal vække nysgerrighed uden at afsløre forhistorien
 * (se docs/historie.md): man ser en skuffe blive lukket, men ikke hvad der ligger i den.
 * Al tekst er HTML, grafikken er pixelbilleder, og bevægelsen er CSS. Kan springes over.
 */
type SceneId = 'studie' | 'regn' | 'skuffe' | 'land' | 'moerke' | 'kaelder' | 'opgave' | 'opgave2' | KlipId | 'titel';
/** varighed: klippet varer mindst så længe (ms), også når teksten er læst op før. */
type Scene = { id: SceneId; tekst?: TekstId; hvisken?: TekstId; slut?: TekstId; varighed?: number };

export const SCENER: Scene[] = [
  { id: 'studie' },
  { id: 'regn', tekst: 'intro.1' },
  { id: 'skuffe', tekst: 'intro.2' },
  { id: 'land', tekst: 'intro.3' },
  { id: 'moerke', tekst: 'intro.4' },
  { id: 'kaelder', tekst: 'intro.5', slut: 'intro.5.slut' },
  // Hvem du er, hvad der er på spil, og hvad du skal (Henrik, 10. november 2026). Twistet afsløres ikke.
  { id: 'opgave', tekst: 'intro.6' },
  // To linjer ad gangen, ikke fire (Henrik, 14. november 2026).
  { id: 'opgave2', tekst: 'intro.6.slut' },
  // Traileren (Henrik, 14. november 2026): smagsprøver på spillet lige før titlen.
  { id: 'steder', tekst: 'intro.trailer.1', varighed: 5300 },
  { id: 'bane', tekst: 'intro.trailer.2', varighed: 6900 },
  { id: 'venner', tekst: 'intro.trailer.3', varighed: 4300 },
  { id: 'kamp', tekst: 'intro.trailer.4', varighed: 6300 },
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

function Billede({ scene, b, mild }: { scene: SceneId; b: Billeder; mild: boolean }) {
  if (KLIP.includes(scene)) return <TrailerKlip klip={scene as KlipId} mild={mild} />;
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
  if (scene === 'kaelder' || scene === 'opgave' || scene === 'opgave2')
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
  const sceneStart = useRef(Date.now());
  useEffect(() => {
    sceneStart.current = Date.now();
  }, [nr]);

  const [gardin, setGardin] = useState<Overgang | null>(null);
  // Kun den scene, der vises nu, kan melde, at den er læst op.
  const nrNu = useRef(nr);
  nrNu.current = nr;
  const vedFaerdig = (mit: number) => () => {
    if (nrNu.current === mit) setNaeste(true);
  };
  const skifter = useRef(false);
  const videre = useCallback(() => {
    if (skifter.current) return;
    setNaeste(false);
    if (nr >= SCENER.length - 1) {
      onFaerdig();
      return;
    }
    const type = overgang(SCENER[nr].id, SCENER[nr + 1].id);
    const roligt = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!type || roligt) {
      setNr(nr + 1);
      return;
    }
    // Gardinet dækker skærmen, scenen skifter bag det, og gardinet trækkes væk.
    skifter.current = true;
    setGardin(type);
    window.setTimeout(() => {
      // Den gamle scenes oplæsning kan være blevet færdig bag gardinet. Den nye scene starter forfra.
      setNaeste(false);
      setNr(nr + 1);
    }, HALV_MS[type]);
    window.setTimeout(() => {
      setGardin(null);
      skifter.current = false;
    }, HALV_MS[type] * 2);
  }, [nr, onFaerdig]);

  const dele: Del[] = [];
  if (scene.tekst) dele.push({ tekst: t(scene.tekst), figur: 'fortaeller', rum: 'intro' });
  if (scene.hvisken) dele.push({ tekst: t(scene.hvisken), figur: 'ufaerdige' });
  if (scene.slut) dele.push({ tekst: t(scene.slut), figur: 'fortaeller', rum: 'intro' });

  // Studiets navn går selv videre. Scener med tekst går videre, når teksten er læst op.
  // Uden oplæsning får eleven god tid til at læse selv. Titlen venter altid på eleven.
  useEffect(() => {
    if (sidste || !indstillinger.autoVidere) return;
    let ms: number | null = null;
    const gaaet = Date.now() - sceneStart.current;
    if (scene.id === 'studie') ms = STUDIE_MS;
    else if (naeste) ms = scene.varighed ? Math.max(400, scene.varighed - gaaet) : PAUSE_MS;
    else if (!indstillinger.oplaesning) ms = Math.max(scene.varighed ?? 0, 4000 + dele.reduce((s, d) => s + d.tekst.length, 0) * 90) - gaaet;
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
        return;
      }
      // Enter, mellemrum og højre pil går videre, men ikke når en knap har fokus (så virker knappen selv).
      if (sidste || !['Enter', ' ', 'ArrowRight'].includes(e.key)) return;
      if (e.target instanceof HTMLElement && e.target.closest('button, a, input')) return;
      e.preventDefault();
      videre();
    };
    window.addEventListener('keydown', tast);
    return () => window.removeEventListener('keydown', tast);
  }, [onFaerdig, sidste, videre]);

  /** Et tryk på billedet går videre. Tryk på knapper (kryds, højttaler) gør det ikke. */
  const trykVidere = (e: MouseEvent) => {
    if (sidste || (e.target instanceof HTMLElement && e.target.closest('button, a, input'))) return;
    videre();
  };
  // Pilen viser, at eleven selv kan gå videre: når teksten er læst op, eller med det samme uden oplæsning.
  const klar = scene.id !== 'studie' && (naeste || !indstillinger.oplaesning || dele.length === 0);

  const mild = indstillinger.mindreUhygge ? ' mild' : '';
  return (
    <main className={`intro scene-${scene.id}${mild}`} aria-label={t('intro.titel')} onClick={trykVidere}>
      <div className="intro-scene" aria-hidden="true">
        {b && <Billede key={BILLEDE_NOEGLE[scene.id] ?? scene.id} scene={scene.id} b={b} mild={indstillinger.mindreUhygge} />}
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
          <LaesOpKnap key={nr} dele={dele} auto vedFaerdig={vedFaerdig(nr)} />
        </div>
      )}

      {/* Introen er som en film: et lille kryds i hjørnet springer den over (Henrik, 14. november 2026). */}
      {!sidste && (
        <button type="button" className="intro-luk" onClick={onFaerdig} aria-label={t('intro.spring')} title={t('intro.spring')}>
          <span aria-hidden="true" />
        </button>
      )}
      {!sidste && klar && <span className="intro-videre-pil" aria-hidden="true" />}
      {gardin && <span className={`intro-gardin ${gardin}`} style={{ animationDuration: `${HALV_MS[gardin] * 2}ms` }} aria-hidden="true" />}
      <p className="sr-only">{t('intro.styring')}</p>
    </main>
  );
}
