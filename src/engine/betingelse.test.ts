import { describe, expect, it } from 'vitest';
import { ALLE_SKAAR, KLATTEN_VEN, opfyldt, SAND_SLUTNING, udvaelg } from './betingelse';

const spil = (valg: Record<string, string> = {}, venlighed = 0) => ({ valg, venlighed });

describe('betingelser på replikker', () => {
  it('uden betingelse vises replikken altid', () => {
    expect(opfyldt(undefined, spil())).toBe(true);
  });
  it('valg og ikkeValg', () => {
    expect(opfyldt({ valg: 'klatten.hjulpet' }, spil({ 'klatten.hjulpet': 'ja' }))).toBe(true);
    expect(opfyldt({ valg: 'klatten.hjulpet' }, spil())).toBe(false);
    expect(opfyldt({ ikkeValg: 'klatten.hjulpet' }, spil())).toBe(true);
    expect(opfyldt({ ikkeValg: 'klatten.hjulpet' }, spil({ 'klatten.hjulpet': 'ja' }))).toBe(false);
  });
  it('venlighed', () => {
    expect(opfyldt(KLATTEN_VEN, spil({}, 0))).toBe(false);
    expect(opfyldt(KLATTEN_VEN, spil({}, 1))).toBe(true);
    expect(opfyldt({ venlighedUnder: 1 }, spil({}, 0))).toBe(true);
    expect(opfyldt({ venlighedUnder: 1 }, spil({}, 2))).toBe(false);
  });
  it('udvaelg beholder rækkefølgen', () => {
    const r = [{ tekst: 'a' }, { tekst: 'b', hvis: { valg: 'x' } }, { tekst: 'c', hvis: { ikkeValg: 'x' } }];
    expect(udvaelg(r, spil()).map((x) => x.tekst)).toEqual(['a', 'c']);
    expect(udvaelg(r, spil({ x: 'ja' })).map((x) => x.tekst)).toEqual(['a', 'b']);
  });
  it('den sande slutning kræver alle skår og venlighed', () => {
    expect(opfyldt(SAND_SLUTNING, { valg: {}, venlighed: 1, skaar: ALLE_SKAAR })).toBe(true);
    expect(opfyldt(SAND_SLUTNING, { valg: {}, venlighed: 0, skaar: ALLE_SKAAR })).toBe(false);
    expect(opfyldt(SAND_SLUTNING, { valg: {}, venlighed: 3, skaar: ALLE_SKAAR.slice(1) })).toBe(false);
    expect(opfyldt({ alleSkaar: false }, { valg: {}, venlighed: 3, skaar: [] })).toBe(true);
    expect(opfyldt({ ikke: SAND_SLUTNING }, { valg: {}, venlighed: 0, skaar: ALLE_SKAAR })).toBe(true);
    expect(opfyldt({ ikke: SAND_SLUTNING }, { valg: {}, venlighed: 1, skaar: ALLE_SKAAR })).toBe(false);
  });
});
