import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { STANDARD_AVATAR } from '../engine/gem';
import { BFELT, laesBane } from '../game/bane';
import { tegnBane, tegnBjergBaggrund, tegnByBaggrund, tegnSkovBaggrund, tegnSoeBaggrund } from '../game/pixel/banetegn';
import { finFigur } from '../game/pixel/fin';
import { figurRammer, type FigurId } from '../game/pixel/kampliv';
import { FJENDE_PLADS, HOLD_PLADS, tegnKampBaggrund } from '../game/pixel/kampscene';
import { lerred, tegnkortTilLerred } from '../game/pixel/lerred';
import { avatarPixel, FUGL, type Tegnkort } from '../game/pixel/sprites';
import { STUMMING, TOMORD, VIMS } from '../game/pixel/viskeskov';
import { baneSti, TRAILER_BANE } from '../game/trailer';

/**
 * Introens trailer (Henrik, 14. november 2026): fire hurtige klip til sidst i introen, før titlen.
 * Steder i landet, en platformbane, hjælperne og en kamp. Ingen twists, ingen Klatten som ven og
 * ikke Den Ufærdiges ansigt (docs/historie.md). Al tekst står i HTML under billedet (Intro.tsx).
 * Grafikken er spillets egne pixelfigurer og baggrunde. Bevægelsen er CSS og Web Animations.
 * Med "reducer bevægelse" står billederne stille.
 */
export type KlipId = 'steder' | 'bane' | 'venner' | 'kamp';

/** Scenen er 320 x 180 som i resten af introen og i kampene. */
const B = 320;
const H = 180;

type Strimmel = { uri: string; n: number; b: number; h: number; ms: number };
type Grafik = {
  steder: { bag: string; forgrund: string }[];
  by: string;
  bane: string;
  eng: string;
  kamp: string;
  gaa: Strimmel;
  avatarFin: Strimmel;
  vims: Strimmel;
  fugl: Strimmel;
  tomordet: Strimmel;
  stumming: Strimmel;
  slag: string;
};

const spejl = (k: Tegnkort): Tegnkort => ({ ...k, raekker: k.raekker.map((r) => [...r].reverse().join('')) });

/** Alle billeder i et klip sat side om side, så CSS kan skifte mellem dem. */
function strimmel(rammer: Tegnkort[], ms: number, fin: boolean): Strimmel {
  const lag = rammer.map((r) => tegnkortTilLerred(fin ? finFigur(r) : r));
  const b = lag[0].width;
  const h = lag[0].height;
  const c = lerred(b * lag.length, h);
  const g = c.getContext('2d')!;
  lag.forEach((l, i) => g.drawImage(l, i * b, 0));
  return { uri: c.toDataURL('image/png'), n: lag.length, b: rammer[0].raekker[0].length, h: rammer[0].raekker.length, ms };
}

function levende(id: FigurId, kort: Tegnkort, retning: 1 | -1): Strimmel {
  const { rammer, ms } = figurRammer(id, kort, retning);
  return strimmel(rammer, ms, true);
}

/** En flad bane til glimtene af landet: jord med et par bakker. */
const JORD = laesBane([
  ...Array(7).fill('.'.repeat(30)),
  '.......##..........###........',
  '##############################',
  '##############################',
  '##############################',
]);

/** Et lille glimt, når et slag rammer (stjerne af pixel, ingen bogstaver). */
const SLAG: Tegnkort = {
  raekker: ['....Y....', '.Y..Y..Y.', '..YyyyY..', '..yWWWy..', 'YYyWWWyYY', '..yWWWy..', '..YyyyY..', '.Y..Y..Y.', '....Y....'],
  palet: { Y: '#f0c45a', y: '#ffe9a8', W: '#ffffff' },
};

