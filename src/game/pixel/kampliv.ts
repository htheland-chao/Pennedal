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

// ============================================================
// Hver figur sin egen bevægelse (Henrik, 14. november 2026): "monstrenes animationer er for ens. Giv hver figur
// forskellige animationer, der passer til figuren." Billederne laves stadig af figurens eget tegnkort.
// ============================================================

type Gitter = string[][];
const gitter = (t: Tegnkort): Gitter => {
  const b = Math.max(...t.raekker.map((r) => r.length));
  return t.raekker.map((r) => [...r.padEnd(b, TOM)]);
};
const kort = (g: Gitter, palet: Tegnkort['palet']): Tegnkort => ({ raekker: g.map((r) => r.join('')), palet });

/** Flytter alle pixel i et område (søjle x0-x1, række y0-y1, begge medregnet) dx og dy. Pixel uden for kanten forsvinder. */
export function flyt(t: Tegnkort, omraade: { x0: number; x1: number; y0: number; y1: number }, dx: number, dy: number): Tegnkort {
  const g = gitter(t);
  const ud = g.map((r) => [...r]);
  const { x0, x1, y0, y1 } = omraade;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y]?.[x] !== undefined && g[y][x] !== TOM) ud[y][x] = TOM;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const c = g[y]?.[x];
      if (!c || c === TOM) continue;
      const ny = y + dy;
      const nx = x + dx;
      if (ny >= 0 && ny < ud.length && nx >= 0 && nx < ud[0].length) ud[ny][nx] = c;
    }
  return kort(ud, t.palet);
}

/** Indsætter en kopi af række y-1 ved række y. Alt nedenunder rykker en ned, og den nederste række forsvinder. */
function aabnRaekke(t: Tegnkort, y: number): Tegnkort {
  const r = [...t.raekker];
  r.splice(y, 0, r[y - 1]);
  r.pop();
  return { raekker: r, palet: t.palet };
}

/** Fjerner række y. Alt nedenunder rykker en op, og der kommer en tom række nederst. */
function lukRaekke(t: Tegnkort, y: number): Tegnkort {
  const b = Math.max(...t.raekker.map((x) => x.length));
  const r = [...t.raekker];
  r.splice(y, 1);
  r.push(TOM.repeat(b));
  return { raekker: r, palet: t.palet };
}

/** Bytter farver i paletten (fx ringe, der skifter farve). */
function bytFarver(t: Tegnkort, byt: Record<string, string>): Tegnkort {
  const palet = { ...t.palet };
  for (const [fra, til] of Object.entries(byt)) palet[fra] = t.palet[til];
  return { raekker: t.raekker, palet };
}

/** Skifter bogstaver i gitteret (fx øjne, der lukkes). Kun inden for rækkerne y0-y1. */
function skift(t: Tegnkort, fra: string, til: string, y0 = 0, y1 = t.raekker.length - 1): Tegnkort {
  return { raekker: t.raekker.map((r, y) => (y >= y0 && y <= y1 ? r.split(fra).join(til) : r)), palet: t.palet };
}

/** Hver række flyttes lidt til siden i en bølge, der løber ned gennem figuren. */
function boelge(t: Tegnkort, fase: number): Tegnkort {
  const g = gitter(t);
  const b = g[0].length;
  const ud = g.map((r, y) => {
    const dx = [0, 1, 0, -1][(y + fase) % 4];
    const n = Array<string>(b).fill(TOM);
    r.forEach((c, x) => {
      if (c !== TOM && x + dx >= 0 && x + dx < b) n[x + dx] = c;
    });
    return n;
  });
  return kort(ud, t.palet);
}

export type FigurId = 'avatar' | 'vims' | 'klatten' | 'fugl' | 'tomordet' | 'stumming' | 'ekko' | 'tvivl' | 'krusedulle' | 'halvsaetning';

/**
 * Billederne og tempoet for en figur. kort er figuren, som den er tegnet (ikke spejlet). retning er den vej,
 * figuren kigger på scenen (1 mod højre). ms er tiden for hvert billede.
 */
