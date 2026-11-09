import { describe, expect, it } from 'vitest';
import { hentKapitel } from '../content';
import { bladFundet, medSkaar, missionFor, missionStartet, missionStatus, skjulteBlade } from './frivillig';

describe('sidemission i kapitel 3', () => {
  const k = hentKapitel(3)!;
  const { id, mission } = missionFor(k, 'halvfugl')!;
  const tom = { valg: {} as Record<string, string>, skaar: [] as string[] };

  it('går fra ny over samler og klar til færdig', () => {
    expect(missionStatus(tom, id, mission)).toBe('ny');
    const startet = { ...tom, valg: { [missionStartet(id)]: 'ja' } };
    expect(missionStatus(startet, id, mission)).toBe('samler');
    const alle = { ...startet, valg: { ...startet.valg, ...Object.fromEntries(mission.blade.map((b) => [bladFundet(b), 'ja'])) } };
    expect(missionStatus(alle, id, mission)).toBe('klar');
    expect(missionStatus(medSkaar(alle, mission.skaar), id, mission)).toBe('faerdig');
  });

  it('viser kun bladene, mens man samler, og kun dem, der ikke er fundet', () => {
    expect(skjulteBlade(tom, k)).toEqual(mission.blade);
    const et = { skaar: [], valg: { [missionStartet(id)]: 'ja', [bladFundet(mission.blade[0])]: 'ja' } };
    expect(skjulteBlade(et, k)).toEqual([mission.blade[0]]);
  });

  it('gemmer skår i den faste rækkefølge og kun én gang', () => {
    const s = medSkaar(medSkaar({ skaar: ['k3b'] }, 'k3a'), 'k3a');
    expect(s.skaar).toEqual(['k3a', 'k3b']);
  });
});
