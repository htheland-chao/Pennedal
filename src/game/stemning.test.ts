import { describe, expect, it } from 'vitest';
import { indenfor, partikelTrin, partiklerFor, stedTone, vignetStyrke } from './stemning';

describe('stemning pr. sted', () => {
  it('har få partikler, så Chromebooken kan følge med', () => {
    for (const tema of ['pennedal', 'floden', 'fyrtaarn', 'viskeskov', 'eng', 'torv', 'smoeger', 'bibliotek', 'kaelder', 'trykkeri'])
      expect(partiklerFor(tema).reduce((s, p) => s + p.antal, 0)).toBeLessThanOrEqual(30);
  });

  it('ildfluer gløder langsomt og blinker ikke hurtigt', () => {
    const p = { art: 'ildflue' as const, x: 0, y: 0, fase: 0.4 };
    let skift = 0;
    let foer = partikelTrin(p, 1 / 60, 0).alpha > 0.6;
    for (let i = 1; i < 600; i++) {
      const nu = partikelTrin(p, 1 / 60, i / 60).alpha > 0.6;
      if (nu !== foer) skift++;
      foer = nu;
    }
    // Højst et par skift på 10 sekunder.
    expect(skift).toBeLessThanOrEqual(4);
  });

  it('holder partikler inden for kameraets udsnit', () => {
    expect(indenfor(105, 0, 100, 0)).toBe(5);
    expect(indenfor(-3, 0, 100, 0)).toBe(97);
    expect(indenfor(50, 0, 100)).toBe(50);
  });

  it('dæmper vignetten med Mindre uhygge og har lyse farvetoner', () => {
    expect(vignetStyrke('kaelder', true)).toBeLessThan(vignetStyrke('kaelder', false));
    for (const tema of ['viskeskov', 'torv', 'eng', 'smoeger']) for (const k of stedTone(tema, false)!) expect(k).toBeGreaterThanOrEqual(200);
    expect(stedTone('pennedal', false)).toBeNull();
  });
});
