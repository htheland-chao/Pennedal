/**
 * Råberens tegn: eleven vælger det tegn, en sætning skal slutte med.
 * Punktum til fortællinger og beskeder, spørgsmålstegn til spørgsmål, udråbstegn til råb og ordrer.
 * Indirekte spørgsmål ("Hun spørger, om ...") er fortællinger og får punktum.
 */
import { vaelg } from '../engine/tilfaeldig';

export type Saetningstegn = '.' | '?' | '!';
export type RaaberSaetning = { id: string; niveau: number; tekst: string; tegn: Saetningstegn };

export const TEGN: Saetningstegn[] = ['.', '?', '!'];

/** Vælger en sætning på elevens niveau. Undgår de sidst brugte. Er der ingen på niveauet, bruges det nærmeste lavere. */
export function lavRaaberOpgave(saetninger: RaaberSaetning[], niveau: number, rnd: () => number, brugt: string[] = []): RaaberSaetning {
  for (let n = Math.min(5, Math.max(1, niveau)); n >= 1; n--) {
    const her = saetninger.filter((s) => s.niveau === n);
    const nye = her.filter((s) => !brugt.includes(s.id));
    if (nye.length) return vaelg(nye, rnd);
    if (her.length) return vaelg(her, rnd);
  }
  return vaelg(saetninger, rnd);
}

export const tjekRaaber = (s: RaaberSaetning, valg: Saetningstegn) => s.tegn === valg;

/** Sætningen med et tegn til sidst. */
export const medTegn = (s: RaaberSaetning, tegn: Saetningstegn) => `${s.tekst}${tegn}`;

/** Er sætningen et indirekte spørgsmål? Så skal feedback forklare, at den får punktum, selvom den handler om et spørgsmål. */
export function erIndirekte(s: RaaberSaetning): boolean {
  return s.tegn === '.' && /\b(spørger|undrer|ved|ved ikke|aner)\b.*,\s*(om|hvem|hvad|hvor|hvorfor|hvornår|hvordan)\b/i.test(s.tekst);
}
