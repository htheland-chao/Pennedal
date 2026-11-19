import { describe, expect, it } from 'vitest';
import { grupper } from './samling';
import { tegnkortInfo } from './tjek';

describe('pixelgrafik', () => {
  const alle = grupper();

  it('har en hel palet til alle figurer', () => {
    for (const g of alle)
      for (const e of g.elementer) expect(tegnkortInfo(e.kort).mangler, `${g.id}: ${e.navn}`).toEqual([]);
  });

  it('bruger kun farver fra masterpaletten', () => {
    const fejl: string[] = [];
    for (const g of alle)
      for (const e of g.elementer) {
        const ude = tegnkortInfo(e.kort).udenforPalet;
        if (ude.length) fejl.push(`${g.id}: ${e.navn}: ${ude.join(' ')}`);
      }
    expect(fejl, 'Brug en farve fra src/game/pixel/palet.ts (naermesteFarve finder den nærmeste)').toEqual([]);
  });

  it('har den forventede størrelse', () => {
    for (const g of alle) {
      if (!g.forventet && !g.ensStoerrelse) continue;
      const foerste = tegnkortInfo(g.elementer[0].kort);
      const maal = g.forventet ?? { b: foerste.b, h: foerste.h };
      for (const e of g.elementer) {
        const i = tegnkortInfo(e.kort);
        expect({ b: i.b, h: i.h }, `${g.id}: ${e.navn}`).toEqual(maal);
      }
    }
  });

  it('har ens rækkebredde i alle portrætter og ikoner', () => {
    for (const g of alle.filter((x) => x.forventet))
      for (const e of g.elementer) expect(tegnkortInfo(e.kort).uens, `${g.id}: ${e.navn}`).toBe(false);
  });
});
