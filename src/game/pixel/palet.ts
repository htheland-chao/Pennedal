/**
 * Masterpaletten (Henrik valgte forslag B, 19. november 2026): alle farver, pixelgrafikken må bruge.
 * Alle farver fra docs/grafik.md, de otte tøjfarver, de otte hudfarver og den blonde hårfarve fra
 * avatardesigneren, en mørk lilla (Skyggen) og en varm lys grå (papirskygge), og resten fyldt op med de
 * farver, figurerne brugte mest. 64 farver i alt.
 * Grafikarkets test (src/ark/tjek.test.ts) fejler, hvis en figur bruger en farve, der ikke står her.
 *
 * Ny farve? Tilføj den kun, hvis ingen af disse kan bruges, og skriv den også i docs/grafik.md.
 */

export const PALET = {
  // Blæk, papir og grå (15)
  graa: ['#070912', '#1b1b24', '#222222', '#3a2a20', '#4f4a57', '#5d5243', '#5b5663', '#716b60', '#7a7468', '#8a8a8a', '#a7aab8', '#b9bfcf', '#d9d2bd', '#f3ead2', '#f4efe0'],
  // Rødt og lyserødt (6)
  roed: ['#7a2e1f', '#8e3428', '#a83b33', '#c0392b', '#c0503e', '#e595a9'],
  // Brunt, hud og orange (15)
  brun: ['#4a2b1b', '#4a3426', '#6b3f27', '#6b4a2b', '#7a4e33', '#8a5536', '#8a5a3a', '#8a7656', '#a96e48', '#a99068', '#c98d63', '#e67e22', '#e0a982', '#eec1a0', '#f6d7c3'],
  // Guld og gult (6)
  gul: ['#c4ab7c', '#d9b56f', '#e5c03a', '#f0c45a', '#e0c995', '#ffe9a8'],
  // Grønt (9)
  groen: ['#24503a', '#2a5a40', '#2f6448', '#356c4d', '#3d7a57', '#2e8b57', '#468a60', '#4f9467', '#5aa572'],
  // Blåt (9)
  blaa: ['#1a1e36', '#2a2f48', '#203a6b', '#28467c', '#245c99', '#2c6fbb', '#4f6fa8', '#698fc1', '#c9dcf2'],
  // Lilla (4)
  lilla: ['#3a3560', '#603979', '#7b4bb3', '#6a6487'],
} as const;

export const ALLE_FARVER: readonly string[] = Object.values(PALET).flat();
const I_PALETTEN = new Set(ALLE_FARVER);

export function iPaletten(hex: string): boolean {
  return I_PALETTEN.has(hex.toLowerCase());
}

// Farver sammenlignes i OKLab, hvor afstand svarer til, hvor forskellige øjet ser farverne.
type Lab = [number, number, number];

function tilLab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = lin((n >> 16) & 255);
  const g = lin((n >> 8) & 255);
  const b = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const LAB = ALLE_FARVER.map((f) => ({ f, lab: tilLab(f) }));
const afstand = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function naermesteAf(hex: string, valg: typeof LAB): string {
  const lab = tilLab(hex);
  let bedst = valg[0];
  for (const v of valg) if (afstand(v.lab, lab) < afstand(bedst.lab, lab)) bedst = v;
  return bedst.f;
}

/** Den farve i paletten, der ligner hex mest. */
export function naermesteFarve(hex: string): string {
  return naermesteAf(hex, LAB);
}

/**
 * Den farve i paletten, der ligner maal mest, men er mørkere (retning -1) eller lysere (retning 1) end fra.
 * Bruges til skygger og lys kanter, så en skygge aldrig bliver den samme farve som stoffet.
 * Findes ingen mørkere eller lysere farve, bruges den nærmeste.
 */
export function trin(fra: string, maal: string, retning: -1 | 1): string {
  const L = tilLab(naermesteFarve(fra))[0];
  const valg = LAB.filter((v) => (retning < 0 ? v.lab[0] < L - 0.01 : v.lab[0] > L + 0.01));
  return naermesteAf(maal, valg.length ? valg : LAB);
}