let cache: Grafik | null | undefined;
/** Tegner alt én gang. Uden canvas (enhedstests) bliver det null, og klippene viser intet. */
function hentGrafik(): Grafik | null {
  if (cache !== undefined) return cache;
  try {
    const url = (c: HTMLCanvasElement) => c.toDataURL('image/png');
    const BW = 480;
    const a = STANDARD_AVATAR;
    cache = {
      steder: [
        { bag: url(tegnSkovBaggrund(BW, H)), forgrund: url(tegnBane(JORD, 'viskesti')) },
        { bag: url(tegnBjergBaggrund(BW, H)), forgrund: url(tegnBane(JORD, 'rimbjerg')) },
        { bag: url(tegnSoeBaggrund(BW, H)), forgrund: url(tegnBane(JORD, 'blaeksoe')) },
      ],
      by: url(tegnByBaggrund(Math.ceil((TRAILER_BANE.bredde * BFELT) / 2) + B, H)),
      bane: url(tegnBane(TRAILER_BANE, 'tage')),
      eng: url(tegnKampBaggrund('skov', false)),
      kamp: url(tegnKampBaggrund('viskeskov', false)),
      gaa: strimmel([avatarPixel(a, 'hoejre', 1), avatarPixel(a, 'hoejre', 0), avatarPixel(a, 'hoejre', 2), avatarPixel(a, 'hoejre', 0)], 120, false),
      avatarFin: levende('avatar', avatarPixel(a, 'hoejre', 0), 1),
      vims: levende('vims', spejl(VIMS), 1),
      fugl: levende('fugl', spejl(FUGL), 1),
      tomordet: levende('tomordet', spejl(TOMORD), -1),
      stumming: levende('stumming', spejl(STUMMING), -1),
      slag: url(tegnkortTilLerred(SLAG)),
    };
  } catch {
    cache = null;
  }
  return cache;
}

const pct = (v: number, af: number) => `${(v / af) * 100}%`;

/** En figur med fodpunkt (x, y) i scenens 320 x 180. skala er størrelsen i forhold til figurens pixel. */
function Figur({
  s,
  x,
  y,
  skala = 1,
  className = '',
  refFn,
}: {
  s: Strimmel;
  x: number;
  y: number;
  skala?: number;
  className?: string;
  refFn?: (el: HTMLElement | null) => void;
}) {
  const b = s.b * skala;
  const h = s.h * skala;
  const stil = { left: pct(x - b / 2, B), top: pct(y - h, H), width: pct(b, B), height: pct(h, H), '--n': s.n, '--ms': `${s.ms}ms` } as CSSProperties;
  return (
    <span className={`trailer-figur ${className}`} style={stil} ref={refFn}>
      <img src={s.uri} alt="" />
    </span>
  );
}

const roligt = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Flytning som translate i procent af figurens egen størrelse (så den skalerer med skærmen). */
const flyt = (dx: number, dy: number, b: number, h: number, ekstra = '') => `translate(${(dx / b) * 100}%, ${(dy / h) * 100}%) ${ekstra}`;

function Steder({ g }: { g: Grafik }) {
  return (
    <>
      {g.steder.map((s, i) => (
        <span key={i} className="intro-lag trailer-glimt" style={{ '--i': i } as CSSProperties}>
          <img className="trailer-bag" src={s.bag} alt="" />
          <img className="trailer-jord" src={s.forgrund} alt="" />
          <Figur s={g.gaa} x={110} y={132} className="gaar" />
        </span>
      ))}
    </>
  );
}

function Platform({ g }: { g: Grafik }) {
  const verden = useRef<HTMLSpanElement>(null);
  const figur = useRef<HTMLSpanElement>(null);
  const bag = useRef<HTMLImageElement>(null);
  const W = TRAILER_BANE.bredde * BFELT;
  const BH = TRAILER_BANE.hoejde * BFELT;
  useEffect(() => {
    if (roligt() || !verden.current || !figur.current || !bag.current) return;
    const sti = baneSti(TRAILER_BANE, 2, TRAILER_BANE.bredde - 2);
    const varighed = sti.at(-1)!.t * 1000;
    const kam = (x: number) => Math.max(0, Math.min(W - B, x - 120));
    const off = (t: number) => t / sti.at(-1)!.t;
    const a1 = figur.current.animate(
      sti.map((p) => ({ offset: off(p.t), transform: flyt(p.x - sti[0].x, p.y - sti[0].y, 16, 24) })),
      { duration: varighed, fill: 'forwards' },
    );
    const a2 = verden.current.animate(
      sti.map((p) => ({ offset: off(p.t), transform: `translateX(${(-kam(p.x) / W) * 100}%)` })),
      { duration: varighed, fill: 'forwards' },
    );
    // Baggrunden glider halvt så hurtigt (parallakse).
    const a3 = bag.current.animate(
      sti.map((p) => ({ offset: off(p.t), transform: `translateX(${(-kam(p.x) / 2 / (W / 2 + B)) * 100}%)` })),
      { duration: varighed, fill: 'forwards' },
    );
    return () => [a1, a2, a3].forEach((a) => a.cancel());
  }, [W]);
  const start = baneSti(TRAILER_BANE, 2, 3)[0];
  return (
    <>
      <img ref={bag} className="trailer-by" src={g.by} alt="" style={{ width: pct(W / 2 + B, B) }} />
      <span ref={verden} className="trailer-verden" style={{ width: pct(W, B), height: pct(BH, H), top: pct(H - BH, H) }}>
        <img className="intro-lag" src={g.bane} alt="" />
        <span
          className="trailer-figur gaar"
          ref={figur}
          style={
            {
              left: pct(start.x - 8, W),
              top: pct(start.y - 24, BH),
              width: pct(16, W),
              height: pct(24, BH),
              '--n': g.gaa.n,
              '--ms': `${g.gaa.ms}ms`,
            } as CSSProperties
          }
        >
          <img src={g.gaa.uri} alt="" />
        </span>
      </span>
    </>
  );
}

