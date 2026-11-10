import { describe, expect, it } from 'vitest';
import { EFFEKTER, lydeFor, MILDE, type EffektNavn } from './effekter';

describe('lydeffekter', () => {
  const navne = Object.keys(EFFEKTER) as EffektNavn[];

  it('er korte, så de aldrig fylder over tale og musik', () => {
    for (const n of navne)
      for (const mild of [false, true]) {
        const lyde = lydeFor(n, mild);
        expect(lyde.length, n).toBeGreaterThan(0);
        const slut = Math.max(...lyde.map((l) => l.start + l.laengde));
        expect(slut, n).toBeLessThanOrEqual(1);
      }
  });

  it('bliver aldrig for høje, heller ikke når tonerne lægges sammen', () => {
    for (const n of navne) {
      for (const l of EFFEKTER[n]) {
        expect(l.styrke, n).toBeGreaterThan(0);
        expect(l.styrke, n).toBeLessThanOrEqual(0.3);
      }
      // Toner, der spiller samtidig, må tilsammen højst give 0,6.
      const lyde = EFFEKTER[n];
      for (const a of lyde) {
        const samtidig = lyde.filter((b) => b.start < a.start + a.laengde && a.start < b.start + b.laengde);
        expect(samtidig.reduce((s, b) => s + b.styrke, 0), n).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('et forkert svar lyder blødt (kun sinustoner, ingen støj eller summer)', () => {
    for (const l of EFFEKTER.forkert) expect(l.type === 'tone' && l.boelge === 'sine').toBe(true);
  });

  it('med Mindre uhygge er slag og skade uden hård støj og savtak', () => {
    for (const n of Object.keys(MILDE) as EffektNavn[])
      for (const l of lydeFor(n, true)) {
        expect(l.type, n).toBe('tone');
        if (l.type === 'tone') expect(['sine', 'triangle']).toContain(l.boelge);
      }
  });
});
