import type { MutableRefObject } from 'react';
import type { ValgMulighed } from '../../content';
import type { GemtSpil } from '../../data/gem';
import { erFaerdighed } from '../../engine/faerdigheder';
import { MAKS_VENLIGHED } from '../../engine/taske';
import { registrerSvar, type Haendelse } from '../../engine/tilpasning';

/**
 * Små ændringer i det gemte spil fra verdenen: valg i en dialog, valg fra en filmsekvens, kampens fremskridt og
 * svar på opgaver. Delt ud af Verden.tsx 20. november 2026 (Henriks regel: ingen fil over 500 linjer).
 */
export function useGemning(spilRef: MutableRefObject<GemtSpil>, opdater: (s: GemtSpil) => void) {
  const gem = (nyt: GemtSpil) => {
    spilRef.current = nyt;
    opdater(nyt);
  };

  /** Et valg i en dialog: gemmes i spil.valg, og venlighed lægges til Klattens venlighed. */
  function vaelg(m: ValgMulighed) {
    const s = spilRef.current;
    gem({
      ...s,
      valg: m.saet ? { ...s.valg, [m.saet]: 'ja' } : s.valg,
      venlighed: Math.min(MAKS_VENLIGHED, s.venlighed + (m.venlighed ?? 0)),
    });
  }

  /** En filmsekvens sætter et valg (handlingen saet), ligesom en valgmulighed i en dialog. */
  function saet(valg: string) {
    const s = spilRef.current;
    if (s.valg[valg] !== 'ja') gem({ ...s, valg: { ...s.valg, [valg]: 'ja' } });
  }

  /** Kampen gemmer den skade, holdet har givet væsnerne, så den kan fortsætte senere (højst 98). */
  function kampFremskridt(givet: number) {
    gem({ ...spilRef.current, trinFremskridt: Math.min(98, Math.max(0, givet)) });
  }

  function onSvar(faerdighed: string, rigtigt: boolean, forsoeg: number): Haendelse {
    if (!erFaerdighed(faerdighed)) return null;
    const s = spilRef.current;
    const r = registrerSvar(s.faerdigheder[faerdighed], { rigtigt, forsoeg });
    opdater({ ...s, faerdigheder: { ...s.faerdigheder, [faerdighed]: r.status } });
    return r.haendelse;
  }

  return { vaelg, saet, kampFremskridt, onSvar };
}
