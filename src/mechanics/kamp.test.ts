import { describe, expect, it } from 'vitest';
import { harTekst, kapitler, stumme, synonymer } from '../content';
import { erFaerdighed } from '../engine/faerdigheder';
import { lavTilfaeldig } from '../engine/tilfaeldig';
import { antalTure, lavStummingOpgave, lavTomordOpgave, medHul, tjekKamp, viskUd } from './kamp';

describe('rolige kampe', () => {
  it('varer tre til fem ture efter niveau, aldrig flere', () => {
    expect(antalTure(3, 1)).toBe(3);
    expect(antalTure(3, 3)).toBe(4);
    expect(antalTure(3, 5)).toBe(5);
    expect(antalTure(5, 5)).toBe(5);
  });

  it('Tomordet: tre forskellige muligheder, præcis én er rigtig, og ordet står i sætningen', () => {
    const rnd = lavTilfaeldig(7);
    for (let niveau = 1; niveau <= 5; niveau++)
      for (let i = 0; i < 20; i++) {
        const o = lavTomordOpgave(synonymer.ord, niveau, rnd);
        expect(new Set(o.muligheder).size).toBe(3);
        expect(o.muligheder.filter((m) => tjekKamp(o, m))).toEqual([o.svar]);
        expect(`${o.foer}${o.vist}${o.efter}`).toBe(o.saetning);
      }
  });

  it('synonymlisten: ordet står i sætningen, og svaret er ikke også en forkert mulighed', () => {
    for (const o of synonymer.ord) {
      expect(o.saetning.toLowerCase(), o.id).toContain(o.ord.toLowerCase());
      expect(o.forkerte, o.id).not.toContain(o.svar);
      expect(o.forkerte.length, o.id).toBeGreaterThanOrEqual(2);
      expect([1, 2, 3], o.id).toContain(o.svaerhed);
    }
    expect(new Set(synonymer.ord.map((o) => o.id)).size).toBe(synonymer.ord.length);
  });

  it('Stummingen: hullet sidder, hvor det stumme bogstav var, og svaret er det bogstav', () => {
    const rnd = lavTilfaeldig(3);
    for (let i = 0; i < 60; i++) {
      const o = lavStummingOpgave(stumme.ord, 1 + (i % 5), rnd);
      const kilde = stumme.ord.find((x) => x.ord === o.ord.toLowerCase())!;
      expect(o.vist.toLowerCase()).toBe(medHul(kilde));
      expect(o.vist.replace('_', o.svar).toLowerCase()).toBe(o.ord.toLowerCase());
      expect(o.muligheder).toContain(o.svar);
      expect(`${o.foer}${o.ord}${o.efter}`).toBe(o.saetning);
    }
  });

  it('Vims visker kun forkerte muligheder ud og lader altid mindst to stå', () => {
    const rnd = lavTilfaeldig(1);
    const o = lavTomordOpgave(synonymer.ord, 1, rnd);
    const m = viskUd(o, [], rnd);
    expect(m).not.toBeNull();
    expect(m).not.toBe(o.svar);
    expect(viskUd(o, [m!], rnd)).toBeNull();
  });

  it('kampene i kapitlerne har et væsen med tekster og en færdighed, der findes', () => {
    const kampe = kapitler.flatMap((k) => k.trin).filter((t) => t.type === 'kamp');
    expect(kampe.length).toBeGreaterThan(0);
    for (const k of kampe) {
      if (k.type !== 'kamp') continue;
      expect(erFaerdighed(k.faerdighed), k.id).toBe(true);
      for (const del of ['navn', 'angreb', 'spoergsmaal', 'lyt', 'rigtig', 'fejl', 'rolig'])
        expect(harTekst(`kamp.${k.vaesen}.${del}`), `${k.id}: kamp.${k.vaesen}.${del}`).toBe(true);
    }
  });

  it('valg i dialoger: mindst to muligheder, og det, der gemmes, er et vigtigt valg', async () => {
    const { VIGTIGE_VALG } = await import('../engine/taske');
    const valg = kapitler.flatMap((k) => k.trin).flatMap((t) => (t.type === 'dialog' && t.valg ? [t.valg] : []));
    expect(valg.length).toBeGreaterThan(0);
    for (const v of valg) {
      expect(v.muligheder.length).toBeGreaterThanOrEqual(2);
      for (const m of v.muligheder) {
        expect(m.replikker.length).toBeGreaterThan(0);
        if (m.saet) expect(VIGTIGE_VALG as readonly string[]).toContain(m.saet);
      }
    }
  });
});
