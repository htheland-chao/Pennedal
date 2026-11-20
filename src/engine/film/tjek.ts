/**
 * Tjek af en filmsekvens (20. november 2026), før den kommer i spillet. Fanger stavefejl i navne og regler, der
 * skal holde: tekst har aldrig fast tid (krav 5), billederne varer højst 30 sekunder i alt, og zoom er hele trin.
 * Ren logik. Bruges af testene, der læser alle kapitler.
 */
import { billedtid } from './afspiller';
import { HANDLINGER, STILLE, type Handling } from './typer';

/** Det, en sekvens må henvise til. */
export type Kendte = { figurer: ReadonlySet<string>; temaer: ReadonlySet<string>; effekter: ReadonlySet<string> };

/** Højst så længe må billederne i én sekvens vare (ms). Dialogen tæller ikke med, den styrer eleven. */
export const MAKS_BILLEDTID = 30_000;
/** Højst så længe må én enkelt handling vare (ms). */
export const MAKS_HANDLING = 6_000;

export function tjekFilm(handlinger: Handling[], kendte: Kendte): string[] {
  const fejl: string[] = [];
  const tid = (navn: string, ms: number | undefined) => {
    if (ms !== undefined && (ms < 0 || ms > MAKS_HANDLING)) fejl.push(`${navn}: ${ms} ms er uden for 0-${MAKS_HANDLING}`);
  };
  const figur = (id: string) => {
    if (id !== 'spiller' && !kendte.figurer.has(id)) fejl.push(`ukendt figur: ${id}`);
  };
  const en = (h: Handling) => {
    if (!HANDLINGER.includes(h.type)) {
      fejl.push(`ukendt handling: ${String(h.type)}`);
      return;
    }
    switch (h.type) {
      case 'vent':
        tid('vent', h.ms);
        break;
      case 'samtidig':
        if (h.handlinger.length === 0) fejl.push('samtidig uden handlinger');
        if (h.handlinger.filter((x) => x.type === 'replikker').length > 1) fejl.push('to dialoger på én gang');
        h.handlinger.forEach(en);
        break;
      case 'kamera':
        tid('kamera', h.ms);
        if (h.zoom !== undefined && ![1, 2].includes(h.zoom)) fejl.push(`zoom skal være et helt trin (1 eller 2), ikke ${h.zoom}`);
        if ('figur' in h.til) figur(h.til.figur);
        break;
      case 'figur':
        figur(h.id);
        if (!h.gaaTil && !h.vend && !h.toner) fejl.push(`figur ${h.id} gør ingenting`);
        if (h.gaaTil && h.id !== 'spiller') fejl.push(`kun hovedpersonen kan gå, ikke ${h.id}`);
        if (h.vend && h.id === 'aeseloere') fejl.push('Æseløre kan ikke vende sig, han følger hovedpersonen');
        break;
      case 'replikker':
        if (h.replikker.length === 0) fejl.push('replikker uden replikker');
        if (h.replikker.some((r) => 'ms' in r)) fejl.push('en replik må ikke have fast tid (krav 5)');
        break;
      case 'ton':
        tid('ton', h.ms);
        break;
      case 'ryst':
        tid('ryst', h.ms);
        break;
      case 'musik':
        if (h.tema !== null && h.tema !== STILLE && !kendte.temaer.has(h.tema)) fejl.push(`ukendt musik: ${h.tema}`);
        tid('overtoning', h.overtoning);
        break;
      case 'lyd':
        if (!kendte.effekter.has(h.effekt)) fejl.push(`ukendt lyd: ${h.effekt}`);
        break;
      case 'stemning':
        if (h.moerke === undefined && h.partikler === undefined) fejl.push('stemning gør ingenting');
        break;
      case 'saet':
        if (!h.valg) fejl.push('saet uden valg');
        break;
    }
  };
  handlinger.forEach(en);
  const ms = billedtid(handlinger);
  if (ms > MAKS_BILLEDTID) fejl.push(`billederne varer ${ms} ms, højst ${MAKS_BILLEDTID}`);
  return fejl;
}
