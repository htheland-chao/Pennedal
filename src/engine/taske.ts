import type { Kapitel } from '../content';
import type { GemtSpil } from './gem';

/**
 * Tingene i tasken, der følger med gennem hele spillet (se docs/historie.md).
 * Tasken gemmes ikke. Den regnes ud fra, hvor langt eleven er kommet: et trin kan give ting
 * (feltet giver) og bruge ting (feltet bruger). Derfor virker gamle gemmekoder også, og en ting
 * kan aldrig blive væk, fordi eleven skifter computer.
 * Ting, der kun bruges i ét escape room, ligger stadig i spil.valg (taske.*).
 */
export const TING = ['lanterne', 'kappe', 'logbog', 'punktum', 'krummer', 'rimsten', 'haefte'] as const;
export type TingId = (typeof TING)[number];

export function erTing(id: string): id is TingId {
  return (TING as readonly string[]).includes(id);
}

/**
 * Hukommelsesskår (valgfrie), to pr. kapitel. Rækkefølgen bruges i gemmekoden: tilføj kun til sidst.
 */
export const SKAAR = [
  'k1a', 'k1b', 'k2a', 'k2b', 'k3a', 'k3b', 'k4a', 'k4b',
  'k5a', 'k5b', 'k6a', 'k6b', 'k7a', 'k7b', 'k8a', 'k8b',
] as const;
export type SkaarId = (typeof SKAAR)[number];

/**
 * Vigtige valg, der skal følge med i gemmekoden (nøgler i spil.valg). Højst 8.
 * Rækkefølgen bruges i gemmekoden: tilføj kun til sidst.
 */
export const VIGTIGE_VALG = ['klatten.hjulpet', 'kappe.givet', 'aeseloere.tilgivet'] as const;

/** Klattens venlighed går fra 0 til 7 (3 bit i gemmekoden). */
export const MAKS_VENLIGHED = 7;

/** De trin, eleven er kommet forbi: alle trin i tidligere kapitler og trinnene før det aktuelle. */
function forbiTrin(spil: Pick<GemtSpil, 'kapitel' | 'trin'>, kapitler: Kapitel[]) {
  const ud = [];
  for (const k of [...kapitler].sort((a, b) => a.kapitel - b.kapitel)) {
    if (k.kapitel < spil.kapitel) ud.push(...k.trin);
    else if (k.kapitel === spil.kapitel) ud.push(...k.trin.slice(0, spil.trin));
  }
  return ud;
}

/** Det, der ligger i tasken lige nu, i den rækkefølge tingene blev fundet. */
export function taskeFor(spil: Pick<GemtSpil, 'kapitel' | 'trin'>, kapitler: Kapitel[]): TingId[] {
  const taske: TingId[] = [];
  for (const t of forbiTrin(spil, kapitler)) {
    for (const id of t.giver ?? []) if (erTing(id) && !taske.includes(id)) taske.push(id);
    for (const id of t.bruger ?? []) {
      const i = taske.indexOf(id as TingId);
      if (i >= 0) taske.splice(i, 1);
    }
  }
  return taske;
}

/** Ting, der er kommet i tasken mellem to tilstande (fx når et trin bliver afsluttet). */
export function nyeTing(foer: TingId[], efter: TingId[]): TingId[] {
  return efter.filter((id) => !foer.includes(id));
}

/**
 * Minder (tilbageblik), eleven har mødt: dem i trin, eleven er kommet forbi. Ligesom tasken regnes de ud
 * og gemmes ikke. Et minde, eleven sprang over, kan stadig ses i tasken.
 */
export function minderFor(spil: Pick<GemtSpil, 'kapitel' | 'trin'>, kapitler: Kapitel[]): string[] {
  const ud: string[] = [];
  for (const t of forbiTrin(spil, kapitler))
    if (t.type === 'dialog' && t.tilbageblik && !ud.includes(t.tilbageblik.id)) ud.push(t.tilbageblik.id);
  return ud;
}
