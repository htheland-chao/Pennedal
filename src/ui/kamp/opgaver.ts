/**
 * Opgaverne i kampen: en ny opgave til et væsen, og reglen med et eksempel til feedback.
 * Delt ud af KampVindue.tsx 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { fortaellersaetninger, halvData, korrekturData, rimord, stumme, synonymer, t, type TekstId } from '../../content';
import { lavHalvsaetningOpgave } from '../../mechanics/halvsaetning';
import { lavEkkoOpgave, lavStummingOpgave, lavTomordOpgave, lavTvivlOpgave, type KampOpgave, type VaesenId } from '../../mechanics/kamp';
import { lavKrusedulleOpgave, type FejlType } from '../../mechanics/korrektur';

/** Ord, der er brugt i denne session, så de ikke kommer igen med det samme. */
const brugt: Record<VaesenId, string[]> = { tomordet: [], stumming: [], ekko: [], tvivl: [], krusedulle: [], halvsaetning: [], blaekling: [] };
/** Halvsætningerne skifter mellem en slutning og et sætningstegn. */
let halvNr = 0;
export function nyOpgave(vaesen: VaesenId, niveau: number): KampOpgave {
  const o =
    vaesen === 'tomordet'
      ? lavTomordOpgave(synonymer.ord, niveau, Math.random, brugt.tomordet)
      : vaesen === 'ekko'
        ? lavEkkoOpgave(rimord.rim, niveau, Math.random, brugt.ekko)
        : vaesen === 'tvivl'
          ? lavTvivlOpgave(fortaellersaetninger.fortsaet, niveau, Math.random, brugt.tvivl)
          : vaesen === 'krusedulle'
            ? lavKrusedulleOpgave(korrekturData.tekster, niveau, Math.random, brugt.krusedulle)
            : vaesen === 'halvsaetning'
              ? lavHalvsaetningOpgave(halvData, halvNr++, niveau, Math.random, brugt.halvsaetning)
            : lavStummingOpgave(stumme.ord, niveau, Math.random, brugt.stumming);
  brugt[vaesen].push(o.id);
  if (brugt[vaesen].length > 8) brugt[vaesen].shift();
  return o;
}

export function regelFor(o: KampOpgave): { regel: string; eksempel: string } {
  if (o.vaesen === 'tomordet') return { regel: t('kamp.tomordet.regel'), eksempel: t('kamp.tomordet.eksempel') };
  if (o.vaesen === 'ekko') return { regel: t('rim.regel'), eksempel: t('rim.eksempel') };
  if (o.vaesen === 'tvivl') return { regel: t('fortaeller.regel'), eksempel: t('fortaeller.eksempel') };
  if (o.vaesen === 'halvsaetning') {
    const type = o.fejlType === 'tegn' ? 'tegn' : 'slut';
    return { regel: halvData.regler[type], eksempel: halvData.eksempler[type] };
  }
  if (o.vaesen === 'krusedulle') {
    const type = (o.fejlType ?? 'stumme') as FejlType;
    return { regel: korrekturData.regler[type], eksempel: korrekturData.eksempler[type] };
  }
  const andre = stumme.ord
    .filter((x) => x.type === o.type && x.ord !== o.ord && x.svaerhed === 1)
    .slice(0, 3)
    .map((x) => x.ord)
    .join(', ');
  return { regel: stumme.regler[o.type ?? 'd'], eksempel: t('kamp.stumming.eksempel', { ord: andre }) };
}

/** Nøglen til en tekst om et væsen, fx kamp.ekko.rigtig. */
export const k = (o: KampOpgave, del: string) => `kamp.${o.vaesen}.${del}` as TekstId;
