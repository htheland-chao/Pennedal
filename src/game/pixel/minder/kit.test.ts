import { describe, expect, it } from 'vitest';
import { ellipse, firkant, forening, kapsel, minus, polygon } from './kit';

// Formerne i minderne (26. november 2026): masker, der siger, hvilke pixel hører til.
describe('minde-former', () => {
  it('ellipse og firkant dækker deres midte og ikke uden for kassen', () => {
    const e = ellipse(10, 10, 5, 3);
    expect(e.m(10, 10)).toBe(true);
    expect(e.m(10, 15)).toBe(false);
    const f = firkant(0, 0, 10, 6, 2);
    expect(f.m(5, 3)).toBe(true);
    expect(f.m(0, 0)).toBe(false);
    expect(f.m(10, 3)).toBe(false);
  });
  it('kapsel følger linjen, og polygon finder indersiden', () => {
    const k = kapsel(0, 0, 20, 20, 2);
    expect(k.m(10, 10)).toBe(true);
    expect(k.m(18, 2)).toBe(false);
    const p = polygon([[0, 0], [20, 0], [0, 20]]);
    expect(p.m(3, 3)).toBe(true);
    expect(p.m(18, 18)).toBe(false);
  });
  it('forening og minus samler og skærer', () => {
    const a = firkant(0, 0, 10, 10);
    const b = firkant(5, 0, 10, 10);
    expect(forening(a, b).m(12, 5)).toBe(true);
    expect(minus(a, b).m(7, 5)).toBe(false);
    expect(minus(a, b).m(2, 5)).toBe(true);
  });
});