function Venner({ g }: { g: Grafik }) {
  const fugl = useRef<HTMLElement | null>(null);
  const vims = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (roligt() || !fugl.current || !vims.current) return;
    const fb = g.fugl.b * 1.8;
    const fh = g.fugl.h * 1.8;
    // Æseløre dykker ind fra venstre og lander ved siden af hovedpersonen.
    const a1 = fugl.current.animate(
      [
        { offset: 0, transform: flyt(-200, -70, fb, fh) },
        { offset: 0.35, transform: flyt(-110, -10, fb, fh, 'rotate(12deg)') },
        { offset: 0.6, transform: flyt(-30, 12, fb, fh, 'rotate(-8deg)') },
        { offset: 1, transform: flyt(0, 0, fb, fh) },
      ],
      { duration: 1800, easing: 'ease-out', fill: 'backwards' },
    );
    // Vims hopper ind fra højre i tre hop.
    const vb = g.vims.b * 1.8;
    const vh = g.vims.h * 1.8;
    const hop: Keyframe[] = [];
    [150, 100, 50, 0].forEach((dx, i, alle) => {
      hop.push({ offset: i / alle.length, transform: flyt(dx, 0, vb, vh) });
      if (i < alle.length - 1) hop.push({ offset: (i + 0.5) / alle.length, transform: flyt(dx - 25, -26, vb, vh) });
    });
    hop.push({ offset: 1, transform: flyt(0, 0, vb, vh) });
    const a2 = vims.current.animate(hop, { duration: 1700, delay: 500, easing: 'linear', fill: 'backwards' });
    return () => [a1, a2].forEach((a) => a.cancel());
  }, [g]);
  return (
    <>
      <img className="intro-lag" src={g.eng} alt="" />
      <span className="intro-lag trailer-zoom">
        <Figur s={g.avatarFin} x={160} y={140} skala={1.8} />
        <Figur
          s={g.fugl}
          x={118}
          y={104}
          skala={1.8}
          refFn={(el) => {
            fugl.current = el;
          }}
        />
        <Figur
          s={g.vims}
          x={204}
          y={142}
          skala={1.8}
          refFn={(el) => {
            vims.current = el;
          }}
        />
      </span>
    </>
  );
}

