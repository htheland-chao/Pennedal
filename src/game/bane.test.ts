import { describe, expect, it } from 'vitest';
import { kapitler } from '../content';
import { find, kanKlares, laesBane, viskedeGrupper } from './bane';

describe('platformbaner', () => {
  const baner = kapitler.flatMap((k) => Object.entries(k.steder).filter(([, s]) => s.bane).map(([id, s]) => ({ id, bane: laesBane(s.bane!) })));

  it('findes', () => {
    expect(baner.map((b) => b.id)).toEqual(expect.arrayContaining(['tagene', 'viskestien', 'hvidesti']));
  });

  it('kan klares fra start til alle lanterner og målet', () => {
    for (const { id, bane } of baner) expect(kanKlares(bane), id).toEqual([]);
  });

  it('har én ordsten foran hver gruppe viskede planker', () => {
    for (const { id, bane } of baner) {
      const sten = find(bane, 'O').sort((a, b) => a[0] - b[0]);
      const grupper = viskedeGrupper(bane);
      expect(sten.length, id).toBe(grupper.length);
      sten.forEach(([x], i) => expect(x, `${id} ordsten ${i}`).toBeLessThan(Math.min(...grupper[i].map((p) => p[0]))));
    }
  });

  it('kan ikke klares uden at skrive plankerne tilbage', () => {
    // Uden planker (v som luft over tomrum) kan man ikke nå målet på Viskeskovens bane.
    const s = kapitler.find((k) => k.kapitel === 3)!.steder.viskestien.bane!;
    const uden = laesBane(s.map((r) => r.replace(/v/g, '.').replace(/O/g, '.')));
    expect(kanKlares(uden).some((m) => m.startsWith('M'))).toBe(true);
  });
});
