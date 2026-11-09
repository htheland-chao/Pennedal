import { describe, expect, it } from 'vitest';
import data from '../content/ord/rim.json';
import { antalStavelser, lavIkkeRimOpgave, lavRimOpgave, lavRytmeOpgave, type RimOrd } from './rim';

const rim = data.rim as RimOrd[];
let n = 0;
const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);

describe('rim og rytme', () => {
  it('har ingen ord, der både rimer og står som forkert', () => {
    for (const o of rim) {
      expect(o.rimer.filter((r) => o.forkerte.includes(r)), o.ord).toEqual([]);
      expect(o.rimer.length, o.ord).toBeGreaterThanOrEqual(2);
      expect(o.forkerte.length, o.ord).toBeGreaterThanOrEqual(2);
    }
  });

  it('finder det ord, der rimer, blandt tre', () => {
    for (let i = 0; i < 30; i++) {
      const o = lavRimOpgave(rim, 1 + (i % 5), rnd);
      expect(o.muligheder).toHaveLength(3);
      expect(o.muligheder).toContain(o.svar);
      const kilde = rim.find((x) => x.ord === o.ord)!;
      expect(kilde.rimer).toContain(o.svar);
      expect(o.muligheder.filter((m) => kilde.rimer.includes(m))).toHaveLength(1);
    }
  });

  it('finder det ord, der ikke rimer', () => {
    for (let i = 0; i < 30; i++) {
      const o = lavIkkeRimOpgave(rim, 1 + (i % 5), rnd);
      const kilde = rim.find((x) => x.ord === o.ord)!;
      expect(kilde.forkerte).toContain(o.svar);
      expect(o.muligheder.filter((m) => kilde.rimer.includes(m))).toHaveLength(2);
    }
  });

  it('tæller stavelser ud fra delingen og vælger svære ord på højt niveau', () => {
    expect(antalStavelser('ba-nan')).toBe(2);
    expect(antalStavelser('kat')).toBe(1);
    const o = lavRytmeOpgave(data.stavelser, 5, rnd);
    expect(Number(o.svar)).toBeGreaterThanOrEqual(3);
    expect(o.muligheder).toEqual(['1', '2', '3', '4']);
  });

  it('undgår de ord, der lige er brugt', () => {
    const brugt = rim.filter((x) => x.svaerhed === 1).map((x) => x.ord).slice(0, -1);
    const o = lavRimOpgave(rim, 1, rnd, brugt);
    expect(brugt).not.toContain(o.ord);
  });
});
