import type { Kapitel, Trin } from '../content';
import type { GemtSpil } from './gem';

export function aktueltTrin(spil: GemtSpil, kapitel: Kapitel): Trin | undefined {
  return kapitel.trin[spil.trin];
}

export function kapitelSlut(spil: GemtSpil, kapitel: Kapitel): boolean {
  return spil.trin >= kapitel.trin.length;
}

/** Det sted, eleven er lige nu. Når kapitlet er slut, er det sidste trins sted. */
export function aktueltSted(spil: GemtSpil, kapitel: Kapitel): string {
  const t = kapitel.trin[Math.min(spil.trin, kapitel.trin.length - 1)];
  return kapitelSlut(spil, kapitel) && t.tilSted ? t.tilSted : t.sted;
}

/** Afslutter det aktuelle trin og går videre. Låser ting op, hvis trinnet gør det. */
export function afslutTrin(spil: GemtSpil, kapitel: Kapitel): GemtSpil {
  const t = kapitel.trin[spil.trin];
  if (!t) return spil;
  const laasteOp = [...spil.laasteOp];
  for (const id of t.laaserOp ?? []) if (!laasteOp.includes(id)) laasteOp.push(id);
  return { ...spil, trin: spil.trin + 1, trinFremskridt: 0, laasteOp };
}
