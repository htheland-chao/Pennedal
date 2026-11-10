import { describe, expect, it } from 'vitest';
import { glid } from './kamera';

/** Kører glidningen i et antal sekunder med en bestemt billedfrekvens. Giver slutpladsen og det største spring pr. billede. */
function koer(fps: number, sekunder: number, maal: number, fart: number) {
  let x = 0;
  let stoerst = 0;
  for (let i = 0; i < fps * sekunder; i++) {
    const ny = glid(x, maal, 1 / fps, fart);
    stoerst = Math.max(stoerst, Math.abs(ny - x));
    x = ny;
  }
  return { x, stoerst };
}

describe('kameraets glidning', () => {
  it('er lige hurtig ved 60 og 240 billeder pr. sekund', () => {
    for (const t of [0.1, 0.25, 0.5]) expect(koer(240, t, 36, 2.5).x).toBeCloseTo(koer(60, t, 36, 2.5).x, 0);
  });

  it('en vending (fremadkigget skifter 36 pixel) giver ingen store spring pr. billede', () => {
    // Før: 12 % pr. billede, dvs. 4,3 pixel i første billede og helt fremme på 0,1 sekund ved 240 billeder pr. sekund.
    expect(koer(240, 1, 36, 2.5).stoerst).toBeLessThan(0.5);
    expect(koer(60, 1, 36, 2.5).stoerst).toBeLessThan(1.5);
  });

  it('når frem på cirka et sekund', () => {
    expect(koer(60, 1.2, 36, 2.5).x).toBeGreaterThan(33);
  });

  it('dt = Infinity sætter kameraet på plads med det samme', () => {
    expect(glid(0, 10, Infinity, 7)).toBe(10);
  });
});
