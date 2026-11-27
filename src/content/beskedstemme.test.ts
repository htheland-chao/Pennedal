import { describe, expect, it } from 'vitest';
import { kapitler } from './index';
import { AESELOERE_MOEDES, beskedFigur } from './beskedstemme.mjs';

// Æseløre siger først beskederne, når eleven har mødt ham (Henrik, 27. november 2026).
describe('stemmen til beskederne i opgaverne', () => {
  it('er fortælleren i biblioteket og Æseløre fra kælderen', () => {
    expect(beskedFigur(kapitler, 'k1-logbog')).toBe('fortaeller');
    expect(beskedFigur(kapitler, AESELOERE_MOEDES)).toBe('aeseloere');
    expect(beskedFigur(kapitler, 'k1-hviske')).toBe('aeseloere');
    expect(beskedFigur(kapitler, 'k2-opslag')).toBe('aeseloere');
  });
  it('før mødet findes der kun opgaver, der kender fortællerens stemme (Bevisjagten)', () => {
    const k1 = kapitler.find((k) => k.kapitel === 1)!;
    const foer = k1.trin.slice(0, k1.trin.findIndex((t) => t.id === AESELOERE_MOEDES));
    const opgaver = foer.filter((t) => !['dialog', 'film', 'skift'].includes(t.type));
    expect(opgaver.map((t) => t.type)).toEqual(['bevisjagt']);
  });
});
