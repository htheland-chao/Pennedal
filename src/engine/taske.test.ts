import { describe, expect, it } from 'vitest';
import { harTekst, kapitler, type Kapitel } from '../content';
import { TING_IKONER } from '../game/pixel/ting';
import { nytSpil, STANDARD_AVATAR } from './gem';
import { erTing, minderFor, nyeTing, taskeFor, TING } from './taske';
import { erMinde, MINDE_INFO, MINDER, mindeTekster } from '../content/minder';

const spil = (kapitel: number, trin: number) => ({ ...nytSpil(STANDARD_AVATAR, { adjektiv: 0, dyr: 0 }), kapitel, trin });
const trinNr = (k: number, id: string) => kapitler.find((x) => x.kapitel === k)!.trin.findIndex((t) => t.id === id);

describe('tasken', () => {
  it('er tom i starten', () => {
    expect(taskeFor(spil(1, 0), kapitler)).toEqual([]);
  });

  it('får ting, når trinnet, der giver dem, er klaret', () => {
    const nr = trinNr(1, 'k1-holm-2');
    expect(taskeFor(spil(1, nr), kapitler)).toEqual([]);
    expect(taskeFor(spil(1, nr + 1), kapitler)).toEqual(['logbog']);
  });

  it('har tingene fra kapitel 1 med ind i kapitel 2, også fra en gammel gemmekode', () => {
    expect(taskeFor(spil(2, 0), kapitler)).toEqual(['logbog', 'kappe', 'lanterne']);
    const efterTagene = trinNr(2, 'k2-fanget') + 1;
    expect(taskeFor(spil(2, efterTagene), kapitler)).toContain('punktum');
  });

  it('fjerner en ting, når et trin bruger den', () => {
    const k: Kapitel = {
      ...kapitler[0],
      trin: [
        { ...kapitler[0].trin[0], giver: ['kappe'] },
        { ...kapitler[0].trin[1], bruger: ['kappe'] },
      ],
    };
    expect(taskeFor(spil(1, 1), [k])).toEqual(['kappe']);
    expect(taskeFor(spil(1, 2), [k])).toEqual([]);
  });

  it('finder nye ting mellem to tilstande', () => {
    expect(nyeTing(['logbog'], ['logbog', 'kappe'])).toEqual(['kappe']);
  });

  it('kender kun ting, der findes, og hver ting har navn, tekst og et ikon på 12 x 12', () => {
    for (const k of kapitler)
      for (const t of k.trin) for (const id of [...(t.giver ?? []), ...(t.bruger ?? [])]) expect(erTing(id), `${t.id}: ${id}`).toBe(true);
    for (const id of TING) {
      expect(harTekst(`ting.${id}.navn`), id).toBe(true);
      expect(harTekst(`ting.${id}.tekst`), id).toBe(true);
      const ikon = TING_IKONER[id];
      expect(ikon.raekker).toHaveLength(12);
      for (const r of ikon.raekker) {
        expect(r).toHaveLength(12);
        for (const c of r) if (c !== '.') expect(ikon.palet[c], `${id}: ${c}`).toBeTruthy();
      }
    }
  });
});

describe('minder (tilbageblik)', () => {
  const allerTrin = kapitler.flatMap((k) => k.trin);

  it('hvert minde i et kapitel findes i minder.ts, har tekst og kommer før en replik, der findes', () => {
    for (const t of allerTrin) {
      if (t.type !== 'dialog' || !t.tilbageblik) continue;
      expect(erMinde(t.tilbageblik.id), t.id).toBe(true);
      expect(t.tilbageblik.foer, t.id).toBeGreaterThanOrEqual(0);
      expect(t.tilbageblik.foer, t.id).toBeLessThan(t.replikker.length);
    }
    for (const id of MINDER) {
      expect(harTekst(`minde.${id}.titel`), id).toBe(true);
      for (let nr = 1; nr <= MINDE_INFO[id].dele; nr++) expect(harTekst(`minde.${id}.${nr}`), `${id}.${nr}`).toBe(true);
      for (const nr of MINDE_INFO[id].mild) expect(harTekst(`minde.${id}.${nr}.mild`), `${id}.${nr}.mild`).toBe(true);
      expect(allerTrin.some((t) => t.type === 'dialog' && t.tilbageblik?.id === id), `${id} bruges i et kapitel`).toBe(true);
    }
  });

  it('minder låses op, når eleven er forbi trinnet, også hvis mindet blev sprunget over', () => {
    expect(minderFor({ kapitel: 1, trin: 0 }, kapitler)).toEqual([]);
    const k1 = kapitler.find((k) => k.kapitel === 1)!;
    const nr = k1.trin.findIndex((t) => t.id === 'k1-aeseloere');
    expect(minderFor({ kapitel: 1, trin: nr }, kapitler)).toEqual([]);
    expect(minderFor({ kapitel: 1, trin: nr + 1 }, kapitler)).toEqual(['blaek']);
    expect(minderFor({ kapitel: 3, trin: 0 }, kapitler)).toEqual(['blaek', 'streger']);
  });

  it('"Mindre uhygge" bytter grinet ud med en dør, der lukkes', () => {
    expect(mindeTekster('streger', false).join(' ')).toMatch(/griner/);
    expect(mindeTekster('streger', true).join(' ')).not.toMatch(/griner/);
    expect(mindeTekster('streger', true).join(' ')).toMatch(/dør/);
  });
});
