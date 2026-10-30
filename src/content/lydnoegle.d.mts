export type FigurStemme = { stemme: string; stil: string };
export type StemmeOpsaetning = {
  model: string;
  figurer: Record<string, FigurStemme>;
  udtale?: Record<string, string>;
};
export function cyrb53(tekst: string, seed?: number): number;
export function taleTekst(tekst: string, udtale?: Record<string, string>): string;
export function lydNoegle(tekst: string, figur: string, stemmer: StemmeOpsaetning): string | null;
