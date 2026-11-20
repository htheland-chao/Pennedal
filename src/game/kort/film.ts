import Phaser from 'phaser';
import type { KortScene } from '../KortScene';
import type { EnkelHandling, KameraMaal } from '../../engine/film/typer';
import { feltMidte, feltVed, findVej } from '../kort';
import { fuglFremkomst } from './effekter';

/**
 * Phaser-arbejderen til filmsekvenser (20. november 2026): kamera, figurer, ton til sort, rystelse, blink og stemning
 * på kortet. React-arbejderen (src/components/film/) klarer bjælker, replikker, musik, lyd og valg.
 * Afspilleren (src/engine/film/afspiller.ts) bestemmer rækkefølgen. Her udføres én handling ad gangen.
 *
 * Regler: kameraet zoomer kun i hele trin og står på hele pixel (kortets egne regler). Med rolig bevægelse hopper
 * kameraet, og intet ryster. Med "Mindre uhygge" er der intet blink og intet mørke. Alt, filmen lægger på kortet
 * (kamera, ton, mørke, figurer, der toner væk), fjernes i oprydningen.
 */

/** De handlinger, Phaser udfører. */
export const PHASER_HANDLINGER = ['kamera', 'figur', 'ton', 'ryst', 'blink', 'stemning'] as const;
type PhaserHandling = Extract<EnkelHandling, { type: (typeof PHASER_HANDLINGER)[number] }>;
export function erPhaserHandling(h: EnkelHandling): h is PhaserHandling {
  return (PHASER_HANDLINGER as readonly string[]).includes(h.type);
}

export type FilmKamera = { fra: { x: number; y: number }; maal: KameraMaal; start: number; ms: number; zoom: number; nyZoom: number };
export type FilmTilstand = {
  kamera: FilmKamera | null;
  /** Lag over hele billedet: sort (ton), mørke og hvidt (blink). */
  lag: Partial<Record<'ton' | 'moerke' | 'blink', Phaser.GameObjects.Rectangle>>;
  /** Objekter, der er tonet væk i filmen. De kommer tilbage i oprydningen. */
  vaek: Set<string>;
  /** Kaldes i oprydningen, fx for at stoppe en lytter. */
  stop: (() => void)[];
};

const TONING = 500;
const BLINK = 180;
const FREMKOMST = 1800;

/** Hvor kameraet skal stå lige nu i filmen, og med hvilken zoom. null: filmen styrer ikke kameraet. */
export function filmKamera(s: KortScene): { x: number; y: number; zoom: number } | null {
  const k = s.film?.kamera;
  if (!k) return null;
  const p = maalPunkt(s, k.maal) ?? k.fra;
  const t = k.ms <= 0 ? 1 : Math.min(1, (s.time.now - k.start) / k.ms);
  const e = Phaser.Math.Easing.Sine.InOut(t);
  return { x: k.fra.x + (p.x - k.fra.x) * e, y: k.fra.y + (p.y - k.fra.y) * e, zoom: t >= 1 ? k.nyZoom : k.zoom };
}

/** Hvor et felt eller en figur er. Kameraet sigter lidt over fødderne, som det gør til hverdag. */
function maalPunkt(s: KortScene, m: KameraMaal): { x: number; y: number } | null {
  if ('felt' in m) return feltMidte(m.felt);
  if (m.figur === 'spiller') return { x: s.spiller.x, y: s.spiller.y - 10 };
  if (m.figur === 'aeseloere') return { x: s.fugl.x, y: s.fugl.y - 10 };
  const o = s.data_.sted.objekter.find((x) => x.id === m.figur && x.felt);
  if (!o?.felt) return null;
  const p = feltMidte(o.felt);
  return { x: p.x, y: p.y - 10 };
}

/** Billederne bag en figur: hovedpersonen med skygge og lanterne, Æseløre eller et objekts billeder. */
function billeder(s: KortScene, id: string): Phaser.GameObjects.Image[] {
  if (id === 'spiller') return [s.spiller, s.spillerSkygge, ...(s.lanterne.visible ? [s.lanterne] : [])];
  if (id === 'aeseloere') return [s.fugl];
  return s.objektBilleder.get(id) ?? [];
}

const vent = (s: KortScene, ms: number) => new Promise<void>((r) => (ms <= 0 ? r() : s.time.delayedCall(ms, () => r())));

