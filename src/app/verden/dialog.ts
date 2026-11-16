import type { DialogValg, Kapitel, OrdOpgaveArt, Replik, ValgMulighed } from '../../content';
import { opfyldt, udvaelg } from '../../engine/betingelse';
import type { FaerdighedId } from '../../engine/faerdigheder';
import type { GemtSpil } from '../../engine/gem';

/**
 * Små regler for dialogerne i verdenen: hvilke replikker der vises, og hvad man kan tale om igen.
 * Delt ud af Verden.tsx 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */

/** En dialog uden for trinnene: tal igen, sidemissionen eller en udflugt. efter kaldes, når den lukker. */
export type Gentagelse = { replikker: Replik[]; valg?: DialogValg; efter?: (valgt: ValgMulighed | null) => void };

/** Kun de replikker og valgmuligheder, hvis betingelse er opfyldt. */
export function tilpasDialog(replikker: Replik[], valg: DialogValg | undefined, spil: GemtSpil): { replikker: Replik[]; valg?: DialogValg } {
  return {
    replikker: udvaelg(replikker, spil),
    valg: !valg || !opfyldt(valg.hvis, spil) ? undefined : { ...valg, muligheder: udvaelg(valg.muligheder, spil).map((m) => ({ ...m, replikker: udvaelg(m.replikker, spil) })) },
  };
}

/** Hvilken færdighed en lille ordopgave øver (ordsten og sidemissioner). */
export function ordFaerdighed(art: OrdOpgaveArt | undefined): FaerdighedId {
  if (art === 'rim' || art === 'ikkerim') return 'laes.rim';
  if (art === 'fortaeller') return 'fort.fortaeller_tid';
  if (art === 'stavning') return 'stav.vokal_dobbeltkonsonant';
  if (art === 'genre') return 'laes.forstaaelse';
  return 'laes.ordforraad';
}

/**
 * Tal igen (Henrik, 1. november 2026): den, man har talt med på dette sted, kan man gå hen til igen
 * og høre den seneste samtale. Et valg vises med den mulighed, eleven valgte.
 */
export function samtalerPaaStedet(kapitel: Kapitel, spil: GemtSpil, stedId: string): Record<string, Replik[]> {
  const m: Record<string, Replik[]> = {};
  for (const t of kapitel.trin.slice(0, spil.trin)) {
    if (t.type !== 'dialog' || !t.objekt || t.sted !== stedId) continue;
    const valgt = t.valg?.muligheder.find((v) => (v.saet ? spil.valg[v.saet] === 'ja' : false)) ?? t.valg?.muligheder.find((v) => !v.saet);
    m[t.objekt] = valgt ? [...t.replikker, ...valgt.replikker] : t.replikker;
  }
  return m;
}