export function figurRammer(id: FigurId, k: Tegnkort, retning: 1 | -1 = 1): { rammer: Tegnkort[]; ms: number } {
  const h = k.raekker.length;
  const b = Math.max(...k.raekker.map((r) => r.length));
  switch (id) {
    case 'tomordet': {
      // Det tomme ord er sultent: munden smasker op og i, og halen svirper.
      const hale = (dx: number, t: Tegnkort) => flyt(t, { x0: 0, x1: b - 1, y0: 13, y1: h - 1 }, dx, 0);
      return { rammer: [k, hale(-1, aabnRaekke(k, 9)), k, hale(1, lukRaekke(k, 8))], ms: 170 };
    }
    case 'stumming': {
      // Stummingen er stille og søvnig: den vugger langsomt, trækker vejret og blinker.
      const vug = (dx: number) => flyt(k, { x0: 0, x1: b - 1, y0: 0, y1: 11 }, dx, 0);
      return { rammer: [k, aande(k, 9), k, vug(-1), skift(k, 'E', 'G'), vug(1)], ms: 420 };
    }
    case 'ekko': {
      // Ekkoet gentager sig selv: ringene skifter farve udad som en lydbølge, og munden former et "o".
      const ring1 = bytFarver(k, { c: 'B', B: 'b', b: 'c' });
      const ring2 = bytFarver(k, { c: 'b', B: 'c', b: 'B' });
      return { rammer: [k, ring1, ring2, aabnRaekke(ring1, 10)], ms: 210 };
    }
    case 'tvivl': {
      // Den Tvivlende Sætning kan ikke bestemme sig: de to halvdele vipper skiftevis op og ned.
      const vip = (d: number) => flyt(flyt(k, { x0: 0, x1: 6, y0: 0, y1: h - 1 }, 0, -d), { x0: 7, x1: b - 1, y0: 0, y1: h - 1 }, 0, d);
      return { rammer: [k, vip(1), k, vip(-1)], ms: 330 };
    }
    case 'krusedulle': {
      // Krusedullen er en levende kruseduller: stregen bølger hele tiden.
      return { rammer: [0, 1, 2, 3].map((f) => boelge(k, f)), ms: 140 };
    }
    case 'halvsaetning': {
      // Halvsætningen tripper på sine små ben, og den flossede ende blafrer.
      const ben = (dx: number, t: Tegnkort) => flyt(t, { x0: 0, x1: b - 1, y0: 10, y1: h - 1 }, dx, 0);
      const ende = (dy: number, t: Tegnkort) => flyt(t, { x0: 12, x1: b - 1, y0: 0, y1: 9 }, 0, dy);
      return { rammer: [k, ben(1, ende(-1, k)), k, ben(-1, ende(1, k))], ms: 210 };
    }
    case 'vims': {
      // Vims letter på hatten, blinker og snakker.
      const hat = flyt(k, { x0: 0, x1: b - 1, y0: 0, y1: 4 }, 0, -1);
      const blink = skift(k, 'E', 'P');
      const snak = { raekker: k.raekker.map((r, y) => (y === 11 ? r.slice(0, 7) + 'oo' + r.slice(9) : r)), palet: k.palet };
      return { rammer: [k, hat, k, blink, snak, k], ms: 260 };
    }
    case 'klatten': {
      // Klattens spids blafrer som en flamme, og kroppen trækker vejret.
      const flamme = (dx: number, t: Tegnkort) => flyt(t, { x0: 0, x1: b - 1, y0: 0, y1: 3 }, dx, 0);
      return { rammer: [k, flamme(-retning, k), aande(k, 12), flamme(retning, aande(k, 12))], ms: 180 };
    }
    case 'fugl': {
      // Æseløre baskser med vingen.
      const vinge = (dy: number) => flyt(k, { x0: 0, x1: 8, y0: 0, y1: 4 }, 0, dy);
      return { rammer: [k, vinge(1), vinge(2), vinge(1)], ms: 140 };
    }
    default:
      return { rammer: kampRammer(k, retning), ms: 320 };
  }
}
