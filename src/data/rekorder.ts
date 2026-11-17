import { erBedre, type Rekord } from '../engine/dybet';

/**
 * Blækdybets rekorder: den bedste tur og den bedste for hver rekordkode.
 * Rekorderne gemmes kun i denne browser (krav 4).
 * Flyttet ud af Blaekdybet.tsx 17. november 2026 (Henriks regel: gemning og indlæsning står i data/).
 */
const NOEGLE = 'pennedal.dybet.v1';
export type Gemt = { bedste: Rekord | null; perKode: Record<string, Rekord> };
export function hentRekorder(): Gemt {
  try {
    const d = JSON.parse(localStorage.getItem(NOEGLE) ?? 'null');
    if (d && typeof d === 'object') return { bedste: d.bedste ?? null, perKode: d.perKode ?? {} };
  } catch {
    // Ingen eller ødelagte data: start forfra.
  }
  return { bedste: null, perKode: {} };
}
export function gemRekord(r: Rekord): { ny: boolean; nyKode: boolean } {
  const g = hentRekorder();
  const ny = erBedre(r, g.bedste);
  const nyKode = erBedre(r, g.perKode[r.froe] ?? null);
  if (ny) g.bedste = r;
  if (nyKode) g.perKode[r.froe] = r;
  try {
    localStorage.setItem(NOEGLE, JSON.stringify(g));
  } catch {
    // Kan ikke gemme (privat vindue): rekorden vises stadig.
  }
  return { ny, nyKode };
}
