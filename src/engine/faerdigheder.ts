/**
 * Alle færdigheder i spillet med faste id'er.
 * VIGTIGT: Rækkefølgen bruges i gemmekoden. Tilføj kun nye færdigheder til sidst,
 * og flyt eller slet aldrig en eksisterende.
 */
export const FAERDIGHEDER = [
  'stav.stumme',
  'stav.bortfald',
  'stav.navneord_endelse',
  'stav.verbum_datid',
  'stav.vokal_dobbeltkonsonant',
  'sprog.bestemt_form',
  'sprog.en_et',
  'sprog.sin_hendes',
  'tegn.punktum_stort',
  'tegn.replik',
  'tegn.stort_I',
  'fort.struktur',
  'fort.fortaeller_tid',
  'fort.tidsord_afsnit',
  'fort.dansk_ord',
  'laes.praecision',
  'laes.ordforraad',
  'laes.forstaaelse',
  // Kapitel 2: punktum, spørgsmålstegn og udråbstegn (Råberens tegn).
  'tegn.saetningstegn',
] as const;

export type FaerdighedId = (typeof FAERDIGHEDER)[number];

export function erFaerdighed(id: string): id is FaerdighedId {
  return (FAERDIGHEDER as readonly string[]).includes(id);
}

/**
 * Alt, der kan låses op. Rækkefølgen bruges i gemmekoden (højst 16).
 * Tilføj kun til sidst.
 */
export const OPLAASNINGER = [
  'toej.kappe',
  'tilbehoer.lanterne',
  'hoved.kasket',
] as const;

export type OplaasningId = (typeof OPLAASNINGER)[number];