function Kamp({ g, mild }: { g: Grafik; mild: boolean }) {
  const scene = useRef<HTMLSpanElement>(null);
  const ref = useRef<Record<string, HTMLElement | null>>({});
  const saet = (id: string) => (el: HTMLElement | null) => {
    ref.current[id] = el;
  };
  const [p1, p2] = FJENDE_PLADS[1];
  useEffect(() => {
    const r = ref.current;
    if (roligt() || !scene.current || !r.avatar || !r.vims || !r.fugl || !r.tom || !r.stum || !r.slag1 || !r.slag2 || !r.ord) return;
    const anim: Animation[] = [];
    const a = (el: Element, k: Keyframe[], o: KeyframeAnimationOptions) => anim.push(el.animate(k, { fill: 'forwards', ...o }));
    const angreb = (el: HTMLElement, dx: number, b: number, h: number, delay: number) =>
      a(el, [{ transform: 'none' }, { transform: flyt(dx, -8, b, h), offset: 0.45 }, { transform: 'none' }], { duration: 600, delay, easing: 'ease-in-out' });
    const ramt = (el: HTMLElement, delay: number) =>
      a(
        el,
        [
          { filter: 'none', transform: 'none' },
          { filter: 'brightness(3)', transform: 'translateX(6%)', offset: 0.2 },
          { filter: 'none', transform: 'translateX(-6%)', offset: 0.5 },
          { filter: 'none', transform: 'none' },
        ],
        { duration: 450, delay },
      );
    const glimt = (el: HTMLElement, delay: number) =>
      a(
        el,
        [
          { opacity: 0, transform: 'scale(0.4)' },
          { opacity: 1, transform: 'scale(1.3)', offset: 0.3 },
          { opacity: 0, transform: 'scale(1.6)' },
        ],
        { duration: 420, delay },
      );
    // 1. Hovedpersonen angriber Tomordet.
    angreb(r.avatar, 70, 16 * 1.8, 24 * 1.8, 200);
    ramt(r.tom, 470);
    glimt(r.slag1, 470);
    // 2. Vims angriber Stummingen.
    angreb(r.vims, 80, g.vims.b * 1.8, g.vims.h * 1.8, 1200);
    ramt(r.stum, 1470);
    glimt(r.slag2, 1470);
    // 3. Æseløre dykker ned over Tomordet.
    a(r.fugl, [{ transform: 'none' }, { transform: flyt(110, -30, g.fugl.b * 1.8, g.fugl.h * 1.8, 'rotate(20deg)'), offset: 0.5 }, { transform: 'none' }], {
      duration: 800,
      delay: 2100,
      easing: 'ease-in-out',
    });
    ramt(r.tom, 2500);
    // 4. Tomordet slår igen: det farer frem, og scenen ryster.
    a(r.tom, [{ transform: 'none' }, { transform: flyt(-90, 0, g.tomordet.b * 2.4, g.tomordet.h * 2.4), offset: 0.4 }, { transform: 'none' }], {
      duration: 700,
      delay: 3100,
      easing: 'ease-in',
    });
    a(
      scene.current,
      [
        { transform: 'none' },
        { transform: 'translate(-1.2%, 0.8%)' },
        { transform: 'translate(1.2%, -0.6%)' },
        { transform: 'translate(-0.6%, 0.4%)' },
        { transform: 'none' },
      ],
      { duration: mild ? 250 : 450, delay: 3380 },
    );
    // 5. Ordene falder på plads, og Tomordet bliver roligt og forsvinder.
    a(r.ord, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1500, delay: 4300 });
    a(
      r.tom,
      [
        { opacity: 1, filter: 'none' },
        { opacity: 1, filter: 'brightness(1.6) saturate(0.3)', offset: 0.5 },
        { opacity: 0, filter: 'brightness(2) saturate(0)' },
      ],
      { duration: 1200, delay: 4700 },
    );
    return () => anim.forEach((x) => x.cancel());
  }, [g, mild]);
  const tomB = g.tomordet.b * 2.4;
  const tomH = g.tomordet.h * 2.4;
  return (
    <span ref={scene} className="intro-lag">
      <img className="intro-lag" src={g.kamp} alt="" />
      <Figur s={g.avatarFin} x={HOLD_PLADS[0][0]} y={HOLD_PLADS[0][1]} skala={1.8} refFn={saet('avatar')} />
      <Figur s={g.fugl} x={HOLD_PLADS[1][0] - 22} y={HOLD_PLADS[1][1] - 46} skala={1.8} refFn={saet('fugl')} />
      <Figur s={g.vims} x={HOLD_PLADS[2][0]} y={HOLD_PLADS[2][1]} skala={1.8} refFn={saet('vims')} />
      <Figur s={g.tomordet} x={p1[0]} y={p1[1]} skala={2.4} refFn={saet('tom')} />
      <Figur s={g.stumming} x={p2[0]} y={p2[1]} skala={2.4} refFn={saet('stum')} />
      <img
        className="trailer-slag"
        ref={saet('slag1')}
        src={g.slag}
        alt=""
        style={{ left: pct(p1[0] - 14, B), top: pct(p1[1] - tomH / 2 - 14, H), width: pct(28, B) }}
      />
      <img className="trailer-slag" ref={saet('slag2')} src={g.slag} alt="" style={{ left: pct(p2[0] - 14, B), top: pct(p2[1] - 40, H), width: pct(28, B) }} />
      <span className="trailer-ord" ref={saet('ord')} style={{ left: pct(p1[0] - tomB / 2, B), top: pct(p1[1] - tomH - 12, H), width: pct(tomB, B) }}>
        {[0, 1, 2, 3, 4].map((j) => (
          <b key={j} style={{ '--j': j } as CSSProperties} />
        ))}
      </span>
    </span>
  );
}

export function TrailerKlip({ klip, mild }: { klip: KlipId; mild: boolean }) {
  const g = useMemo(() => hentGrafik(), []);
  if (!g) return null;
  if (klip === 'steder') return <Steder g={g} />;
  if (klip === 'bane') return <Platform g={g} />;
  if (klip === 'venner') return <Venner g={g} />;
  return <Kamp g={g} mild={mild} />;
}
