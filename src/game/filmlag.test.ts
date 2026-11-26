import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { lagHandling, lagRyd } from './filmlag';

/** En lille falsk scene: tæller lag, rystelser og tweens, uden Phaser og uden canvas. */
function falskScene() {
  const lag: { alpha: number }[] = [];
  const rektangel = () => {
    const r = { alpha: 0, setScrollFactor: () => r, setDepth: () => r, setAlpha: (a: number) => ((r.alpha = a), r), destroy: vi.fn() };
    lag.push(r);
    return r;
  };
  const s = {
    add: { rectangle: vi.fn(rektangel) },
    cameras: { main: { shake: vi.fn(), shakeEffect: { reset: vi.fn() } } },
    tweens: { killTweensOf: vi.fn(), add: vi.fn((c: { targets: { alpha: number }; alpha: number; onComplete: () => void }) => ((c.targets.alpha = c.alpha), c.onComplete())) },
    time: { delayedCall: vi.fn((_ms: number, f: () => void) => f()) },
  };
  return { s: s as unknown as Phaser.Scene, raa: s, lag };
}

// "Mindre uhygge" i filmsekvenser (26. november 2026): intet blink, intet mørke og ingen rystelse (krav 7).
describe('filmens lag over billedet', () => {
  it('med "Mindre uhygge" blinker, rystes og mørknes intet', async () => {
    const { s, raa } = falskScene();
    for (const h of [{ type: 'blink' }, { type: 'ryst', ms: 300 }, { type: 'stemning', moerke: true }] as const) await lagHandling(s, h, true, false);
    expect(raa.add.rectangle).not.toHaveBeenCalled();
    expect(raa.cameras.main.shake).not.toHaveBeenCalled();
  });

  it('uden "Mindre uhygge" blinker, rystes og mørknes billedet, og oprydningen fjerner lagene', async () => {
    const { s, raa, lag } = falskScene();
    await lagHandling(s, { type: 'blink' }, false, false);
    await lagHandling(s, { type: 'ryst', ms: 300 }, false, false);
    await lagHandling(s, { type: 'stemning', moerke: true }, false, false);
    expect(raa.cameras.main.shake).toHaveBeenCalledTimes(1);
    expect(lag).toHaveLength(2);
    expect(lag[1].alpha).toBe(0.5);
    lagRyd(s);
    expect(raa.cameras.main.shakeEffect.reset).toHaveBeenCalled();
  });

  it('ton til sort er ikke uhygge og virker også med "Mindre uhygge". "Spring over" sætter det med det samme', async () => {
    const { s, raa, lag } = falskScene();
    await lagHandling(s, { type: 'ton', til: 'sort', ms: 800 }, true, true);
    expect(lag[0].alpha).toBe(1);
    expect(raa.tweens.add).not.toHaveBeenCalled();
  });
});
