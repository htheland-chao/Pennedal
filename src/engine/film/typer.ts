/**
 * Filmsekvenser (Henrik, 20. november 2026): korte, styrede scener midt i spillet, fx ankomsten til Pennedal.
 * En sekvens er en liste af handlinger i kapitlets JSON. Afspilleren (afspiller.ts) kører dem, og to arbejdere
 * udfører dem: én i Phaser (kamera, figurer, ton, stemning) og én i React (bjælker, dialog, spring over).
 * Ren logik uden React og Phaser. Plan og regler: dokumentet "Pennedal - filmsekvenser: gennemgang og plan".
 */
import type { Replik } from '../../content';

/** Et felt på kortet: kolonne og række. */
export type FeltXY = [number, number];

/** Hvor kameraet skal hen: et felt eller en figur (objektets id, eller "spiller" for hovedpersonen). */
export type KameraMaal = { felt: FeltXY } | { figur: string };

export type Handling =
  /** Venter et antal millisekunder. Kun billeder og lyd har fast tid, aldrig tekst (krav 5). */
  | { type: 'vent'; ms: number }
  /** Kører handlingerne på én gang og venter på den længste. */
  | { type: 'samtidig'; handlinger: Handling[] }
  /** Kameraet glider til et felt eller en figur. zoom er et helt trin (1 eller 2). ms 0 hopper. */
  | { type: 'kamera'; til: KameraMaal; zoom?: number; ms?: number }
  /** En figur går til et felt, vender sig eller toner frem eller væk. */
  | { type: 'figur'; id: string; gaaTil?: FeltXY; vend?: 'venstre' | 'hoejre'; toner?: 'frem' | 'vaek' }
  /** Dialog som i et dialogtrin. Hver replik venter på "Videre". */
  | { type: 'replikker'; replikker: Replik[] }
  /** Sorte filmbjælker foroven og forneden. */
  | { type: 'bjaelker'; til: boolean }
  /** Ton til sort og tilbage til billedet. */
  | { type: 'ton'; til: 'sort' | 'billede'; ms?: number }
  /** Musik: skift til et tema (null: stedets egen sang) med overtoning. */
  | { type: 'musik'; tema: string | null; overtoning?: number }
  /** En lydeffekt (navnene i src/lyd/effekter.ts). */
  | { type: 'lyd'; effekt: string }
  /** Kameraet ryster. Ikke med rolig bevægelse eller "Mindre uhygge". */
  | { type: 'ryst'; ms?: number }
  /** Et kort, lyst glimt. Ikke med "Mindre uhygge". */
  | { type: 'blink' }
  /** Sætter et valg i det gemte spil, som en valgmulighed i en dialog gør. */
  | { type: 'saet'; valg: string };

export type HandlingType = Handling['type'];
/** De handlinger, en arbejder udfører. samtidig og vent klarer afspilleren selv. */
export type EnkelHandling = Exclude<Handling, { type: 'samtidig' } | { type: 'vent' }>;

export const HANDLINGER: readonly HandlingType[] = ['vent', 'samtidig', 'kamera', 'figur', 'replikker', 'bjaelker', 'ton', 'musik', 'lyd', 'ryst', 'blink', 'saet'];

/** Det, der udfører handlingerne. Phaser og React deler opgaverne mellem sig (se FilmLag og kort/film.ts). */
export type Arbejder = {
  /** Kaldes før første handling: lås spillet. */
  start(): void;
  /** Udfører en handling. Løftet holder, til den er færdig. */
  udfoer(h: EnkelHandling): Promise<void>;
  /** Gør en handling færdig med det samme: sluttilstanden, uden animation. Bruges ved "Spring over". */
  slut(h: EnkelHandling): void;
  /** Kaldes altid til sidst, også ved fejl og "Spring over": lås op, fjern bjælker, ryd op. */
  oprydning(): void;
};
