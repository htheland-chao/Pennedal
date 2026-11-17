import { useCallback, useState, type MutableRefObject } from 'react';
import { harTekst, t, type Kapitel, type Sted } from '../../content';
import { antalBlade, bladFundet, missionFor, missionStartet, missionStatus } from '../../engine/frivillig';
import type { GemtSpil } from '../../data/gem';
import type { Gentagelse } from './dialog';

type Args = {
  kapitel: Kapitel;
  sted: Sted;
  udflugt: string | null;
  spilRef: MutableRefObject<GemtSpil>;
  opdater: (s: GemtSpil) => void;
  setUdflugt: (id: string | null) => void;
  setHjaelp: (hjaelp: boolean) => void;
  setGentagelse: (g: Gentagelse) => void;
  nytSkaar: (skaar: string) => void;
};

/**
 * Frivillige ting på stedet: sidemissionen, bladene og indgangen til en udflugt.
 * Delt ud af Verden.tsx 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function useFrivillig({ kapitel, sted, udflugt, spilRef, opdater, setUdflugt, setHjaelp, setGentagelse, nytSkaar }: Args) {
  /** Sidemissionens opgave til sidst (Halvsangens sang). */
  const [missionOpgave, setMissionOpgave] = useState<string | null>(null);
  const [bladBesked, setBladBesked] = useState<string | null>(null);
  const skjulBlad = useCallback(() => setBladBesked(null), []);

  function frivilligHandling(id: string) {
    const o = sted.objekter.find((x) => x.id === id);
    if (!o) return;
    if (o.frivillig === 'udflugt' && o.udflugt) {
      const u = kapitel.steder[o.udflugt]?.udflugt;
      if (!u) return;
      setGentagelse({
        replikker: u.ind,
        valg: { spoergsmaal: u.spoergsmaal, muligheder: [{ tekst: u.ja, replikker: [] }, { tekst: u.nej, replikker: [] }] },
        efter: (m) => {
          if (m?.tekst === u.ja) {
            setHjaelp(false);
            setUdflugt(o.udflugt!);
          }
        },
      });
      return;
    }
    const mf = missionFor(kapitel, id);
    if (!mf) return;
    const { id: mid, mission } = mf;
    const s = spilRef.current;
    const status = missionStatus(s, mid, mission);
    if (o.frivillig === 'blad') {
      if (status !== 'samler' || s.valg[bladFundet(id)] === 'ja') return;
      const nyt: GemtSpil = { ...s, valg: { ...s.valg, [bladFundet(id)]: 'ja' } };
      spilRef.current = nyt;
      opdater(nyt);
      const egen = `mission.blad.${mid}`;
      setBladBesked(t(harTekst(egen) ? egen : 'mission.blad', { antal: antalBlade(nyt, mission), ialt: mission.blade.length }));
      return;
    }
    if (status === 'ny') {
      const nyt: GemtSpil = { ...s, valg: { ...s.valg, [missionStartet(mid)]: 'ja' } };
      spilRef.current = nyt;
      opdater(nyt);
      // Uden blade at samle kommer opgaven lige efter samtalen (Rimfods sætning).
      setGentagelse({ replikker: mission.start, efter: mission.blade.length === 0 ? () => setMissionOpgave(mid) : undefined });
    } else if (status === 'samler') setGentagelse({ replikker: mission.mangler });
    else if (status === 'klar') setGentagelse({ replikker: mission.klar, efter: () => setMissionOpgave(mid) });
    else setGentagelse({ replikker: mission.efter });
  }

  /** Udflugten er klaret: skåret (første gang), en kort dialog, og så tilbage. */
  function udflugtKlaret() {
    const u = udflugt ? kapitel.steder[udflugt]?.udflugt : undefined;
    if (!u) return;
    const foerste = !spilRef.current.skaar.includes(u.skaar);
    setGentagelse({
      replikker: foerste ? u.faerdig : u.igen,
      efter: () => {
        setUdflugt(null);
        setHjaelp(false);
        if (foerste) nytSkaar(u.skaar);
      },
    });
  }

  return { frivilligHandling, udflugtKlaret, missionOpgave, setMissionOpgave, bladBesked, skjulBlad };
}
