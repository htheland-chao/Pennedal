/**
 * Afspilleren til filmsekvenser (20. november 2026). Kører handlingerne efter hinanden, samtidig og indlejret.
 * "Spring over" stopper alt og sætter hver handling, der ikke er færdig, til sin sluttilstand i rækkefølge, så
 * spillet står præcis som efter hele sekvensen. Oprydningen sker altid. Ren logik: tiden og arbejderen gives udefra.
 */
import type { Arbejder, EnkelHandling, Handling } from './typer';

/** Et ur, der kan kaldes tilbage efter ms millisekunder. Standard er setTimeout. Giver en funktion, der stopper det. */
export type Ur = (ms: number, fn: () => void) => () => void;
const standardUr: Ur = (ms, fn) => {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
};

export type Afspilning = {
  /** Holder, til sekvensen er færdig eller sprunget over, og oprydningen er sket. */
  faerdig: Promise<void>;
  /** Spring resten over. Kan kaldes flere gange. */
  springOver(): void;
  /** true, når "Spring over" er brugt. */
  sprungetOver(): boolean;
};

/** Alle handlinger, en arbejder udfører, i den rækkefølge de står (samtidige i listens orden). */
export function enkle(handlinger: Handling[]): EnkelHandling[] {
  return handlinger.flatMap((h) => (h.type === 'samtidig' ? enkle(h.handlinger) : h.type === 'vent' ? [] : [h]));
}

export function afspil(handlinger: Handling[], arbejder: Arbejder, ur: Ur = standardUr): Afspilning {
  let sprunget = false;
  const faerdige = new Set<EnkelHandling>();
  const stop = new Set<() => void>();
  let springLoefte: (() => void) | null = null;
  const springet = new Promise<void>((r) => (springLoefte = r));

  /** Venter på et løfte, men giver op med det samme, hvis der springes over. */
  const indtil = (p: Promise<void>) => Promise.race([p, springet]);

  async function koer(h: Handling): Promise<void> {
    if (sprunget) return;
    if (h.type === 'samtidig') {
      await Promise.all(h.handlinger.map(koer));
      return;
    }
    if (h.type === 'vent') {
      await indtil(
        new Promise<void>((r) => {
          const s = ur(Math.max(0, h.ms), () => {
            stop.delete(s);
            r();
          });
          stop.add(s);
        }),
      );
      return;
    }
    await indtil(arbejder.udfoer(h));
    if (!sprunget) faerdige.add(h);
  }

  async function hele(): Promise<void> {
    arbejder.start();
    try {
      for (const h of handlinger) {
        if (sprunget) break;
        await koer(h);
      }
      if (sprunget) for (const h of enkle(handlinger)) if (!faerdige.has(h)) arbejder.slut(h);
    } finally {
      arbejder.oprydning();
    }
  }

  return {
    faerdig: hele(),
    springOver() {
      if (sprunget) return;
      sprunget = true;
      stop.forEach((s) => s());
      stop.clear();
      springLoefte?.();
    },
    sprungetOver: () => sprunget,
  };
}

/** Hvor længe billederne i en sekvens varer i alt (ms), uden dialog, som eleven selv styrer. */
export function billedtid(handlinger: Handling[]): number {
  const en = (h: Handling): number => {
    switch (h.type) {
      case 'vent':
        return h.ms;
      case 'samtidig':
        return Math.max(0, ...h.handlinger.map(en));
      case 'kamera':
      case 'ton':
        return h.ms ?? 0;
      case 'musik':
        return 0;
      case 'ryst':
        return h.ms ?? 0;
      default:
        return 0;
    }
  };
  return handlinger.reduce((s, h) => s + en(h), 0);
}
