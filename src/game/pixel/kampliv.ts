/**
 * Liv i kampen (Henrik, 13. november 2026): figurerne stod stive som et bræt. Nu har hver figur fire billeder,
 * der skifter roligt: stå, træk vejret, læn dig frem med armene og spred benene, træk vejret igen.
 * Billederne laves af figurens eget tegnkort, så der ikke skal tegnes nyt. Samme størrelse i alle billeder.
 */
import type { Tegnkort } from './sprites';
import { aande } from './liv';

const TOM = '.';

/** Overkroppen (rækkerne over hoften) flyttes dx pixel til siden. Benene står. */
export function laen(t: Tegnkort, dx: number, hofte = Math.floor(t.raekker.length * 0.55)): Tegnkort {
  const b = Math.max(...t.raekker.map((r) => r.length));
  const raekker = t.raekker.map((r, y) => {
    if (y >= hofte) return r;
    const g = [...r.padEnd(b, TOM)];
    const ud = Array<string>(b).fill(TOM);
    g.forEach((c, x) => {
      const nx = x + dx;
      if (nx >= 0 && nx < b) ud[nx] = c;
    });
    return ud.join('');
  });
  return { raekker, palet: t.palet };
}

/**
 * Benene spredes en pixel ud til hver side. Kun rækker, der allerede har et mellemrum i midten (to ben), ændres,
 * så figurer uden ben (en klat, et spøgelse) ikke flækker.
 */
export function spred(t: Tegnkort, hofte = Math.floor(t.raekker.length * 0.55)): Tegnkort {
  const b = Math.max(...t.raekker.map((r) => r.length));
  const raekker = t.raekker.map((r, y) => {
    if (y < hofte) return r;
    const g = [...r.padEnd(b, TOM)];
    const fyldt = g.map((c, x) => (c === TOM ? -1 : x)).filter((x) => x >= 0);
    if (fyldt.length < 2) return r;
    const venstre = fyldt[0];
    const hoejre = fyldt[fyldt.length - 1];
    const midte = Math.round((venstre + hoejre) / 2);
    // Et ben på hver side: der skal være et hul ved midten.
    const hul = g[midte] === TOM || g[midte - 1] === TOM;
    if (!hul) return r;
    const ud = Array<string>(b).fill(TOM);
    g.forEach((c, x) => {
      if (c === TOM) return;
      const nx = x < midte ? x - 1 : x + 1;
      if (nx >= 0 && nx < b) ud[nx] = c;
    });
    return ud.join('');
  });
  return { raekker: raekker, palet: t.palet };
}

/**
 * Armene: de yderste to søjler i overkroppen (mellem skuldre og hofte) flyttes en pixel. op = venstre arm op og
 * højre arm ned, ellers omvendt. På figurer uden arme ser det ud, som om siderne bølger lidt.
 */
export function arme(t: Tegnkort, op: boolean, hofte = Math.floor(t.raekker.length * 0.55)): Tegnkort {
  const h = t.raekker.length;
  const b = Math.max(...t.raekker.map((r) => r.length));
  const g = t.raekker.map((r) => [...r.padEnd(b, TOM)]);
  const fra = Math.floor(h * 0.3);
  const til = Math.min(h - 1, hofte + 2);
  let venstre = b;
  let hoejre = -1;
  for (let y = fra; y < til; y++)
    g[y].forEach((c, x) => {
      if (c === TOM) return;
      venstre = Math.min(venstre, x);
      hoejre = Math.max(hoejre, x);
    });
  if (hoejre - venstre < 5) return t;
  const ud = g.map((r) => [...r]);
  const flyt = (x: number, dy: number) => {
    for (let y = fra; y < til; y++) ud[y][x] = TOM;
    for (let y = fra; y < til; y++) {
      const ny = y + dy;
      if (g[y][x] !== TOM && ny >= fra && ny < til) ud[ny][x] = g[y][x];
    }
    // Den række, armen forlod, får kroppens farve fra naboen indenfor, så der ikke kommer et hul.
    const tom = dy < 0 ? til - 1 : fra;
    if (ud[tom][x] === TOM && g[tom][x] !== TOM) ud[tom][x] = g[tom][x];
  };
  for (const x of [venstre, venstre + 1]) flyt(x, op ? -1 : 1);
  for (const x of [hoejre, hoejre - 1]) flyt(x, op ? 1 : -1);
  return { raekker: ud.map((r) => r.join('')), palet: t.palet };
}

/**
 * De fire billeder i kampen. retning: 1 = figuren kigger mod højre (holdet), -1 = mod venstre (væsnerne).
 * Væsner uden ben (svæver) får kun vejrtrækning og læn.
 */
export function kampRammer(t: Tegnkort, retning: 1 | -1, harBen = true): Tegnkort[] {
  const hofte = Math.floor(t.raekker.length * 0.55);
  const aand = aande(t, hofte);
  const frem = laen(t, retning, hofte);
  return [t, arme(aand, true, hofte), harBen ? spred(frem, hofte) : frem, arme(aand, false, hofte)];
}
