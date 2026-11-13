import { describe, expect, it } from 'vitest';
import { finFigur, scale2x } from './fin';
import { avatarPixel } from './sprites';
import { STANDARD_AVATAR } from '../../engine/gem';

describe('fin hovedperson', () => {
  it('scale2x gør hver pixel til fire og bevarer en ensfarvet flade', () => {
    expect(scale2x([['A']])).toEqual([
      ['A', 'A'],
      ['A', 'A'],
    ]);
  });

  it('er 32 x 48, har samme omrids som den almindelige figur, og alle farver findes', () => {
    for (const r of ['ned', 'op', 'hoejre'] as const)
      for (const f of [0, 1, 2] as const) {
        const t = avatarPixel(STANDARD_AVATAR, r, f);
        const fin = finFigur(t);
        expect(fin.raekker).toHaveLength(48);
        for (const raekke of fin.raekker) expect(raekke).toHaveLength(32);
        for (const c of fin.raekker.join('')) if (c !== '.') expect(fin.palet[c], c).toBeTruthy();
        // Næsten samme form: højst 5 % af pixelene skifter mellem tom og fyldt (kun hjørner rundes).
        let forskel = 0;
        fin.raekker.forEach((raekke, y) => [...raekke].forEach((c, x) => (c === '.') !== (t.raekker[y >> 1][x >> 1] === '.') && forskel++));
        expect(forskel / (32 * 48)).toBeLessThan(0.05);
      }
  });
});
