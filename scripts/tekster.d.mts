export type TekstPost = { kilde: string; id: string; tekst: string; bevidstFejl?: boolean; note?: string };
export function alleTekster(): TekstPost[];
export function renTekst(tekst: string): string;
