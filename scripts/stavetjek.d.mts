import type { TekstPost } from './tekster.mjs';
export type Fund = TekstPost & { problem: string; forslag?: string[] };
export function lavStavekontrol(): { correct(ord: string): boolean; suggest(ord: string): string[] };
export function tjekTekster(tekster?: TekstPost[]): Fund[];
