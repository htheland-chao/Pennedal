import { describe, expect, it } from 'vitest';
import { kapitler } from '../../content';
import { arpeggio, frekvens, laesSpor, trinISpor } from './noder';
import { SANGE } from './sange';

describe('musik', () => {
  it('regner frekvenser ud', () => {
    expect(frekvens('A4')).toBeCloseTo(440);
    expect(frekvens('A5')).toBeCloseTo(880);
    expect(frekvens('C4')).toBeCloseTo(261.63, 1);
    expect(frekvens('Bb3')).toBeCloseTo(frekvens('A#3'));
    expect(() => frekvens('H4')).toThrow();
  });

  it('læser toner, pauser og holdte toner', () => {
    expect(laesSpor('C4 - - . E4 | G4 -')).toEqual([
      { trin: 0, laengde: 3, frekvens: frekvens('C4') },
      { trin: 4, laengde: 1, frekvens: frekvens('E4') },
      { trin: 5, laengde: 2, frekvens: frekvens('G4') },
    ]);
    expect(trinISpor(arpeggio([['C4', 'E4', 'G4']]))).toEqual(['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4', 'E4']);
  });

  it('har lige lange spor med gyldige toner i hver sang', () => {
    for (const [navn, sang] of Object.entries(SANGE)) {
      const laengder = sang.spor.map((s) => trinISpor(s.noder).length);
      expect(new Set(laengder).size, `${navn}: ${laengder.join(', ')}`).toBe(1);
      expect(laengder[0] % 8, `${navn}: hele takter`).toBe(0);
      for (const s of sang.spor) expect(() => laesSpor(s.noder), navn).not.toThrow();
      expect(sang.bpm).toBeGreaterThan(40);
    }
  });

  it('har en sang til hvert sted i kapitlerne', () => {
    for (const k of kapitler) for (const sted of Object.values(k.steder)) expect(SANGE[sted.tema], sted.tema).toBeTruthy();
  });
});
