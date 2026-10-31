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

/**
 * Til test: som spilVed, men leder i alle kapitler. Kapitlerne før er spillet færdige,
 * så ting fra tidligere kapitler (fx Klattens kappe) også er låst op.
 */
export function spilVedIKapitler(kapitler: Kapitel[], maal: string, start: GemtSpil): GemtSpil | null {
  let spil = start;
  for (const k of [...kapitler].sort((a, b) => a.kapitel - b.kapitel)) {
    const her = spilVed(k, maal, { ...spil, kapitel: k.kapitel, trin: 0, trinFremskridt: 0 });
    if (her) return her;
    let s = { ...spil, kapitel: k.kapitel, trin: 0, trinFremskridt: 0 };
    while (!kapitelSlut(s, k)) s = afslutTrin(s, k);
    spil = s;
  }
  return null;
}

/** Det næste kapitel efter det, eleven er i, hvis det findes. */
export function naesteKapitel(kapitler: Kapitel[], nr: number): Kapitel | undefined {
  return kapitler.find((k) => k.kapitel === nr + 1);
}
