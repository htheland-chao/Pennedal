import { describe, expect, it } from 'vitest';
import data from '../content/ord/halvsaetning.json';
import { lavHalvsaetningOpgave, type HalvData } from './halvsaetning';

const d = data as unknown as HalvData;

describe('Halvsætningen', () => {
  it('data: tre forskellige slutninger, gyldige tegn, ingen sætningstegn i selve sætningen', () => {
    for (const s of d.slut) expect(new Set([s.svar, ...s.forkerte]).size).toBe(3);
    for (const t of d.tegn) {
      expect(['.', '?', '!']).toContain(t.tegn);
      expect(t.saetning).not.toMatch(/[.?!]$/);
    }
    expect(new Set(d.tegn.map((t) => t.tegn)).size).toBe(3);
  });
  it('skiftevis slutning og sætningstegn, med færdighed', () => {
    const a = lavHalvsaetningOpgave(d, 0, 1, Math.random);
    expect(a.faerdighed).toBe('fort.struktur');
    expect(a.muligheder).toContain(a.svar);
    const b = lavHalvsaetningOpgave(d, 1, 1, Math.random);
    expect(b.faerdighed).toBe('tegn.saetningstegn');
    expect(b.muligheder).toHaveLength(3);
    expect(b.muligheder).toContain(b.svar);
  });
  it('niveau 1 giver kun lette sætninger, og brugte kommer ikke igen', () => {
    for (let i = 0; i < 10; i++) expect(['s01', 's02', 's03', 's04']).toContain(lavHalvsaetningOpgave(d, 0, 1, Math.random).id);
    expect(lavHalvsaetningOpgave(d, 0, 1, () => 0, ['s01', 's02', 's03']).id).toBe('s04');
  });
});
