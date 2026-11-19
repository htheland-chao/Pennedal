/**
 * Figurernes billeder i kampen: hvilket billede hvert væsen har, spejling, størrelse og placering på scenen.
 * Delt ud af KampVindue.tsx 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import type { CSSProperties } from 'react';
import { BLAEKLING } from '../../game/pixel/blaekling';
import { KRUSEDULLE } from '../../game/pixel/blaeksoe';
import { HALVSAETNING } from '../../game/pixel/sidstesiden';
import { KAMP_B, KAMP_H } from '../../game/pixel/kampscene';
import { tegnkortTilLerred } from '../../game/pixel/lerred';
import { FUGL, KLATTEN, type Tegnkort } from '../../game/pixel/sprites';
import { STUMMING, TOMORD, VIMS } from '../../game/pixel/viskeskov';
import { EKKO } from '../../game/pixel/rimbjerg';
import { TVIVL } from '../../game/pixel/arkiv';
import type { VaesenId } from '../../mechanics/kamp';

export const SPRITE: Record<VaesenId, Tegnkort> = { tomordet: TOMORD, stumming: STUMMING, ekko: EKKO, tvivl: TVIVL, krusedulle: KRUSEDULLE, halvsaetning: HALVSAETNING, blaekling: BLAEKLING };
/** Et billede spejlet vandret. */
export const spejl = (k: Tegnkort): Tegnkort => ({ ...k, raekker: k.raekker.map((r) => [...r].reverse().join('')) });
/** Hjælperne og væsnerne spejles, så alle kigger mod hinanden (holdet til venstre, væsnerne til højre). */
export const SPEJLET = { fugl: spejl(FUGL), vims: spejl(VIMS), klatten: spejl(KLATTEN) };
export const SPRITE_SPEJLET = Object.fromEntries(Object.entries(SPRITE).map(([k, v]) => [k, spejl(v)])) as Record<VaesenId, Tegnkort>;
/** Figurernes størrelse på scenen (gange baggrundens pixel). Kun hele trin, så alle pixel er lige store (Henrik, 19. november 2026). */
export const FJENDE_SKALA = 2;
export const HOLD_SKALA = 2;

export const billeder = new Map<string, string>();
export function uri(noegle: string, kort: Tegnkort | (() => HTMLCanvasElement)): string {
  if (!billeder.has(noegle)) {
    try {
      billeder.set(noegle, (typeof kort === 'function' ? kort() : tegnkortTilLerred(kort)).toDataURL('image/png'));
    } catch {
      billeder.set(noegle, '');
    }
  }
  return billeder.get(noegle) ?? '';
}

export const bredde = (kort: Tegnkort) => Math.max(...kort.raekker.map((r) => r.length));

/** Placering af et billede i procent af scenen ud fra fodpunktet, så alt skalerer med skærmen. */
export function plads([x, y]: [number, number], kort: Tegnkort, skala = 1): CSSProperties {
  const b = bredde(kort) * skala;
  const h = kort.raekker.length * skala;
  return { left: `${((x - b / 2) / KAMP_B) * 100}%`, top: `${((y - h) / KAMP_H) * 100}%`, width: `${(b / KAMP_B) * 100}%` };
}
/** En blød skygge på jorden under en figur (13. november 2026), så figurerne står på scenen. */
export function fodskygge([x, y]: [number, number], kort: Tegnkort, skala = 1): CSSProperties {
  const b = bredde(kort) * skala * 0.8;
  return { left: `${((x - b / 2) / KAMP_B) * 100}%`, top: `${((y - 3) / KAMP_H) * 100}%`, width: `${(b / KAMP_B) * 100}%`, height: `${(6 / KAMP_H) * 100}%` };
}
/** Et punkt i procent af scenen. */
export const procent = ([x, y]: [number, number]): [number, number] => [(x / KAMP_B) * 100, (y / KAMP_H) * 100];

/** Nogle små stykker blæk eller lys, der flyver ud fra et punkt. Retningerne er faste, så det ser ens ud hver gang. */
export const STYKKER = Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * 360 + (i % 2) * 17, r: 0.7 + (i % 3) * 0.25 }));
