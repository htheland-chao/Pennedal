import { describe, expect, it } from 'vitest';
import { delTekst, findOrdkort, harTekst, hentKapitel, renTekst, type Trin } from '../content';
import { afslutTrin, aktueltSted, kapitelSlut, spilVed } from './kapitel';
import { nytSpil, STANDARD_AVATAR } from './gem';
import { erFaerdighed, OPLAASNINGER } from './faerdigheder';

const k1 = hentKapitel(1)!;

describe('kapitel 1', () => {
  it('kan hoppe direkte til et sted eller et trin', () => {
    const start = nytSpil(STANDARD_AVATAR, { adjektiv: 0, dyr: 0 });
    const kaelder = spilVed(k1, 'kaelder', start)!;
    expect(aktueltSted(kaelder, k1)).toBe('kaelder');
    expect(k1.trin[kaelder.trin].id).toBe('k1-kaelder');
    const fyr = spilVed(k1, 'fyrtaarn', start)!;
    expect(aktueltSted(fyr, k1)).toBe('fyrtaarn');
    expect(fyr.laasteOp).toContain('toej.kappe');
    expect(spilVed(k1, 'findes-ikke', start)).toBeNull();
    for (const id of Object.keys(k1.steder)) expect(spilVed(k1, id, start), id).not.toBeNull();
  });

  it('kan spilles fra start til slut', () => {
    let spil = nytSpil(STANDARD_AVATAR, { adjektiv: 0, dyr: 0 });
    let skridt = 0;
    while (!kapitelSlut(spil, k1) && skridt < 100) {
      spil = afslutTrin(spil, k1);
      skridt++;
    }
    expect(skridt).toBe(k1.trin.length);
    expect(spil.laasteOp).toEqual(['toej.kappe', 'tilbehoer.lanterne']);
    expect(aktueltSted(spil, k1)).toBe('fyrtaarn');
  });

  it('henviser kun til steder, objekter, færdigheder og ordkort, der findes', () => {
    k1.trin.forEach((t: Trin) => {
      const sted = k1.steder[t.sted];
      expect(sted, `${t.id}: sted`).toBeTruthy();
      if (t.objekt) expect(sted.objekter.some((o) => o.id === t.objekt), `${t.id}: objekt`).toBe(true);
      if (t.tilSted) expect(k1.steder[t.tilSted], `${t.id}: tilSted`).toBeTruthy();
      if (t.objekt) expect(t.opgavetekst, `${t.id}: opgavetekst`).toBeTruthy();
      if (t.type === 'opgave' || t.type === 'bevisjagt') expect(erFaerdighed(t.faerdighed), t.id).toBe(true);
      for (const id of t.laaserOp ?? []) expect((OPLAASNINGER as readonly string[]).includes(id), id).toBe(true);
      const tekster: string[] = [];
      if (t.type === 'dialog') tekster.push(...t.replikker.map((r) => r.tekst));
      if (t.type === 'bevisjagt') {
        tekster.push(...t.saetninger);
        for (const id of t.forforstaaelse) expect(findOrdkort(id), id).toBeTruthy();
        for (const s of t.spoergsmaal) expect(s.svar).toBeLessThan(t.saetninger.length);
      }
      for (const tekst of tekster)
        for (const s of delTekst(tekst)) if (s.type === 'ord') expect(findOrdkort(s.id), s.id).toBeTruthy();
      if (t.type === 'dialog') for (const r of t.replikker) expect(harTekst(`taler.${r.taler}`), r.taler).toBe(true);
    });
  });

  it('deler ordkort-markering rigtigt', () => {
    expect(delTekst('Døren stod {{på klem|paa-klem}}.')).toEqual([
      { type: 'tekst', tekst: 'Døren stod ' },
      { type: 'ord', tekst: 'på klem', id: 'paa-klem' },
      { type: 'tekst', tekst: '.' },
    ]);
    expect(renTekst('Min {{logbog}} ligger her.')).toBe('Min logbog ligger her.');
  });
});
