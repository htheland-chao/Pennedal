import { describe, expect, it } from 'vitest';
import { LIV, portraetBilleder, type PortraetFigur } from './levende';
import { PORTRAETTER } from './portraetter';

describe('levende portrætter', () => {
  const figurer = Object.keys(PORTRAETTER) as PortraetFigur[];

  it('alle billeder har samme størrelse som portrættet, og alle farver findes i paletten', () => {
    for (const f of figurer) {
      const b = portraetBilleder(f);
      for (const kort of [b.blink, b.tale, b.blinkTale]) {
        expect(kort.raekker.map((r) => r.length), f).toEqual(PORTRAETTER[f].raekker.map((r) => r.length));
        for (const c of kort.raekker.join('')) if (c !== '.') expect(kort.palet[c], `${f} ${c}`).toBeTruthy();
      }
    }
  });

  it('figurer med øjne blinker, og figurer med mund åbner den', () => {
    for (const f of figurer) {
      const b = portraetBilleder(f);
      if (LIV[f].oejne) expect(b.blink.raekker, `${f} blinker ikke`).not.toEqual(b.hvile.raekker);
      if (LIV[f].mund) expect(b.tale.raekker, `${f} taler ikke`).not.toEqual(b.hvile.raekker);
    }
  });
});
