/**
 * Baggrundsmusik til Pennedal. Komponeret til spillet (31. oktober 2026), så den er original og har ingen fremmed licens.
 * Hver sang er 8 takter med 8 ottendedele og spiller i loop. Alle spor i en sang er lige lange.
 */
import type { Sang } from './noder';
import { bibliotek, eng, floden, fyrtaarn, kaelder, pennedal, smoeger, tage, torv, trykkeri } from './sange/steder1';
import { forside, intro, kamp, minde, ufaerdige } from './sange/stemninger';
import { arkiv, blaeksoe, halve, hytte, rimbjerg, siden, viskeskov, viskesti } from './sange/steder2';

/** Sang pr. tema. Et tema uden sang får forsidens. */
export const SANGE: Record<string, Sang> = { bibliotek, kaelder, pennedal, floden, fyrtaarn, eng, torv, smoeger, trykkeri, tage, forside, ufaerdige, intro, minde, viskeskov, kamp, viskesti, rimbjerg, arkiv, blaeksoe, hytte, halve, siden };
