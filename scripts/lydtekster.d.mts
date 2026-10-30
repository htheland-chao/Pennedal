import type { StemmeOpsaetning } from '../src/content/lydnoegle.mjs';
export type LydPost = { noegle: string; figur: string; tekst: string; raa: string; kilde: string };
export function hentStemmer(): StemmeOpsaetning;
export function alleLydtekster(stemmer?: StemmeOpsaetning): LydPost[];