/** Et lag over hele billedet, der følger kameraet. Stort nok til at dække alt, også med zoom. */
function lag(s: KortScene, navn: 'ton' | 'moerke' | 'blink', farve: number): Phaser.GameObjects.Rectangle {
  const f = s.film!;
  const dybde = { moerke: 2_900_000, ton: 3_000_000, blink: 3_000_001 }[navn];
  f.lag[navn] ??= s.add.rectangle(0, 0, 20_000, 20_000, farve).setScrollFactor(0).setDepth(dybde).setAlpha(0);
  return f.lag[navn]!;
}

function tonLag(s: KortScene, r: Phaser.GameObjects.Rectangle, alpha: number, ms: number): Promise<void> {
  s.tweens.killTweensOf(r);
  if (ms <= 0) {
    r.setAlpha(alpha);
    return Promise.resolve();
  }
  return new Promise((ok) => s.tweens.add({ targets: r, alpha, duration: ms, ease: 'Sine.InOut', onComplete: () => ok() }));
}

/** Gør filmens tilstand klar: spillet låses, og kameraet tages over. */
export function filmStart(s: KortScene) {
  s.film = { kamera: null, lag: {}, vaek: new Set(), stop: [] };
  s.laas(true);
}

/** Udfører en handling og holder, til den er færdig. */
export function filmUdfoer(s: KortScene, h: PhaserHandling, slut = false): Promise<void> {
  if (!s.film || !s.spiller) return Promise.resolve();
  const roligt = s.roligt || slut;
  const mild = s.data_.mindreUhygge;
  switch (h.type) {
    case 'kamera': {
      const cam = s.cameras.main;
      const ms = roligt ? 0 : (h.ms ?? 0);
      const zoom = s.film.kamera ? s.film.kamera.nyZoom : 1;
      s.film.kamera = { fra: { x: cam.midPoint.x, y: cam.midPoint.y }, maal: h.til, start: s.time.now, ms, zoom, nyZoom: h.zoom ?? zoom };
      return vent(s, ms);
    }
    case 'figur':
      return figur(s, h, roligt);
    case 'ton':
      return tonLag(s, lag(s, 'ton', 0x000000), h.til === 'sort' ? 1 : 0, slut ? 0 : (h.ms ?? TONING));
    case 'ryst': {
      if (roligt || mild) return Promise.resolve();
      const ms = h.ms ?? 300;
      s.cameras.main.shake(ms, 0.004);
      return vent(s, ms);
    }
    case 'blink': {
      if (mild || slut) return Promise.resolve();
      const b = lag(s, 'blink', 0xfff6e0).setAlpha(0.85);
      return tonLag(s, b, 0, BLINK);
    }
    case 'stemning': {
      const ventes: Promise<void>[] = [];
      if (h.moerke !== undefined && !mild) ventes.push(tonLag(s, lag(s, 'moerke', 0x0b0a1a), h.moerke ? 0.5 : 0, slut ? 0 : 800));
      if (h.partikler !== undefined) saetPartikler(s, h.partikler);
      return Promise.all(ventes).then(() => undefined);
    }
  }
}

function saetPartikler(s: KortScene, synlige: boolean) {
  for (const p of s.partikler) p.billede.setVisible(synlige);
  for (const t of s.taage) for (const b of t.billeder) b.setVisible(synlige);
}

function figur(s: KortScene, h: Extract<PhaserHandling, { type: 'figur' }>, roligt: boolean): Promise<void> {
  const f = s.film!;
  const ventes: Promise<void>[] = [];
  const bs = billeder(s, h.id);
  if (bs.length === 0) console.warn(`Filmen: figuren ${h.id} findes ikke på stedet`);
  if (h.vend && h.id === 'spiller') s.retning = h.vend;
  else if (h.vend) bs.forEach((b) => b.setFlipX(h.vend === 'venstre'));
  if (h.toner === 'frem' && h.id === 'aeseloere') {
    if (roligt) {
      stopFremkomst(s);
      s.fugl.setVisible(true).setAlpha(1);
    } else if (!s.fugl.visible) {
      fuglFremkomst(s);
      ventes.push(vent(s, FREMKOMST));
    }
  } else if (h.toner) {
    const frem = h.toner === 'frem';
    if (h.id !== 'spiller') f.vaek[frem ? 'delete' : 'add'](h.id);
    for (const b of bs) {
      s.tweens.killTweensOf(b);
      if (frem && !b.visible) b.setAlpha(0);
      b.setVisible(true);
      if (roligt) {
        b.setAlpha(frem ? 1 : 0).setVisible(frem);
        continue;
      }
      ventes.push(
        new Promise((ok) =>
          s.tweens.add({ targets: b, alpha: frem ? 1 : 0, duration: TONING, onComplete: () => (b.setVisible(frem), ok()) }),
        ),
      );
    }
  }
  if (h.gaaTil && h.id === 'spiller') ventes.push(gaa(s, h.gaaTil, roligt));
  return Promise.all(ventes).then(() => undefined);
}

