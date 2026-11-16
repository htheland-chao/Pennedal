/**
 * Pixelgrafikken tegnes i 320 x 180. Spillets lærred skifter til den størrelse, når et sted har kort,
 * og browseren forstørrer det med skarpe pixel. Det er 9 gange færre pixel at tegne end 960 x 540.
 */
export const VIS_B = 320;
export const VIS_H = 180;
/**
 * Skarp zoom (9. november 2026): kameraet zoomer kun i hele trin (1 eller 2) og klipper i stedet for at glide.
 * Før gled zoomen fx gennem 1,37 i 320 x 180, så pixlerne "flød". Et forsøg med 4 gange så stor intern
 * opløsning gav skarpe kvarte trin, men kostede for meget (5 i stedet for 42 billeder pr. sekund i testbrowseren).
 */
/**
 * Intern opløsning (Henrik, 10. november 2026: "gå med det pæneste"). 1 = 320 x 180, 2 = 640 x 360 (fin grafik:
 * blødt lys i fuld opløsning). PhaserVerden sætter den med brugSkala, før spillet startes, og scenerne læser den,
 * når de bygges. ?skala=1, 2, 3 eller 4 i adressen vinder altid (til måling).
 */
export let SKALA = 1;
export function brugSkala(n: number) {
  SKALA = n;
}
export function skalaFraAdresse(): number | null {
  if (typeof location === 'undefined') return null;
  const n = Number(new URLSearchParams(location.search).get('skala'));
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}
/** Zoomen rundet ned til et helt trin, så hver verdenspixel er et helt antal skærmpixel, og begge figurer stadig kan ses. */
export const skarpZoom = (z: number) => Math.max(1, Math.floor(z + 1e-6));
