import { describe, expect, it } from 'vitest';
import {
  erBedre,
  gaverFor,
  laesKode,
  laesRekordkode,
  minNiveau,
  lavKode,
  nyTur,
  rekordkode,
  rumFor,
  rumKlaret,
  START_BLAEK,
  svar,
  VAESEN_INFO,
  vaelgGave,
} from './dybet';
import { erFaerdighed } from './faerdigheder';

describe('Blækdybet', () => {
  it('samme kode giver præcis samme rum og gaver (alle i klassen spiller samme tur)', () => {
    for (let d = 0; d < 30; d++) {
      expect(rumFor(4821, d)).toEqual(rumFor(4821, d));
      expect(gaverFor(4821, d)).toEqual(gaverFor(4821, d));
    }
    const a = Array.from({ length: 20 }, (_, d) => JSON.stringify(rumFor(4821, d)));
    const b = Array.from({ length: 20 }, (_, d) => JSON.stringify(rumFor(1234, d)));
    expect(a).not.toEqual(b);
  });

  it('første rum er en blid ordsten, og hvilestederne bliver sjældnere i dybet', () => {
    for (const froe of [1000, 4821, 9999]) {
      expect(rumFor(froe, 0).type).toBe('ordsten');
      for (const d of [4, 9, 14, 23, 31]) expect(rumFor(froe, d).type).toBe('hvile');
      for (const d of [19, 24, 29]) expect(rumFor(froe, d).type).not.toBe('hvile');
    }
  });

  it('sværheden stiger med dybden, uanset elevens niveau, og topper på 5', () => {
    expect([0, 2, 3, 6, 9, 12, 30].map(minNiveau)).toEqual([1, 1, 2, 3, 4, 5, 5]);
    for (let d = 1; d < 40; d++) {
      const r = rumFor(4821, d);
      if (r.type !== 'hvile') expect(r.minNiveau).toBe(minNiveau(d));
    }
  });

  it('kampene bliver større jo dybere, og slagene passer til væsnerne', () => {
    for (let froe = 1000; froe < 1200; froe++)
      for (let d = 1; d < 25; d++) {
        const r = rumFor(froe, d);
        if (r.type !== 'kamp') continue;
        expect(r.vaesner.length).toBe(d >= 8 ? 3 : d >= 3 ? 2 : 1);
        for (const v of r.vaesner) for (const s of VAESEN_INFO[v].slag) expect(r.slag).toContain(s);
        expect(erFaerdighed(r.faerdighed)).toBe(true);
      }
  });

  it('platformbaner kommer fra rum 2 og er steder med en bane i spillet', async () => {
    const { kapitler } = await import('../content');
    const steder = Object.fromEntries(kapitler.flatMap((k) => Object.entries(k.steder)));
    let antal = 0;
    for (let froe = 1000; froe < 1300; froe++)
      for (let d = 0; d < 20; d++) {
        const r = rumFor(froe, d);
        if (r.type !== 'bane') continue;
        antal++;
        expect(d).toBeGreaterThanOrEqual(2);
        expect(steder[r.sted]?.bane, r.sted).toBeTruthy();
      }
    expect(antal).toBeGreaterThan(300);
  });

  it('gaverne er altid tre forskellige', () => {
    for (let d = 0; d < 50; d++) expect(new Set(gaverFor(4821, d)).size).toBe(3);
  });

  it('udfordringskoder tåler små bogstaver og mellemrum', () => {
    expect(lavKode(4821)).toBe('DYB-4821');
    for (const k of ['DYB-4821', 'dyb-4821', ' dyb 4821 ', '4821', 'DYB4821']) expect(laesKode(k)).toBe(4821);
    for (const k of ['DYB-48', 'ABC-4821', '48211', '']) expect(laesKode(k)).toBeNull();
  });

  it('forkerte svar koster blæk, og turen slutter, når blækket er brugt', () => {
    let tur = nyTur(4821);
    expect(tur.blaek).toBe(START_BLAEK);
    tur = svar(tur, true);
    tur = svar(tur, true);
    expect(tur.stribe).toBe(2);
    tur = svar(tur, false);
    expect(tur.blaek).toBe(START_BLAEK - 1);
    expect(tur.stribe).toBe(0);
    expect(tur.bedsteStribe).toBe(2);
    tur = svar(svar(tur, false), false);
    expect(tur.slut).toBe(true);
    // Efter slut sker der ikke mere.
    expect(svar(tur, true)).toBe(tur);
  });

  it('gaverne virker: blæk, beholder, skjold og stribe', () => {
    let tur = vaelgGave(nyTur(1), 'beholder');
    expect(tur.maksBlaek).toBe(6);
    expect(tur.blaek).toBe(4);
    tur = vaelgGave({ ...tur, blaek: 5 }, 'blaek');
    expect(tur.blaek).toBe(6);

    // Skjold: det første forkerte svar i hvert rum er gratis.
    let s = vaelgGave(nyTur(1), 'skjold');
    s = svar(s, false);
    expect(s.blaek).toBe(START_BLAEK);
    s = svar(s, false);
    expect(s.blaek).toBe(START_BLAEK - 1);
    s = rumKlaret(s, { type: 'ordsten', art: 'synonym', antal: 2, minNiveau: 1 });
    expect(svar(s, false).blaek).toBe(START_BLAEK - 1);

    // Stribe: alt rigtigt i et rum giver en dråbe tilbage.
    let r = vaelgGave({ ...nyTur(1), blaek: 2 }, 'stribe');
    r = rumKlaret(svar(svar(r, true), true), { type: 'ordsten', art: 'synonym', antal: 2, minNiveau: 1 });
    expect(r.blaek).toBe(3);
    expect(r.dybde).toBe(1);
  });

  it('et hvilested giver en dråbe, men aldrig over beholderen', () => {
    const tur = rumKlaret({ ...nyTur(1), blaek: 2 }, { type: 'hvile' });
    expect(tur.blaek).toBe(3);
    expect(rumKlaret(nyTur(1), { type: 'hvile' }).blaek).toBeLessThanOrEqual(nyTur(1).maksBlaek);
  });

  it('rekorden måler dybde og rigtige, aldrig tid', () => {
    expect(erBedre({ froe: 1, dybde: 5, rigtige: 10 }, { froe: 1, dybde: 4, rigtige: 30 })).toBe(true);
    expect(erBedre({ froe: 1, dybde: 5, rigtige: 10 }, { froe: 1, dybde: 5, rigtige: 12 })).toBe(false);
    expect(erBedre({ froe: 1, dybde: 1, rigtige: 1 }, null)).toBe(true);
  });

  it('rekordkoden kan læses igen, og en rettet rekord afsløres', () => {
    const kode = rekordkode({ froe: 4821, dybde: 7, rigtige: 23 });
    expect(kode).toMatch(/^DYB-4821\/7\/23\/[A-Z]{2}$/);
    expect(laesRekordkode(kode)).toEqual({ froe: 4821, dybde: 7, rigtige: 23 });
    expect(laesRekordkode(kode.toLowerCase())).toEqual({ froe: 4821, dybde: 7, rigtige: 23 });
    expect(laesRekordkode(kode.replace('/7/', '/9/'))).toBeNull();
    expect(laesRekordkode('noget andet')).toBeNull();
  });
});
