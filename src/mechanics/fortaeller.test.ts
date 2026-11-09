import { describe, expect, it } from 'vitest';
import data from '../content/ord/fortaeller.json';
import { helSaetning, lavFortsaet, lavKlassificer, type FortsaetSaetning, type KlassificerSaetning } from './fortaeller';

const klassificer = data.klassificer as KlassificerSaetning[];
const fortsaet = data.fortsaet as FortsaetSaetning[];
let n = 7;
const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);

describe('fortæller og synsvinkel', () => {
  it('har sætninger, hvor en jeg-fortæller altid siger jeg, mig eller min', () => {
    for (const s of klassificer) {
      const ord = s.tekst.toLowerCase().split(/[^a-zæøå]+/);
      const jeg = ord.some((o) => ['jeg', 'mig', 'min', 'mit', 'mine'].includes(o));
      expect(jeg, s.tekst).toBe(s.fortaeller === 'jeg');
    }
  });

  it('har hver sætning i begge udgaver nogenlunde lige ofte', () => {
    const jeg = klassificer.filter((s) => s.fortaeller === 'jeg').length;
    expect(Math.abs(jeg - (klassificer.length - jeg))).toBeLessThanOrEqual(2);
  });

  it('holder fast i den samme fortæller, når hullet udfyldes', () => {
    for (const s of fortsaet) {
      const jegFoer = /\b(jeg|mig|min|mit)\b/i.test(s.foer);
      expect(s.svar === 'Jeg', s.foer).toBe(jegFoer);
      expect(s.forkerte, s.foer).not.toContain(s.svar);
    }
    for (let i = 0; i < 20; i++) {
      const o = lavFortsaet(fortsaet, 1 + (i % 5), rnd);
      expect(o.muligheder).toHaveLength(3);
      expect(o.muligheder).toContain(o.svar);
      expect(helSaetning(o, o.svar)).toContain(`${o.svar} ${o.efter}`);
    }
  });

  it('vælger svære sætninger på højt niveau og undgår de brugte', () => {
    expect(lavKlassificer(klassificer, 5, rnd).svaerhed).toBe(3);
    const brugt = klassificer.filter((s) => s.svaerhed === 1).map((s) => s.id).slice(0, -1);
    expect(brugt).not.toContain(lavKlassificer(klassificer, 1, rnd, brugt).id);
  });
});
