/**
 * Hvad kampens nederste felt viser lige nu: menuen, et valg, en opgave, afspilningen eller slutningen.
 * Delt ud af KampVindue.tsx 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import type { KampOpgave } from '../../mechanics/kamp';
import type { Slag } from '../../mechanics/kampmotor';

export type Visning =
  | { type: 'menu' }
  | { type: 'slag' }
  | { type: 'maal'; slag: Slag; stort: boolean }
  | { type: 'lyt' }
  | { type: 'opgave'; slag: Slag; stort: boolean; fjende: number; opgave: KampOpgave; vaek: string[]; svaret: string | null; forklaret: boolean }
  | { type: 'hjaelper' }
  | { type: 'lap' }
  | { type: 'slet' }
  | { type: 'taske' }
  | { type: 'punktum' }
  | { type: 'afspil' }
  | { type: 'slut' };
