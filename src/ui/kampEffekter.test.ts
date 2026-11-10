import { describe, expect, it } from 'vitest';
import { trinFor } from './kampEffekter';

const p = { fjende: (nr: number): [number, number] => [20, 40 + nr * 10], medlem: (): [number, number] => [80, 60] };
const navn = { fjende: (nr: number) => `V${nr}`, medlem: (id: string) => id };

describe('kampens animationer', () => {
  it('et slag på et svagt punkt giver en stråle, et nedslag, en stjerne og et tal', () => {
    const [tr] = trinFor([{ type: 'ramt', fjende: 0, skade: 4, svag: true, stort: false }], p, navn, ['avatar']);
    expect(tr.effekter.map((e) => e.type)).toEqual(['straale', 'nedslag', 'svag', 'tal']);
    expect(tr.fjendeLiv).toEqual([{ nr: 0, delta: -4 }]);
    expect(tr.linje?.noegle).toBe('kamp.kort.svag');
  });

  it('samler et angreb mod hele holdet i ét trin', () => {
    const t = trinFor(
      [
        { type: 'angreb', fjende: 1, angreb: 'gab', hvem: 'avatar', skade: 1 },
        { type: 'angreb', fjende: 1, angreb: 'gab', hvem: 'aeseloere', skade: 1 },
        { type: 'angreb', fjende: 0, angreb: 'aed', hvem: 'avatar', skade: 3 },
      ],
      p,
      navn,
      ['avatar', 'aeseloere'],
    );
    expect(t).toHaveLength(2);
    expect(t[0].holdLiv).toEqual([
      { id: 'avatar', delta: -1 },
      { id: 'aeseloere', delta: -1 },
    ]);
  });

  it('viser et skjold uden skade, når forsvaret tager hele slaget', () => {
    const [tr] = trinFor([{ type: 'angreb', fjende: 0, angreb: 'aed', hvem: 'avatar', skade: 0 }], p, navn, ['avatar']);
    expect(tr.linje?.noegle).toBe('kamp.kort.afvist');
    expect(tr.ryst?.skaerm).toBe(false);
  });

  it('det store slag viser pennestregen én gang, selv om det rammer flere', () => {
    const t = trinFor(
      [
        { type: 'ramt', fjende: 0, skade: 3, svag: false, stort: true },
        { type: 'ramt', fjende: 1, skade: 5, svag: true, stort: true },
      ],
      p,
      navn,
      ['avatar'],
    );
    expect(t.flatMap((x) => x.effekter).filter((e) => e.type === 'stort')).toHaveLength(1);
  });
});

describe('lyd til kampens trin', () => {
  it('vælger én lyd pr. trin, og et væsen, der opløses, overdøver slaget', async () => {
    const { lydForTrin } = await import('./kampEffekter');
    expect(lydForTrin({ effekter: [{ type: 'straale' }] })).toBe('slag');
    expect(lydForTrin({ effekter: [{ type: 'straale' }], oploest: [0] })).toBe('smelter');
    expect(lydForTrin({ effekter: [{ type: 'stort' }] })).toBe('stort');
    expect(lydForTrin({ effekter: [{ type: 'angreb-aed' }] })).toBe('skade');
    expect(lydForTrin({ effekter: [{ type: 'sejr' }], oploest: [1] })).toBe('sejr');
    expect(lydForTrin({ effekter: [{ type: 'tal' }] })).toBeNull();
  });
});
