import { describe, expect, it } from 'vitest';
import { avatarDele } from '../../content';
import { moerkere } from './sprites';
import { ALLE_FARVER, iPaletten, naermesteFarve, trin } from './palet';

describe('masterpaletten', () => {
  it('har 64 forskellige farver skrevet med små bogstaver', () => {
    expect(ALLE_FARVER).toHaveLength(64);
    expect(new Set(ALLE_FARVER).size).toBe(64);
    for (const f of ALLE_FARVER) expect(f).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('finder en farve i paletten', () => {
    expect(naermesteFarve('#1b1b24')).toBe('#1b1b24');
    expect(iPaletten(naermesteFarve('#123456'))).toBe(true);
  });

  it('giver en skygge, der er mørkere end stoffet og står i paletten', () => {
    for (const f of ALLE_FARVER) {
      const s = moerkere(f);
      expect(iPaletten(s)).toBe(true);
      if (f !== '#070912') expect(s, f).not.toBe(f);
    }
  });

  it('giver en lys kant, der står i paletten', () => {
    expect(iPaletten(trin('#2c6fbb', '#ffffff', 1))).toBe(true);
    expect(trin('#2c6fbb', '#ffffff', 1)).not.toBe('#2c6fbb');
  });

  it('bruger kun palettens farver i avatardesigneren, og ingen to valg er ens', () => {
    for (const [del, d] of Object.entries(avatarDele)) {
      if (!d.farver) continue;
      for (const f of d.farver) expect(iPaletten(f), `${del}: ${f}`).toBe(true);
      expect(new Set(d.farver).size, del).toBe(d.farver.length);
    }
  });
});
