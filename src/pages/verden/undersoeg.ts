import type { Replik, Sted } from '../../content';

type Args = {
  sted: Sted;
  /** Samtaler, man kan høre igen (se samtalerPaaStedet). */
  gentag: Record<string, Replik[]>;
  skjulte: string[];
  /** Objektet for det trin, kapitlet er nået til. */
  trinObjekt: string | null | undefined;
  /** Det objekt, der er opgaven lige nu (eller null). */
  aktivtObjekt: string | null;
  /** Escape room: alle ting i rummet. */
  aktive: string[] | undefined;
  slut: boolean;
  udflugt: boolean;
};

/**
 * Hvad hovedpersonen kan gå hen til og undersøge på stedet lige nu.
 * Delt ud af Verden.tsx 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function hvadKanUndersoeges({ sted, gentag, skjulte, trinObjekt, aktivtObjekt, aktive, slut, udflugt }: Args) {
  const kanGentages = Object.keys(gentag).filter((id) => !skjulte.includes(id) && id !== trinObjekt && sted.objekter.some((o) => o.id === id && o.felt));
  // Frivillige ting på stedet: kan undersøges når som helst, også når kapitlet er slut.
  const frivillige = udflugt ? [] : sted.objekter.filter((o) => o.frivillig && o.felt && !skjulte.includes(o.id)).map((o) => o.id);
  // I et rum kan de frivillige ting (sidemissionen, bladene, udflugten) også undersøges.
  const undersoegbare = aktive
    ? [...aktive, ...frivillige.filter((id) => !aktive.includes(id))]
    : kanGentages.length || frivillige.length
      ? [...(aktivtObjekt && !slut ? [aktivtObjekt] : []), ...(slut ? [] : kanGentages), ...frivillige]
      : undefined;
  return { kanGentages, frivillige, undersoegbare };
}
