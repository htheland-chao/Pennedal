/**
 * Hvad en filmsekvens kræver af stedet (20. november 2026). Ren logik uden React og Phaser.
 */
import type { Handling } from './typer';

/**
 * Figurer, der er skjult, fra filmens trin begynder: dem, hvis første toning er "frem". Så står Æseløre ikke
 * synlig på kortet, før han dukker op i filmen.
 */
export function skjultFoerFilm(handlinger: Handling[]): string[] {
  const foerste = new Map<string, 'frem' | 'vaek'>();
  const gaa = (hs: Handling[]) => {
    for (const h of hs) {
      if (h.type === 'samtidig') gaa(h.handlinger);
      else if (h.type === 'figur' && h.toner && !foerste.has(h.id)) foerste.set(h.id, h.toner);
    }
  };
  gaa(handlinger);
  return [...foerste].filter(([, t]) => t === 'frem').map(([id]) => id);
}

/** Figurer, der er tonet væk, når filmen slutter (deres sidste toning er "væk"). De bliver væk bagefter. */
export function vaekEfterFilm(handlinger: Handling[]): string[] {
  const sidste = new Map<string, 'frem' | 'vaek'>();
  const gaa = (hs: Handling[]) => {
    for (const h of hs) {
      if (h.type === 'samtidig') gaa(h.handlinger);
      else if (h.type === 'figur' && h.toner) sidste.set(h.id, h.toner);
    }
  };
  gaa(handlinger);
  return [...sidste].filter(([, t]) => t === 'vaek').map(([id]) => id);
}
