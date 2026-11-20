import { afterEach, describe, expect, it } from 'vitest';
import { hentMusikOverride, overtonMusik, saetMusikOverride } from './afspiller';

// Filmsekvenser (20. november 2026): musikken kan tone over til en anden sang eller til stilhed.
// Uden lyd i testmiljøet tjekkes kun, hvilken sang der er valgt. Selve overtoningen er ikke testet her.
describe('overtoning i musikken', () => {
  afterEach(() => saetMusikOverride(null));

  it('vælger sangen eller stilheden, filmen beder om, og giver stedets sang tilbage', () => {
    overtonMusik('stille', 600);
    expect(hentMusikOverride()).toBe('stille');
    overtonMusik('pennedal', 4000);
    expect(hentMusikOverride()).toBe('pennedal');
    overtonMusik(null, 0);
    expect(hentMusikOverride()).toBeNull();
  });
});
