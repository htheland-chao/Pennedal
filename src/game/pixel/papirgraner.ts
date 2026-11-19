import type { Tegnkort } from "./sprites";
import { hash } from "./lerred";

/**
 * Papirgraner i fem former (Henrik, 19. november 2026): skoven får variation uden at blande stilarter.
 * Henrik prøvede runde, lånte træer og syntes, de lignede skyer i papirfarverne. Derfor kun vores egne graner.
 *
 * - normal: som papirtrae i sprites.ts (pixel for pixel).
 * - smal: højere og slankere.
 * - bred: lavere og bredere.
 * - knaekket: toppen er knækket af, og en stump af stammen stikker op.
 * - skaev: læner sig lidt til højre.
 */
export const PAPIRGRAN_FORMER = [
  "normal",
  "smal",
  "bred",
  "knaekket",
  "skaev",
] as const;
export type PapirgranForm = (typeof PAPIRGRAN_FORMER)[number];

const FORM: Record<
  PapirgranForm,
  { bredde: number; hoejde: number; laen: number; knaek: boolean }
> = {
  normal: { bredde: 1, hoejde: 1, laen: 0, knaek: false },
  smal: { bredde: 0.72, hoejde: 1.12, laen: 0, knaek: false },
  bred: { bredde: 1.28, hoejde: 0.86, laen: 0, knaek: false },
  knaekket: { bredde: 1, hoejde: 1, laen: 0, knaek: true },
  skaev: { bredde: 1, hoejde: 1, laen: 6, knaek: false },
};

const PALET = {
  B: "#4a3426",
  b: "#3a2a20",
  K: "#2a2f48",
  L: "#f4efe0",
  S: "#b9bfcf",
  l: "#a7aab8",
};

/** En papirgran: stamme og tre lag grene. Lys fra venstre (L), skygge til højre (S), mørk kant (K). */
export function papirgran(
  hoejde: number,
  form: PapirgranForm = "normal",
): Tegnkort {
  const f = FORM[form];
  const h = Math.round(hoejde * f.hoejde);
  const hw = Math.round(hoejde * 0.36 * f.bredde);
  const w = hw * 2 + 1 + f.laen;
  const cx = hw;
  const rk: string[][] = Array.from({ length: h + 6 }, () =>
    Array(w).fill("."),
  );
  const by = h + 5;
  // Hvor meget en række er skubbet til højre (skæve graner læner mere jo højere oppe).
  const skub = (y: number) =>
    y > by - 5 ? 0 : Math.round((f.laen * (by - 5 - y)) / (by - 5));
  const saet = (x: number, y: number, c: string) => {
    const xx = x + skub(y);
    if (y >= 0 && y < rk.length && xx >= 0 && xx < w) rk[y][xx] = c;
  };
  for (let y = by - 5; y <= by; y++)
    for (let x = cx - 1; x <= cx + 1; x++) saet(x, y, x === cx + 1 ? "b" : "B");
  // Knækket gran: øverste lag stopper her.
  const knaekY = by - 4 - Math.round(h * 0.84);
  for (const [bred, top, bund] of [
    [0.36, 0.62, 0.0],
    [0.28, 0.85, 0.36],
    [0.19, 1.0, 0.64],
  ]) {
    const b = by - 4 - Math.round(h * bund);
    const t = by - 4 - Math.round(h * top);
    const ww = Math.round(hoejde * bred * f.bredde);
    for (let y = t; y <= b; y++) {
      if (f.knaek && top === 1.0 && y < knaekY) continue;
      const half = Math.round(((y - t) / Math.max(1, b - t)) * ww);
      for (let x = cx - half; x <= cx + half; x++) {
        const kant =
          x === cx - half ||
          x === cx + half ||
          y === b ||
          (f.knaek && top === 1.0 && y === knaekY);
        saet(x, y, kant ? "K" : x <= cx ? "L" : "S");
      }
    }
    for (let k = 1; k <= 2; k++) {
      const yy = Math.round(b - ((b - t) * k) / 3);
      if (f.knaek && top === 1.0 && yy < knaekY) continue;
      const half = Math.round(((yy - t) / Math.max(1, b - t)) * ww) - 2;
      for (let x = cx - half; x <= cx - 2; x++) saet(x, yy, "l");
    }
  }
  if (f.knaek) {
    // Den knækkede top: toppen mangler, og en stump af stammen stikker op over knækket.
    for (let dy = 1; dy <= 3; dy++) {
      saet(cx, knaekY - dy, "B");
      saet(cx + 1, knaekY - dy, "b");
    }
  }
  return { raekker: rk.map((r) => r.join("")), palet: PALET };
}

/**
 * Vælger en form til et træ ud fra dets plads, så samme sted altid får samme træ.
 * Cirka halvdelen er normale, resten fordeles på de fire andre former.
 */
export function vaelgForm<T>(former: readonly T[], x: number, y: number): T {
  if (former.length === 1) return former[0];
  const v = hash(Math.round(x) * 3 + 1, Math.round(y) * 7 + 2);
  if (v < 0.52) return former[0];
  return former[
    1 +
      Math.min(
        former.length - 2,
        Math.floor(((v - 0.52) / 0.48) * (former.length - 1)),
      )
  ];
}
