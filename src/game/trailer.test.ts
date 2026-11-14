import { describe, expect, it } from 'vitest';
import { BFELT } from './bane';
import { baneSti, standHoejde, TRAILER_BANE } from './trailer';

describe('introens trailer: figurens vej over tagene', () => {
  const sti = baneSti(TRAILER_BANE, 2, 44);

  it('starter på taget og kommer helt over', () => {
    expect(sti[0]).toMatchObject({ t: 0, x: 2 * BFELT + 8, y: 7 * BFELT });
    expect(sti.at(-1)!.x).toBe(44 * BFELT + 8);
  });

  it('går fremad i tid og sted', () => {
    for (let i = 1; i < sti.length; i++) {
      expect(sti[i].t).toBeGreaterThan(sti[i - 1].t);
      expect(sti[i].x).toBeGreaterThanOrEqual(sti[i - 1].x);
    }
  });

  it('lander aldrig i et hul eller i blæk', () => {
    for (const p of sti) {
      if (p.x % BFELT !== 8) continue;
      const h = standHoejde(TRAILER_BANE, (p.x - 8) / BFELT);
      // Midt over en kolonne er figuren enten på jorden eller i luften over den.
      if (h === null) expect(p.y).toBeLessThan(7 * BFELT);
      else expect(p.y).toBeLessThanOrEqual(h);
    }
  });

  it('hopper over hullerne og blækpytten', () => {
    expect(standHoejde(TRAILER_BANE, 10)).toBeNull();
    expect(standHoejde(TRAILER_BANE, 27)).toBeNull();
    expect(sti.some((p) => p.y < 6 * BFELT)).toBe(true);
  });

  it('tager mellem 5 og 8 sekunder, så klippet ikke bliver for langt', () => {
    expect(sti.at(-1)!.t).toBeGreaterThan(5);
    expect(sti.at(-1)!.t).toBeLessThan(8);
  });
});
