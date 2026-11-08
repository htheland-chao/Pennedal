import { describe, expect, it } from 'vitest';
import { automatiskStort, facit, klip, klippetFaerdig, parseOgTekst, stykker, tjekOgorm, tomOgTilstand, visTekst } from './ogorm';

const tokens = parseOgTekst('Vi spiste brød og{b} smør og{s} så gik Klatten{n} hjem og{s} han sov.');

describe('klip ormen i stykker', () => {
  it('klipper ved et og mellem to sætninger og giver det næste ord stort begyndelsesbogstav af sig selv', () => {
    const r = klip(tokens, tomOgTilstand(), 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.stort).toBe(6);
    expect(visTekst(tokens, r.tilstand)).toBe('Vi spiste brød og smør. Så gik Klatten hjem og han sov.');
  });

  it('kan ikke klippe et og, der binder to ting sammen', () => {
    expect(klip(tokens, tomOgTilstand(), 3)).toEqual({ ok: false, fejl: 'bliv' });
  });

  it('er færdig og rigtig, når alle de rigtige steder er klippet', () => {
    let s = tomOgTilstand();
    for (const i of [5, 10]) {
      const r = klip(tokens, s, i);
      if (r.ok) s = r.tilstand;
    }
    expect(klippetFaerdig(tokens, s)).toBe(true);
    expect(tjekOgorm(tokens, s)).toEqual({ ok: true });
    expect(visTekst(tokens, s)).toBe(facit(tokens));
    expect(stykker(tokens, s)).toHaveLength(3);
  });

  it('ændrer aldrig navne eller første ord', () => {
    expect(automatiskStort(tokens, [5, 10])).not.toContain(0);
    expect(automatiskStort(tokens, [5, 10])).not.toContain(8);
  });
});
