import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { afspil, billedtid, enkle } from './afspiller';
import { tjekFilm } from './tjek';
import type { Arbejder, EnkelHandling, Handling } from './typer';

/** En arbejder, der skriver alt ned. Hver handling varer så mange ms, som står i ms (eller 100). */
function logArbejder() {
  const log: string[] = [];
  const navn = (h: EnkelHandling) => (h.type === 'figur' ? `figur:${h.id}` : h.type === 'lyd' ? `lyd:${h.effekt}` : h.type);
  const a: Arbejder = {
    start: () => log.push('start'),
    udfoer: (h) => {
      log.push(`+${navn(h)}`);
      const ms = 'ms' in h && typeof h.ms === 'number' ? h.ms : 100;
      return new Promise((r) =>
        setTimeout(() => {
          log.push(`-${navn(h)}`);
          r();
        }, ms),
      );
    },
    slut: (h) => log.push(`slut:${navn(h)}`),
    oprydning: () => log.push('oprydning'),
  };
  return { a, log };
}

const SEKVENS: Handling[] = [
  { type: 'bjaelker', til: true },
  {
    type: 'samtidig',
    handlinger: [
      { type: 'kamera', til: { felt: [3, 4] }, ms: 300 },
      { type: 'figur', id: 'aeseloere', toner: 'frem' },
    ],
  },
  { type: 'vent', ms: 200 },
  { type: 'lyd', effekt: 'knap' },
  { type: 'bjaelker', til: false },
];

describe('afspilleren til filmsekvenser', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('kører handlingerne i rækkefølge, de samtidige på én gang, og rydder op til sidst', async () => {
    const { a, log } = logArbejder();
    const f = afspil(SEKVENS, a);
    await vi.runAllTimersAsync();
    await f.faerdig;
    expect(log).toEqual([
      'start',
      '+bjaelker',
      '-bjaelker',
      '+kamera',
      '+figur:aeseloere',
      '-figur:aeseloere',
      '-kamera',
      '+lyd:knap',
      '-lyd:knap',
      '+bjaelker',
      '-bjaelker',
      'oprydning',
    ]);
  });

  it('samtidige handlinger venter på den længste', async () => {
    const { a, log } = logArbejder();
    afspil(SEKVENS, a);
    await vi.advanceTimersByTimeAsync(100 + 150);
    expect(log).toContain('-figur:aeseloere');
    expect(log).not.toContain('-kamera');
    expect(log).not.toContain('+lyd:knap');
  });

  it('"Spring over" midt i giver samme sluttilstand: det, der ikke er færdigt, sættes til sin slutning i rækkefølge', async () => {
    for (const efter of [0, 50, 150, 450, 650, 750]) {
      const { a, log } = logArbejder();
      const f = afspil(SEKVENS, a);
      await vi.advanceTimersByTimeAsync(efter);
      f.springOver();
      await f.faerdig;
      // Alt, der blev startet eller sluttet, giver tilsammen hver handling præcis én gang som færdig.
      const faerdige = log.filter((l) => l.startsWith('-') || l.startsWith('slut:')).map((l) => l.replace(/^-|^slut:/, ''));
      expect(faerdige.filter((x) => x === 'bjaelker').length, `efter ${efter} ms`).toBe(2);
      expect(faerdige).toContain('kamera');
      expect(faerdige).toContain('figur:aeseloere');
      expect(faerdige).toContain('lyd:knap');
      expect(log.at(-1)).toBe('oprydning');
      expect(f.sprungetOver()).toBe(true);
    }
  });

  it('efter "Spring over" startes intet nyt, og oprydningen sker kun én gang', async () => {
    const { a, log } = logArbejder();
    const f = afspil(SEKVENS, a);
    await vi.advanceTimersByTimeAsync(10);
    f.springOver();
    f.springOver();
    await f.faerdig;
    await vi.runAllTimersAsync();
    expect(log.filter((l) => l === 'oprydning')).toHaveLength(1);
    expect(log.filter((l) => l.startsWith('+'))).toEqual(['+bjaelker']);
  });

  it('oprydningen sker også, når en handling fejler', async () => {
    const log: string[] = [];
    const a: Arbejder = {
      start: () => log.push('start'),
      udfoer: () => Promise.reject(new Error('figuren findes ikke')),
      slut: () => undefined,
      oprydning: () => log.push('oprydning'),
    };
    await expect(afspil([{ type: 'blink' }], a).faerdig).rejects.toThrow('figuren findes ikke');
    expect(log).toEqual(['start', 'oprydning']);
  });

  it('enkle og billedtid', () => {
    expect(enkle(SEKVENS).map((h) => h.type)).toEqual(['bjaelker', 'kamera', 'figur', 'lyd', 'bjaelker']);
    expect(billedtid(SEKVENS)).toBe(300 + 200);
  });
});

describe('tjek af en filmsekvens', () => {
  const kendte = { figurer: new Set(['aeseloere']), temaer: new Set(['pennedal']), effekter: new Set(['knap']) };

  it('en god sekvens har ingen fejl', () => {
    expect(tjekFilm(SEKVENS, kendte)).toEqual([]);
  });

  it('fanger ukendte navne, halve zoomtrin, for lange billeder og to dialoger på én gang', () => {
    const fejl = tjekFilm(
      [
        { type: 'figur', id: 'aeseloer', toner: 'frem' },
        { type: 'kamera', til: { figur: 'spiller' }, zoom: 1.5 },
        { type: 'musik', tema: 'diskotek' },
        { type: 'lyd', effekt: 'bang' },
        { type: 'vent', ms: 9000 },
        ...Array.from({ length: 6 }, () => ({ type: 'vent', ms: 6000 }) as Handling),
        {
          type: 'samtidig',
          handlinger: [
            { type: 'replikker', replikker: [{ taler: 'aeseloere', tekst: 'Hej.' }] },
            { type: 'replikker', replikker: [{ taler: 'aeseloere', tekst: 'Hej igen.' }] },
          ],
        },
      ],
      kendte,
    );
    expect(fejl).toEqual(
      expect.arrayContaining([
        'ukendt figur: aeseloer',
        'zoom skal være et helt trin (1 eller 2), ikke 1.5',
        'ukendt musik: diskotek',
        'ukendt lyd: bang',
        'vent: 9000 ms er uden for 0-6000',
        'to dialoger på én gang',
      ]),
    );
    expect(fejl.some((f) => f.startsWith('billederne varer'))).toBe(true);
  });

  it('en replik må ikke have fast tid', () => {
    const r = { taler: 'aeseloere', tekst: 'Hej.', ms: 2000 } as unknown as { taler: 'aeseloere'; tekst: string };
    expect(tjekFilm([{ type: 'replikker', replikker: [r] }], kendte)).toContain('en replik må ikke have fast tid (krav 5)');
  });
});
