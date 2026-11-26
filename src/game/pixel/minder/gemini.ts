/**
 * Minder, der har et billede fra Gemini (26. november 2026, Henrik: Gemini må lave grafik, men kun gratis).
 * Henrik laver billedet i Gemini-appen ud fra docs/gemini-billeder.md, og scripts/billede-til-palet.mjs
 * gør det til 320 x 180 i masterpaletten. Filen ligger i public/minder/<id>.png.
 * Står et minde her, bruges billedet. Ellers tegnes mindet med koden i tidlige.ts og senere.ts.
 */
import type { MindeId } from '../../../content/minder';

export const GEMINI_MINDER: readonly MindeId[] = [];

export const geminiSti = (id: MindeId) => `${import.meta.env.BASE_URL}minder/${id}.png`;
