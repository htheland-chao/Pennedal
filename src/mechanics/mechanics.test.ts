import { describe, expect, it } from 'vitest';
import { historiebro, ogorm, stumme } from '../content';
import { lavTilfaeldig } from '../engine/tilfaeldig';
import { lavHviskeOpgave, tjekHviske, visHviske } from './hviske';
import { antalLed, facit, parseOgTekst, tjekOgorm, tomOgTilstand, visTekst } from './ogorm';
import { lavBro, tjekBro } from './historiebro';

describe('Hviskeformularer', () => {
  it('har et stumt bogstav på den angivne plads i hvert ord', () => {
    for (const o of stumme.ord) {
      const b = o.ord[o.stumt];
      expect(b, o.ord).toBe(o.type);
      expect(o.saetning.toLowerCase(), o.ord).toMatch(new RegExp(`(^|[^a-zæøå])${o.ord}([^a-zæøå]|$)`));
    }
  });

  it('laver vælg-opgaver med det rigtige bogstav blandt valgene', () => {
    const tal = lavTilfaeldig(1);
    for (let i = 0; i < 50; i++) {
      const o = lavHviskeOpgave(stumme.ord, 1, tal);
      expect(o.valg).toHaveLength(3);
      expect(new Set(o.valg).size).toBe(3);
      expect(o.valg).toContain(o.ord.ord[o.ord.stumt]);
      expect(o.ord.svaerhed).toBe(1);
      expect(visHviske(o).filter((b) => b === null)).toHaveLength(1);
      expect(tjekHviske(o, [o.ord.ord[o.ord.stumt]])).toBe(true);
      expect(tjekHviske(o, ['x'])).toBe(false);
    }
  });

  it('laver opgaver med to huller på niveau 4 og hele ordet på niveau 5', () => {
    const tal = lavTilfaeldig(2);
    const fire = lavHviskeOpgave(stumme.ord, 4, tal);
    expect(fire.huller).toHaveLength(2);
    expect(fire.huller).toContain(fire.ord.stumt);
    expect(tjekHviske(fire, fire.huller.map((h) => fire.ord.ord[h].toUpperCase()))).toBe(true);
    const fem = lavHviskeOpgave(stumme.ord, 5, tal);
    expect(fem.form).toBe('helt');
    expect(tjekHviske(fem, [` ${fem.ord.ord} `])).toBe(true);
    expect(tjekHviske(fem, [fem.ord.ord.replace(fem.ord.ord[fem.ord.stumt], '')])).toBe(false);
  });

  it('undgår ord, der lige er brugt', () => {
    const tal = lavTilfaeldig(3);
    const brugt = stumme.ord.filter((o) => o.svaerhed === 1).slice(0, 10).map((o) => o.ord);
    const o = lavHviskeOpgave(stumme.ord, 1, tal, brugt);
    expect(brugt).not.toContain(o.ord.ord);
  });
});

describe('Og-ormen', () => {
  it('kan løses for alle tekster, og facit er pæn dansk tegnsætning', () => {
    for (const tekst of ogorm.tekster) {
      const tokens = parseOgTekst(tekst.tekst);
      const f = facit(tokens);
      expect(f, tekst.id).not.toMatch(/\{|\}/);
      expect(f, tekst.id).toMatch(/^[A-ZÆØÅ]/);
      expect(f, tekst.id).toMatch(/\.$/);
      expect(f, tekst.id).not.toMatch(/\.\s+[a-zæøå]/);
      expect(tokens.filter((t) => t.ogType === 's').length, tekst.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('giver de rigtige fejl', () => {
    const tokens = parseOgTekst('Æseløre{n} og{b} Klatten{n} skændtes og{s} ingen gav sig.');
    const t = tomOgTilstand();
    expect(tjekOgorm(tokens, t)).toEqual({ ok: false, fejl: 'mangler', indeks: 4 });
    expect(tjekOgorm(tokens, { ...t, punktummer: [1] })).toMatchObject({ fejl: 'bliv' });
    expect(tjekOgorm(tokens, { punktummer: [4], skiftet: [] })).toMatchObject({ fejl: 'stort', indeks: 5 });
    expect(tjekOgorm(tokens, { punktummer: [4], skiftet: [5, 6] })).toMatchObject({ fejl: 'lille', indeks: 6 });
    expect(tjekOgorm(tokens, { punktummer: [4], skiftet: [0, 5] })).toMatchObject({ fejl: 'navn', indeks: 0 });
    const ok = { punktummer: [4], skiftet: [5] };
    expect(tjekOgorm(tokens, ok)).toEqual({ ok: true });
    expect(visTekst(tokens, ok)).toBe('Æseløre og Klatten skændtes. Ingen gav sig.');
    expect(antalLed(tokens, ok)).toBe(1);
  });
});

describe('Historiebroen', () => {
  it('har seks planker og en fremmed planke i hver historie', () => {
    for (const h of historiebro.historier) {
      for (const t of historiebro.traek) expect(h.planker[t], `${h.id} ${t}`).toBeTruthy();
      expect(h.fremmed).toBeTruthy();
    }
  });

  it('laver broer, der passer til niveauet, og som ikke ligger rigtigt fra start', () => {
    const tal = lavTilfaeldig(7);
    const en = lavBro(historiebro.historier, 1, tal);
    expect(en.planker).toHaveLength(4);
    expect(en.visEtiketter).toBe(true);
    const fire = lavBro(historiebro.historier, 4, tal);
    expect(fire.planker).toHaveLength(7);
    expect(fire.medFremmed).toBe(true);
    expect(fire.visEtiketter).toBe(false);
    for (let i = 0; i < 30; i++) {
      const b = lavBro(historiebro.historier, 2, tal);
      expect(b.planker.map((p) => p.id)).not.toEqual(b.facit);
    }
  });

  it('tjekker rækkefølge og den fremmede planke', () => {
    const tal = lavTilfaeldig(9);
    const b = lavBro(historiebro.historier, 4, tal);
    expect(tjekBro(b, [...b.facit], ['fremmed'])).toEqual({ ok: true });
    expect(tjekBro(b, [...b.facit, 'fremmed'], [])).toEqual({ ok: false, fejl: 'fremmed' });
    expect(tjekBro(b, b.facit.slice(1), ['fremmed', 'problem'])).toMatchObject({ fejl: 'fjernet' });
    const byttet = [...b.facit];
    [byttet[2], byttet[3]] = [byttet[3], byttet[2]];
    expect(tjekBro(b, byttet, ['fremmed'])).toEqual({ ok: false, fejl: 'placering', nr: 3, traek: b.facit[2] });
  });
});
