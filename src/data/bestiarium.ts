/**
 * Bestiariet (spilletest 13. november 2026): de væsner, holdet kender det svage punkt hos. Huskes på tværs af kampe,
 * så Lyt er nyttig første gang, man møder et væsen, og ikke spildt bagefter. Gemmes kun i browseren.
 */
import type { VaesenId } from '../mechanics/kamp';

const NOEGLE = 'pennedal.bestiarium.v1';

export function hentKendte(lager: Storage | undefined = globalThis.localStorage): VaesenId[] {
  try {
    const d = JSON.parse(lager?.getItem(NOEGLE) ?? '[]');
    return Array.isArray(d) ? d.filter((x): x is VaesenId => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function huskKendte(nye: readonly VaesenId[], lager: Storage | undefined = globalThis.localStorage): VaesenId[] {
  const alle = [...new Set([...hentKendte(lager), ...nye])];
  try {
    lager?.setItem(NOEGLE, JSON.stringify(alle));
  } catch {
    // Browseren gemmer ikke (privat vindue). Så huskes det kun i denne kamp.
  }
  return alle;
}
