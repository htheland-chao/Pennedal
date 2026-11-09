import type { Kapitel, Mission } from '../content';
import type { GemtSpil } from './gem';
import { SKAAR } from './taske';

/**
 * Frivilligt indhold (Henrik, 9. november 2026): sidemissioner og svære udflugter. Det er ikke trin i kapitlet,
 * så gamle gemmekoder peger stadig rigtigt. Belønningen er et hukommelsesskår, som står i gemmekoden.
 * Hvor langt eleven er i en mission (startet, blade fundet), står i spil.valg. Det følger ikke med i gemmekoden,
 * men skåret gør, og så er missionen færdig.
 */
export type MissionStatus = 'ny' | 'samler' | 'klar' | 'faerdig';

export const missionStartet = (id: string) => `mission.${id}`;
export const bladFundet = (id: string) => `blad.${id}`;

export function missionStatus(spil: Pick<GemtSpil, 'valg' | 'skaar'>, id: string, m: Mission): MissionStatus {
  if (spil.skaar.includes(m.skaar)) return 'faerdig';
  if (spil.valg[missionStartet(id)] !== 'ja') return 'ny';
  return m.blade.every((b) => spil.valg[bladFundet(b)] === 'ja') ? 'klar' : 'samler';
}

export function antalBlade(spil: Pick<GemtSpil, 'valg'>, m: Mission): number {
  return m.blade.filter((b) => spil.valg[bladFundet(b)] === 'ja').length;
}

/** Missionen, et objekt hører til (som giver eller blad). */
export function missionFor(kapitel: Kapitel, objekt: string): { id: string; mission: Mission } | null {
  for (const [id, mission] of Object.entries(kapitel.missioner ?? {}))
    if (mission.giver === objekt || mission.blade.includes(objekt)) return { id, mission };
  return null;
}

/** Blade, der ikke skal vises: før missionen er startet, og når de er samlet. */
export function skjulteBlade(spil: Pick<GemtSpil, 'valg' | 'skaar'>, kapitel: Kapitel): string[] {
  const ud: string[] = [];
  for (const [id, m] of Object.entries(kapitel.missioner ?? {})) {
    const status = missionStatus(spil, id, m);
    for (const b of m.blade) if (status === 'ny' || status === 'faerdig' || spil.valg[bladFundet(b)] === 'ja') ud.push(b);
  }
  return ud;
}

/** Lægger et skår til (én gang), i den faste rækkefølge fra SKAAR. */
export function medSkaar<T extends Pick<GemtSpil, 'skaar'>>(spil: T, skaar: string): T {
  if (spil.skaar.includes(skaar)) return spil;
  const alle = [...spil.skaar, skaar];
  return { ...spil, skaar: SKAAR.filter((s) => alle.includes(s)) };
}
