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

/**
 * Til test: et spil, der står ved et bestemt trin. Maal er et trins id (fx "k1-kaelder")
 * eller et steds id (fx "kaelder", så bruges det første trin på stedet).
 * Trinnene før springes over med afslutTrin, så ting, der låses op undervejs, også er låst op.
 */
export function spilVed(kapitel: Kapitel, maal: string, start: GemtSpil): GemtSpil | null {
  let nr = kapitel.trin.findIndex((t) => t.id === maal);
  if (nr < 0) nr = kapitel.trin.findIndex((t) => t.sted === maal);
  if (nr < 0) return null;
  let spil = start;
  while (spil.trin < nr) spil = afslutTrin(spil, kapitel);
  return spil;
}
