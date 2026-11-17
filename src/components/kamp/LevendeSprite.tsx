import { useEffect, useMemo, useState, type ImgHTMLAttributes } from 'react';
import { finFigur } from '../../game/pixel/fin';
import { figurRammer, type FigurId } from '../../game/pixel/kampliv';
import { tegnkortTilLerred } from '../../game/pixel/lerred';
import type { Tegnkort } from '../../game/pixel/sprites';
import { spejl, uri } from './figurbilleder';
import { roligBevaegelse } from './tilgaengelighed';

/**
 * Liv i kampen (Henrik, 13.-14. november 2026): hver figur har sin egen bevægelse, der passer til den (Tomordet smasker,
 * Krusedullen bølger, Æseløre basker med vingen osv.). Billederne laves af figurens tegnkort i src/game/pixel/kampliv.ts.
 * Hver figur har sit eget ur, så kun dens billede tegnes om. Står stille under reduceret bevægelse, og når stille er sand.
 * Delt ud af KampVindue.tsx 17. november 2026.
 */
export function LevendeSprite({
  noegle,
  id,
  base,
  spejlet,
  retning,
  stille,
  fase,
  ...img
}: {
  noegle: string;
  id: FigurId;
  base: Tegnkort;
  spejlet: boolean;
  retning: 1 | -1;
  stille: boolean;
  fase: number;
} & ImgHTMLAttributes<HTMLImageElement>) {
  const { rammer, ms } = useMemo(() => figurRammer(id, base, (spejlet ? -retning : retning) as 1 | -1), [id, base, spejlet, retning]);
  const [nr, setNr] = useState(fase % rammer.length);
  useEffect(() => {
    if (stille || roligBevaegelse()) return;
    const ur = window.setInterval(() => setNr((x) => (x + 1) % rammer.length), ms);
    return () => window.clearInterval(ur);
  }, [stille, ms, rammer.length]);
  const r = stille ? 0 : nr % rammer.length;
  const src = uri(`${noegle}.liv${r}`, () => tegnkortTilLerred(finFigur(spejlet ? spejl(rammer[r]) : rammer[r])));
  return <img {...img} src={src} data-ramme={r} />;
}
