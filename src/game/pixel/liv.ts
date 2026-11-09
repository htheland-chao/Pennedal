/**
 * Figurer, der lever, når de står stille (Henrik, 9. november 2026): de blinker og trækker vejret.
 * Begge dele er ekstra billeder lavet ud fra figurens tegnkort, så ingen figur skal tegnes to gange.
 * Ren logik uden canvas, så det kan testes.
 */
import type { Tegnkort } from './sprites';

/**
 * Lukker øjnene: øjenpixel får farven fra pixlen over øjet (øjenlåget). Er øjet mindst to pixel højt,
 * bliver den nederste række til omridset, så det ligner et lukket øje. null, hvis figuren ikke har øjne.
 */
export function lukOejne(t: Tegnkort, oejne: string[] = ['E']): Tegnkort | null {
  const g = t.raekker.map((r) => r.split(''));
  const er = (x: number, y: number) => oejne.includes(g[y]?.[x] ?? '.');
  const ud = t.raekker.map((r) => r.split(''));
  let fundet = false;
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[y].length; x++) {
      if (!er(x, y)) continue;
      fundet = true;
      let ly = y - 1;
      while (ly >= 0 && er(x, ly)) ly--;
      const laag = ly >= 0 && g[ly][x] !== '.' ? g[ly][x] : g[y][x];
      const nederst = !er(x, y + 1);
      const hoejt = er(x, y - 1);
      ud[y][x] = nederst && hoejt && t.palet.K ? 'K' : laag;
    }
  return fundet ? { raekker: ud.map((r) => r.join('')), palet: t.palet } : null;
}

/**
 * Vejrtrækning: overkroppen synker én pixel. Rækken lige over hoften fjernes, og der kommer en tom række øverst,
 * så fødderne står samme sted. hofte er rækken (fra toppen), der fjernes. Standard er midt på figuren.
 */
export function aande(t: Tegnkort, hofte = Math.floor(t.raekker.length * 0.55)): Tegnkort {
  const bredde = Math.max(...t.raekker.map((r) => r.length));
  const r = [...t.raekker];
  r.splice(hofte, 1);
  r.unshift('.'.repeat(bredde));
  return { raekker: r, palet: t.palet };
}

/** Gangen i fire trin: venstre fod, stå, højre fod, stå. Ramme 0 er at stå. */
export const GANG = [1, 0, 2, 0] as const;
export const gangRamme = (tid: number, fart = 8) => GANG[Math.floor(tid * fart) % GANG.length];

/**
 * Hvad en figur gør lige nu, når den står stille: 'blink' i et kort øjeblik med flere sekunders mellemrum,
 * 'aande' halvdelen af tiden i et roligt tempo, ellers 'staa'. fase gør, at figurerne ikke gør det i takt.
 * Intet blinker hurtigt, og med reduceret bevægelse står figurerne bare.
 */
export function hvileTilstand(ur: number, fase: number, roligt = false): 'staa' | 'blink' | 'aande' {
  if (roligt) return 'staa';
  const b = (ur + fase * 7) % 4.3;
  if (b < 0.14) return 'blink';
  return Math.sin((ur + fase * 5) * 1.7) > 0.2 ? 'aande' : 'staa';
}