/** Hovedpersonen går ad den korteste vej. Ved "Spring over" står den bare der. */
function gaa(s: KortScene, til: [number, number], straks: boolean): Promise<void> {
  const m = feltMidte(til);
  if (straks) {
    s.vej = [];
    s.filmGaar = false;
    s.spiller.setPosition(m.x, m.y);
    return Promise.resolve();
  }
  const v = findVej(s.kort, feltVed(s.spiller.x, s.spiller.y - 2), til, (x, y) => s.erFast(x, y));
  if (!v) {
    console.warn(`Filmen: ingen vej til ${til.join(',')}`);
    return Promise.resolve();
  }
  s.vej = v;
  s.filmGaar = true;
  return new Promise((ok) => {
    const tjek = () => {
      if (s.vej.length > 0 && s.filmGaar) return;
      s.events.off('update', tjek);
      s.filmGaar = false;
      ok();
    };
    s.events.on('update', tjek);
    s.film?.stop.push(() => s.events.off('update', tjek));
  });
}

/** Stopper Æseløres fremkomst og sætter ham ved hovedpersonen. */
function stopFremkomst(s: KortScene) {
  if (!s.fuglAnim) return;
  s.fuglAnim = false;
  s.tweens.killTweensOf(s.fugl);
  s.fugl.setScale(1).setAngle(0).setAlpha(1).setPosition(s.spiller.x - 14, s.spiller.y + 4);
}

/** "Spring over": handlingen sættes til sin sluttilstand uden animation. */
export function filmSlut(s: KortScene, h: PhaserHandling) {
  if (h.type === 'figur' && h.toner === 'frem' && h.id === 'aeseloere') stopFremkomst(s);
  void filmUdfoer(s, h, true);
}

/** Altid til sidst: kameraet gives tilbage, lagene fjernes, figurerne kommer frem igen, og spillet låses op. */
export function filmOprydning(s: KortScene) {
  const f = s.film;
  if (!f) return;
  f.stop.forEach((stop) => stop());
  for (const r of Object.values(f.lag)) {
    s.tweens.killTweensOf(r);
    r.destroy();
  }
  stopFremkomst(s);
  if (s.spiller) {
    for (const b of billeder(s, 'spiller')) b.setVisible(true).setAlpha(1);
    for (const id of f.vaek) if (!(s.data_.skjulte ?? []).includes(id)) for (const b of billeder(s, id)) b.setVisible(true).setAlpha(1);
    saetPartikler(s, true);
    s.cameras.main.shakeEffect.reset();
    // Kameraet glider videre herfra, som det plejer.
    s.kam = { x: s.cameras.main.midPoint.x, y: s.cameras.main.midPoint.y };
  }
  s.filmGaar = false;
  s.film = null;
  s.laas(false);
}

/** Det, React-arbejderen får fra Phaser. hent giver kortets scene, eller null, hvis stedet ikke er et kort. */
export type PhaserFilm = {
  start(): void;
  udfoer(h: EnkelHandling): Promise<void>;
  slut(h: EnkelHandling): void;
  oprydning(): void;
};
export function phaserFilm(hent: () => KortScene | null): PhaserFilm {
  return {
    start: () => {
      const s = hent();
      if (s) filmStart(s);
    },
    udfoer: (h) => {
      const s = hent();
      return s && erPhaserHandling(h) ? filmUdfoer(s, h) : Promise.resolve();
    },
    slut: (h) => {
      const s = hent();
      if (s && erPhaserHandling(h)) filmSlut(s, h);
    },
    oprydning: () => {
      const s = hent();
      if (s) filmOprydning(s);
    },
  };
}
