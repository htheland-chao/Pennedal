/**
 * Skovbunden udendørs (prøve i Pennedal-skoven, derefter alle udendørs steder undtagen Rimbjerget, Halvelande og Sidste side, 20. november 2026): roligt græs med store, bløde pletter og
 * håndtegnede strå, sten, tuer, stubbe og blomster fra Ninja Adventure (CC0, se LICENSER.md)
 * i stedet for tilfældige enkelte pixel. Tegnes én gang ind i jorden, så det koster intet, mens man spiller.
 */
import { hash, hx } from './grundlag';
import { FELT, type Kort } from '../../kort';
import type { Tegnkort } from '../sprites';
import { SKOVBUND_TING, STRAA_MAERKER } from '../laant/ninja-skovbund';

type RGB = [number, number, number];
const GRAES = { grund: hx('#3d7a57'), lys: hx('#468a60'), moerk: hx('#356c4d') };
const SKOV = { grund: hx('#2f6448'), moerk: hx('#2a5a40') };

/** Grøn med bløde pletter: én farve inde i en plet og en kant med ternet overgang. */
export function skovbundFarve(X: number, Y: number, skov: boolean, plet: number): RGB {
  const tern = (X + Y) % 2 === 0;
  if (skov) return plet < 0.3 || (plet < 0.34 && tern) ? SKOV.moerk : SKOV.grund;
  if (plet > 0.7 || (plet > 0.66 && tern)) return GRAES.lys;
  if (plet < 0.28 || (plet < 0.32 && tern)) return GRAES.moerk;
  return GRAES.grund;
}

function stempl(p: Uint8ClampedArray, W: number, H: number, x0: number, y0: number, k: Tegnkort) {
  k.raekker.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) {
      const f = k.palet[r[x]];
      if (!f) continue;
      const X = x0 + x;
      const Y = y0 + y;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const c = hx(f);
      const o = (Y * W + X) * 4;
      p[o] = c[0];
      p[o + 1] = c[1];
      p[o + 2] = c[2];
    }
  });
}

/** Hvor ofte hver ting vælges: tuer oftest, så blomster og sten, stub og busk sjældent. */
const VAEGT = [4, 4, 4, 1, 2, 2, 2, 2, 1, 1];

function vaelgTing(t: number): Tegnkort {
  const sum = VAEGT.reduce((a, b) => a + b, 0);
  let x = t * sum;
  for (let i = 0; i < SKOVBUND_TING.length; i++) {
    x -= VAEGT[i] ?? 1;
    if (x < 0) return SKOVBUND_TING[i];
  }
  return SKOVBUND_TING[0];
}

/** Strå og småting på græsset. Højst én ting pr. felt, og ikke i alle felter. Samme sted giver altid det samme. */
export function pyntSkovbund(p: Uint8ClampedArray, W: number, H: number, kort: Kort) {
  for (let ty = 0; ty < kort.hoejde; ty++)
    for (let tx = 0; tx < kort.bredde; tx++) {
      const c0 = kort.tegn(tx, ty);
      if (c0 !== ',' && c0 !== ';') continue;
      const a = hash(tx * 31 + 5, ty * 17 + 3);
      const b = hash(tx * 13 + 9, ty * 29 + 1);
      let k: Tegnkort | null = null;
      // På engen (;) er der flere blomster: kløver, rød og hvid blomst.
      if (c0 === ';' && a < 0.3) k = SKOVBUND_TING[4 + Math.floor(b * 3)];
      else if (a < 0.4) k = STRAA_MAERKER[Math.floor(b * STRAA_MAERKER.length)];
      else if (a < 0.5) k = vaelgTing(b);
      if (!k) continue;
      const kb = k.raekker[0].length;
      const kh = k.raekker.length;
      const x0 = tx * FELT + Math.floor(hash(tx, ty + 99) * Math.max(1, FELT - kb + 1));
      const y0 = ty * FELT + Math.floor(hash(tx + 99, ty) * Math.max(1, FELT - kh + 1));
      stempl(p, W, H, x0, y0, k);
    }
}
