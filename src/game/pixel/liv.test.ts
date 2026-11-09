import { describe, expect, it } from 'vitest';
import { aande, gangRamme, hvileTilstand, lukOejne } from './liv';
import { KLATTEN, voksen } from './sprites';

describe('levende figurer', () => {
  it('lukker øjnene med øjenlåget, og det lukkede billede har samme størrelse', () => {
    const v = voksen('#c0503e');
    const l = lukOejne(v)!;
    expect(l.raekker.join('')).not.toContain('E');
    expect(l.raekker.map((r) => r.length)).toEqual(v.raekker.map((r) => r.length));
  });

  it('lukker Klattens store øjne med et omrids nederst', () => {
    const l = lukOejne(KLATTEN, ['O', 'o'])!;
    expect(l.raekker.join('')).not.toMatch(/[Oo]/);
    expect(l.raekker[8]).toContain('K');
  });

  it('giver null for en figur uden øjne', () => {
    expect(lukOejne({ raekker: ['KK', 'KK'], palet: { K: '#000000' } })).toBeNull();
  });

  it('vejrtrækning sænker overkroppen én pixel, men fødderne bliver stående', () => {
    const v = voksen('#c0503e');
    const a = aande(v);
    expect(a.raekker).toHaveLength(v.raekker.length);
    expect(a.raekker[0]).toMatch(/^\.+$/);
    expect(a.raekker.at(-1)).toBe(v.raekker.at(-1));
  });

  it('går i fire trin og blinker kun kort', () => {
    expect([0, 0.13, 0.26, 0.38].map((t) => gangRamme(t))).toEqual([1, 0, 2, 0]);
    let blink = 0;
    for (let i = 0; i < 1000; i++) if (hvileTilstand(i / 100, 0.3) === 'blink') blink++;
    expect(blink).toBeGreaterThan(0);
    expect(blink).toBeLessThan(60);
    expect(hvileTilstand(1, 0.3, true)).toBe('staa');
  });
});
