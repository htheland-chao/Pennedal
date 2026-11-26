/**
 * Pixelgrafik til minderne (tilbageblik), 320 x 180. Kræver en browser.
 * Varme, falmede farver. Ingen ansigter, kun hænder, ting og rum (docs/historie.md).
 * Ingen bogstaver: ordene på siden er streger, man ikke kan læse (hensyn til ordblinde elever, regel 2).
 * Kornet og bevægelsen lægges ovenpå med CSS.
 */
import type { MindeId } from '../../content/minder';
import { hash, lerred } from './lerred';
import { B, felt, H } from './minder/faelles';
import { GEMINI_MINDER, geminiSti } from './minder/gemini';
import { tegnBlaek, tegnStreger, tegnKoekkenbord, tegnViskelaeder, tegnHaeftetPaaGulvet, tegnGodnat, tegnSkyggenIMargenen, tegnDoerenPaaKlem } from './minder/tidlige';
import { tegnSkyggen, tegnFodnotenIHaeftet, tegnVindueskarmen, tegnFoldet, tegnKlattenPaaSiden, tegnKassenVedDoeren, tegnSoeskendet, tegnKassenPaaBiblioteket, tegnSkyggenPaaVejen, tegnSkuffen } from './minder/senere';

const TEGN: Record<MindeId, () => HTMLCanvasElement> = { blaek: tegnBlaek, streger: tegnStreger, koekkenbord: tegnKoekkenbord, skaar3a: tegnViskelaeder, skaar3b: tegnHaeftetPaaGulvet, godnat: tegnGodnat, skaar4a: tegnSkyggenIMargenen, skaar4b: tegnDoerenPaaKlem, skyggen: tegnSkyggen, skaar5a: tegnFodnotenIHaeftet, skaar5b: tegnVindueskarmen, foldet: tegnFoldet, skaar6a: tegnKlattenPaaSiden, skaar6b: tegnKassenVedDoeren, soeskendet: tegnSoeskendet, skaar7a: tegnKassenPaaBiblioteket, skaar7b: tegnSkyggenPaaVejen, skuffen: tegnSkuffen };

const cache = new Map<MindeId, string | null>();
/** Billedet til et minde: stien til Gemini-billedet, hvis det findes (minder/gemini.ts), ellers en data-URL. Uden canvas (fx i enhedstests) bliver det null, og mindet vises kun som tekst. */
export function mindeBillede(id: MindeId): string | null {
  if (!cache.has(id)) {
    if (GEMINI_MINDER.includes(id)) {
      cache.set(id, geminiSti(id));
      return cache.get(id) ?? null;
    }
    try {
      cache.set(id, TEGN[id]().toDataURL('image/png'));
    } catch {
      cache.set(id, null);
    }
  }
  return cache.get(id) ?? null;
}

let korn: string | null | undefined;
/** Fint pixelkorn, som et gammelt fotografi. Lægges ovenpå og flyttes lidt med CSS. */
export function kornBillede(): string | null {
  if (korn !== undefined) return korn;
  try {
    const c = lerred(B, H);
    const g = c.getContext('2d')!;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < B; x++) {
        const v = hash(x * 7 + 3, y * 13 + 1);
        if (v > 0.95) felt(g, x, y, 1, 1, 'rgba(255, 250, 235, 0.4)');
        else if (v < 0.04) felt(g, x, y, 1, 1, 'rgba(90, 66, 48, 0.25)');
      }
    korn = c.toDataURL('image/png');
  } catch {
    korn = null;
  }
  return korn;
}
