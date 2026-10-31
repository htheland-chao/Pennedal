import { describe, expect, it } from 'vitest';
import data from '../content/ord/raaber.json';
import { erIndirekte, lavRaaberOpgave, medTegn, tjekRaaber, type RaaberSaetning } from './raaber';

const saetninger = data.saetninger as RaaberSaetning[];

describe('Råberens tegn', () => {
  it('har sætninger på alle niveauer med gyldige tegn og uden tegn til sidst', () => {
    for (let n = 1; n <= 5; n++) expect(saetninger.some((s) => s.niveau === n), `niveau ${n}`).toBe(true);
    for (const s of saetninger) {
      expect(['.', '?', '!']).toContain(s.tegn);
      expect(s.tekst, s.id).not.toMatch(/[.?!]$/);
      expect(s.tekst[0], s.id).toBe(s.tekst[0].toLocaleUpperCase('da-DK'));
    }
    expect(new Set(saetninger.map((s) => s.id)).size).toBe(saetninger.length);
  });

  it('vælger på niveau og undgår brugte sætninger', () => {
    const brugt = saetninger.filter((s) => s.niveau === 1).slice(0, 5).map((s) => s.id);
    for (let i = 0; i < 20; i++) {
      const s = lavRaaberOpgave(saetninger, 1, Math.random, brugt);
      expect(s.niveau).toBe(1);
      expect(brugt).not.toContain(s.id);
    }
  });

  it('tjekker svaret og kender de indirekte spørgsmål', () => {
    const s = saetninger.find((x) => x.tekst.startsWith('Borgmesteren spørger'))!;
    expect(tjekRaaber(s, '.')).toBe(true);
    expect(tjekRaaber(s, '?')).toBe(false);
    expect(erIndirekte(s)).toBe(true);
    expect(medTegn(s, '.')).toBe('Borgmesteren spørger, om nogen har set tyven.');
    expect(erIndirekte(saetninger.find((x) => x.tegn === '?')!)).toBe(false);
  });
});
