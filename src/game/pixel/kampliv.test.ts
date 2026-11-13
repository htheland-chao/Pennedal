import { describe, expect, it } from 'vitest';
import { arme, kampRammer, laen, spred } from './kampliv';
import { avatarPixel, KLATTEN } from './sprites';
import { STANDARD_AVATAR } from '../../engine/gem';
import { TOMORD, VIMS } from './viskeskov';

const fyldte = (t: { raekker: string[] }) => t.raekker.join('').replace(/\./g, '').length;

describe('liv i kampen', () => {
  it('fire billeder i samme størrelse, og de er forskellige', () => {
    for (const [kort, r] of [
      [avatarPixel(STANDARD_AVATAR, 'hoejre', 0), 1],
      [KLATTEN, 1],
      [TOMORD, -1],
    ] as const) {
      const rammer = kampRammer(kort, r);
      expect(rammer).toHaveLength(4);
      for (const k of rammer) expect(k.raekker.map((x) => x.length)).toEqual(kort.raekker.map((x) => x.padEnd(Math.max(...kort.raekker.map((y) => y.length))).length));
      expect(new Set(rammer.map((k) => k.raekker.join('|'))).size).toBeGreaterThanOrEqual(3);
    }
  });

  it('en figur uden ben flækker ikke, når benene spredes', () => {
    for (const kort of [KLATTEN, TOMORD]) expect(spred(kort).raekker).toEqual(kort.raekker);
  });

  it('hovedpersonens ben spredes, og armene flytter sig', () => {
    const t = avatarPixel(STANDARD_AVATAR, 'hoejre', 0);
    expect(spred(t).raekker).not.toEqual(t.raekker);
    expect(arme(t, true).raekker).not.toEqual(t.raekker);
    expect(laen(t, 1).raekker).not.toEqual(t.raekker);
  });

  it('figuren mister næsten ingen pixel (ingen huller)', () => {
    for (const kort of [VIMS, KLATTEN, avatarPixel(STANDARD_AVATAR, 'hoejre', 0)])
      for (const k of kampRammer(kort, 1)) expect(fyldte(k)).toBeGreaterThan(fyldte(kort) * 0.9);
  });
});
