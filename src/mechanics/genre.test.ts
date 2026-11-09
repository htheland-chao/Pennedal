import { describe, expect, it } from 'vitest';
import data from '../content/ord/genre.json';
import { GENRER, lavGenreOpgave, lavKendetegn, lavKlassificer, type GenreData } from './genre';

const d = data as unknown as GenreData;
const rnd = () => 0.42;

describe('genrer', () => {
  it('alle fire genrer har navn, regel, eksempel, tekster og kendetegn', () => {
    for (const g of GENRER) {
      expect(d.navne[g]).toBeTruthy();
      expect(d.regler[g]).toBeTruthy();
      expect(d.eksempler[g]).toBeTruthy();
      expect(d.tekster.filter((t) => t.genre === g).length).toBeGreaterThanOrEqual(5);
      expect(d.kendetegn[g].length).toBeGreaterThanOrEqual(5);
    }
  });
  it('kendetegn er ikke de samme i to genrer', () => {
    const alle = GENRER.flatMap((g) => d.kendetegn[g]);
    expect(new Set(alle).size).toBe(alle.length);
  });
  it('klassificer vælger efter niveau og undgår brugte', () => {
    expect(lavKlassificer(d, 1, rnd).id).toMatch(/[ekgs][12]$/);
    const brugt = d.tekster.filter((t) => t.svaerhed === 1 && t.id !== 'g2').map((t) => t.id);
    expect(lavKlassificer(d, 1, rnd, brugt).id).toBe('g2');
  });
  it('kendetegn har den rigtige og to fra andre genrer', () => {
    for (let i = 0; i < 20; i++) {
      const o = lavKendetegn(d, 'krimi', Math.random);
      expect(o.art).toBe('kendetegn');
      expect(d.kendetegn.krimi).toContain(o.svar);
      expect(o.muligheder.filter((m) => d.kendetegn.krimi.includes(m))).toEqual([o.svar]);
      expect(o.muligheder).toHaveLength(3);
    }
  });
  it('skiftevis tekst og kendetegn med fokus', () => {
    expect(lavGenreOpgave(d, 0, 'gyser', 2, rnd).art).toBe('klassificer');
    const o = lavGenreOpgave(d, 1, 'gyser', 2, rnd);
    expect(o.art).toBe('kendetegn');
    expect(o.genre).toBe('gyser');
  });
});
