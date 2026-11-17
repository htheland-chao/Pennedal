import { describe, expect, it } from 'vitest';
import { lavImpuls, rumProfil } from './rumklang';

const energi = (x: Float32Array, fra: number, til: number) => {
  let e = 0;
  for (let i = Math.floor(fra * x.length); i < Math.floor(til * x.length); i++) e += x[i] * x[i];
  return e;
};

describe('rumklang', () => {
  for (const id of ['hviske', 'intro', 'minde'] as const) {
    const p = rumProfil(id);
    const x = lavImpuls(48000, p, 0);

    it(`${id}: har den rigtige længde og ingen ugyldige tal`, () => {
      expect(x.length).toBe(Math.round(p.foerForsinkelse * 48000) + Math.ceil(p.hale * 48000));
      expect(x.every((v) => Number.isFinite(v))).toBe(true);
      expect(p.hale).toBeLessThanOrEqual(3);
      expect(p.vaad).toBeGreaterThan(0);
      expect(p.vaad).toBeLessThanOrEqual(0.6);
    });

    it(`${id}: er stille før rummet begynder og klinger ud`, () => {
      const stille = Math.round(p.foerForsinkelse * 48000);
      expect(x.slice(0, stille).every((v) => v === 0)).toBe(true);
      expect(energi(x, 0.9, 1)).toBeLessThan(energi(x, 0.05, 0.15) * 0.01);
    });

    it(`${id}: giver ens resultat hver gang, men forskel mellem venstre og højre`, () => {
      expect(lavImpuls(48000, p, 0)).toEqual(x);
      expect(lavImpuls(48000, p, 1)).not.toEqual(x);
    });
  }
});
