import type { Historie, Traek } from '../content';
import { bland, vaelg } from '../engine/tilfaeldig';
import type { Niveau } from '../engine/tilpasning';

export const ALLE_TRAEK: Traek[] = ['problem', 'portal', 'verden', 'konflikt', 'loesning', 'hjemkomst'];
const LET_TRAEK: Traek[] = ['problem', 'portal', 'loesning', 'hjemkomst'];

export type PlankeId = Traek | 'fremmed';
export type Planke = { id: PlankeId; tekst: string };

export type Bro = {
  historie: Historie;
  planker: Planke[];
  /** Den rigtige rækkefølge. */
  facit: Traek[];
  visEtiketter: boolean;
  medFremmed: boolean;
};

export type BroResultat =
  | { ok: true }
  | { ok: false; fejl: 'fjernet'; id: PlankeId }
  | { ok: false; fejl: 'fremmed' }
  | { ok: false; fejl: 'placering'; nr: number; traek: Traek };

export function lavBro(historier: Historie[], niveau: Niveau, tal: () => number, brugt: string[] = []): Bro {
  const ubrugte = historier.filter((h) => !brugt.includes(h.id));
  const historie = vaelg(ubrugte.length > 0 ? ubrugte : historier, tal);
  const facit = niveau === 1 ? LET_TRAEK : ALLE_TRAEK;
  const medFremmed = niveau >= 4;
  const planker: Planke[] = facit.map((id) => ({ id, tekst: historie.planker[id] }));
  if (medFremmed) planker.push({ id: 'fremmed', tekst: historie.fremmed });
  let blandet = bland(planker, tal);
  // Undgå at broen allerede ligger rigtigt fra start.
  for (let i = 0; i < 10 && blandet.every((p, j) => p.id === facit[j]); i++) blandet = bland(planker, tal);
  return { historie, planker: blandet, facit, visEtiketter: niveau <= 2, medFremmed };
}

export function tjekBro(bro: Bro, paaBroen: PlankeId[], tilSide: PlankeId[]): BroResultat {
  const forkertFjernet = tilSide.find((id) => id !== 'fremmed');
  if (forkertFjernet) return { ok: false, fejl: 'fjernet', id: forkertFjernet };
  if (paaBroen.includes('fremmed')) return { ok: false, fejl: 'fremmed' };
  for (let i = 0; i < bro.facit.length; i++) {
    if (paaBroen[i] !== bro.facit[i]) return { ok: false, fejl: 'placering', nr: i + 1, traek: bro.facit[i] };
  }
  return { ok: true };
}
