import type Phaser from 'phaser';
import type { EnkelHandling } from '../engine/film/typer';

/**
 * Det, en filmsekvens gør ved hele billedet, uanset scene (kort eller platformbane), 26. november 2026:
 * ton til sort, blink, mørke og rystelse. Lagene ligger over alt og følger kameraet. De fjernes i lagRyd.
 * Regler: "Mindre uhygge" giver intet blink, intet mørke og ingen rystelse. Rolig bevægelse giver ingen rystelse.
 */

/** De handlinger, Phaser udfører (kort/film.ts og bane/film.ts). Resten klarer React (src/components/film/). */
export const PHASER_HANDLINGER = ['kamera', 'figur', 'ton', 'ryst', 'blink', 'stemning'] as const;
export type PhaserHandling = Extract<EnkelHandling, { type: (typeof PHASER_HANDLINGER)[number] }>;
export function erPhaserHandling(h: EnkelHandling): h is PhaserHandling {
  return (PHASER_HANDLINGER as readonly string[]).includes(h.type);
}

export const TONING = 500;
const BLINK = 180;

type Navn = 'ton' | 'moerke' | 'blink';
const lagFor = new WeakMap<Phaser.Scene, Partial<Record<Navn, Phaser.GameObjects.Rectangle>>>();

/** Rolig bevægelse (styresystemets "reducer bevægelse"). */
export function roligBevaegelse(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export const vent = (s: Phaser.Scene, ms: number) => new Promise<void>((r) => (ms <= 0 ? r() : s.time.delayedCall(ms, () => r())));

/** Et lag over hele billedet, der følger kameraet. Stort nok til at dække alt, også med zoom. */
function lag(s: Phaser.Scene, navn: Navn, farve: number): Phaser.GameObjects.Rectangle {
  const alle = lagFor.get(s) ?? {};
  lagFor.set(s, alle);
  const dybde = { moerke: 2_900_000, ton: 3_000_000, blink: 3_000_001 }[navn];
  alle[navn] ??= s.add.rectangle(0, 0, 20_000, 20_000, farve).setScrollFactor(0).setDepth(dybde).setAlpha(0);
  return alle[navn]!;
}

function tonLag(s: Phaser.Scene, r: Phaser.GameObjects.Rectangle, alpha: number, ms: number): Promise<void> {
  s.tweens.killTweensOf(r);
  if (ms <= 0) {
    r.setAlpha(alpha);
    return Promise.resolve();
  }
  return new Promise((ok) => s.tweens.add({ targets: r, alpha, duration: ms, ease: 'Sine.InOut', onComplete: () => ok() }));
}

/**
 * Ton, ryst, blink og mørke. slut: "Spring over", sæt sluttilstanden uden animation.
 * Partikler i stemning er stedets egne og klares af scenen selv.
 */
export function lagHandling(s: Phaser.Scene, h: PhaserHandling, mild: boolean, slut: boolean): Promise<void> {
  const roligt = roligBevaegelse() || slut;
  switch (h.type) {
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
      return tonLag(s, lag(s, 'blink', 0xfff6e0).setAlpha(0.85), 0, BLINK);
    }
    case 'stemning':
      if (h.moerke === undefined || mild) return Promise.resolve();
      return tonLag(s, lag(s, 'moerke', 0x0b0a1a), h.moerke ? 0.5 : 0, slut ? 0 : 800);
    default:
      return Promise.resolve();
  }
}

/** Oprydning: lagene fjernes, og en rystelse stoppes. */
export function lagRyd(s: Phaser.Scene) {
  for (const r of Object.values(lagFor.get(s) ?? {})) {
    s.tweens.killTweensOf(r);
    r.destroy();
  }
  lagFor.delete(s);
  s.cameras.main?.shakeEffect.reset();
}

/** En figur toner frem eller væk over TONING ms (straks: med det samme). */
export function tonFigur(s: Phaser.Scene, bs: Phaser.GameObjects.Image[], frem: boolean, straks: boolean): Promise<void> {
  const ventes = bs.map((b) => {
    s.tweens.killTweensOf(b);
    if (frem && !b.visible) b.setAlpha(0);
    b.setVisible(true);
    if (straks) {
      b.setAlpha(frem ? 1 : 0).setVisible(frem);
      return Promise.resolve();
    }
    return new Promise<void>((ok) =>
      s.tweens.add({ targets: b, alpha: frem ? 1 : 0, duration: TONING, onComplete: () => (b.setVisible(frem), ok()) }),
    );
  });
  return Promise.all(ventes).then(() => undefined);
}
