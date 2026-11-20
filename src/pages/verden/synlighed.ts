import type { Kapitel, Sted } from '../../content';
import { opfyldt } from '../../engine/betingelse';
import { skjulteBlade } from '../../engine/frivillig';
import type { GemtSpil } from '../../data/gem';
import { skjultFoerFilm } from '../../engine/film/sekvens';

/**
 * Hvilke objekter på stedet der er skjult lige nu, også Æseløre.
 * Delt ud af Verden.tsx 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function skjulteObjekter(spil: GemtSpil, kapitel: Kapitel, sted: Sted, aktivtTrinId: string | undefined): string[] {
  // Objekter, der er forsvundet, fordi kapitlet er nået forbi deres skjulFra-trin.
  const vaek = sted.objekter
    .filter((o) => {
      if (o.hvis && !opfyldt(o.hvis, spil)) return true;
      // visFra: skjult, indtil kapitlet når trinnet. skjulFra: væk fra trinnet og frem.
      if (o.visFra) {
        const nr = kapitel.trin.findIndex((t) => t.id === o.visFra);
        if (nr >= 0 && spil.trin < nr) return true;
      }
      if (!o.skjulFra) return false;
      const nr = kapitel.trin.findIndex((t) => t.id === o.skjulFra);
      return nr >= 0 && spil.trin >= nr;
    })
    .map((o) => o.id);
  // Æseløre er skjult, indtil eleven har fundet ham (kapitlets fuglFra-trin).
  const fuglNr = kapitel.fuglFra ? kapitel.trin.findIndex((t) => t.id === kapitel.fuglFra) : -1;
  // Han vises først, når skuffen bliver åbnet (fuglFra-trinnets dialog), ikke allerede når man træder ind i kælderen.
  // Kapitel 7: har eleven ikke tilgivet Æseløre, går han med Den Ufærdige for en stund (fuglVaek).
  const vaekNr = kapitel.fuglVaek ? kapitel.trin.findIndex((t) => t.id === kapitel.fuglVaek!.fra) : -1;
  const fuglVaek = vaekNr >= 0 && spil.trin > vaekNr && opfyldt(kapitel.fuglVaek!.hvis, spil);
  const fuglSkjult = fuglVaek || (fuglNr >= 0 && (spil.trin < fuglNr || (spil.trin === fuglNr && aktivtTrinId !== kapitel.fuglFra)));
  // Sidder Æseløre selv på kortet (kapitel 6, ved søen), følger han ikke efter hovedpersonen imens.
  const fuglPaaKortet = sted.objekter.some((o) => o.form === 'fugl' && o.felt && !vaek.includes(o.id));
  // En filmsekvens: figurer, der toner frem i filmen, er skjult, fra trinnet begynder (20. november 2026).
  const trin = kapitel.trin[spil.trin];
  const film = trin?.type === 'film' ? skjultFoerFilm(trin.handlinger) : [];
  const ud = [...(fuglSkjult || fuglPaaKortet ? [...vaek, 'aeseloere'] : vaek), ...skjulteBlade(spil, kapitel)];
  return [...ud, ...film.filter((id) => !ud.includes(id))];
}
