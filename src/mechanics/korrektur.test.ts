import { describe, expect, it } from 'vitest';
import data from '../content/ord/korrektur.json';
import { FEJL_TYPER, lavKrusedulleOpgave, muligheder, ordI, saetningMed, somTekst, stykker, vaelgTekst, type FejlType, type KorrekturTekst } from './korrektur';

const tekster = data.tekster as KorrekturTekst[];
const rnd = () => 0.3;
const alle = (n: number) => Object.fromEntries(FEJL_TYPER.map((x) => [x, n])) as Record<FejlType, number>;

describe('Klattens tekster', () => {
  it('hver tekst har pladser til alle fejl, og fejlene er forskellige stavemåder', () => {
    for (const t of tekster) {
      t.fejl.forEach((f, i) => {
        expect(t.tekst, t.id).toContain(`{${i}}`);
        expect(new Set([f.rigtig, f.skrevet, f.ekstra]).size, t.id).toBe(3);
      });
      expect(t.fejl.length, t.id).toBeGreaterThanOrEqual(2);
    }
  });
  it('alle fire slags fejl findes og har en regel og et eksempel', () => {
    for (const x of FEJL_TYPER) {
      expect(tekster.filter((t) => t.fejl.some((f) => f.type === x)).length, x).toBeGreaterThanOrEqual(4);
      expect(data.regler[x]).toBeTruthy();
      expect(data.eksempler[x]).toBeTruthy();
    }
  });
  it('stykker og somTekst', () => {
    const t = tekster.find((x) => x.id === 'k03')!;
    expect(stykker(t).filter((s) => s.slags === 'fejl')).toHaveLength(2);
    expect(somTekst(t)).toBe('Vor er min kappe? Jeg kan ikke sel finde den.');
    expect(somTekst(t, [0])).toBe('Hvor er min kappe? Jeg kan ikke sel finde den.');
    expect(somTekst(t, 'alle')).toBe('Hvor er min kappe? Jeg kan ikke selv finde den.');
    expect(ordI(' er min kappe? ')).toEqual([' ', 'er', ' ', 'min', ' ', 'kappe?', ' ']);
  });
  it('muligheder har den rigtige og to forkerte', () => {
    const f = tekster[0].fejl[0];
    expect(muligheder(f, rnd).sort()).toEqual([f.rigtig, f.skrevet, f.ekstra].sort());
  });
  it('den svageste færdighed styrer valget', () => {
    const niveau = { ...alle(4), datid: 1 };
    for (let i = 0; i < 20; i++) {
      const t = vaelgTekst(tekster, niveau, Math.random);
      expect(t.svaerhed).toBe(1);
      expect(t.fejl.some((f) => f.type === 'datid')).toBe(true);
    }
    expect(vaelgTekst(tekster, alle(5), rnd).svaerhed).toBe(3);
  });
  it('brugte tekster kommer ikke igen, før alle er brugt', () => {
    const brugt = tekster.filter((t) => t.svaerhed === 1 && t.id !== 'k14').map((t) => t.id);
    expect(vaelgTekst(tekster, alle(1), rnd, brugt).id).toBe('k14');
  });
  it('kampen viser fejlen i sin egen sætning, med de andre fejl rettet', () => {
    const t = tekster.find((x) => x.id === 'k07')!;
    expect(saetningMed(t, 1)).toEqual({ foer: 'Om sommeren ', efter: ' jeg i den hver dag.' });
    expect(saetningMed(t, 0)).toEqual({ foer: 'Søen er sort og ', efter: '.' });
    const o = lavKrusedulleOpgave(tekster, 5, rnd, []);
    expect(o.muligheder).toContain(o.svar);
    expect(o.saetning).toContain(o.svar);
    expect(o.faerdighed).toMatch(/^stav\./);
  });
});
