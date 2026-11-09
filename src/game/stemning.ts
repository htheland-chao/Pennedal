/**
 * Liv i luften og stemning pr. sted (Henrik, 9. november 2026): ildfluer om natten, papirblade, der daler,
 * fnug i Viskeskoven, pollen i byen og støv indendørs. Små partikler, få af dem, så Chromebooken kan følge med.
 * Ren logik uden Phaser: hvilke partikler et sted har, og hvordan de bevæger sig.
 */
export type PartikelArt = 'ildflue' | 'blad' | 'fnug' | 'pollen' | 'stoev' | 'regn';

/** Hvilke partikler et tema har, og hvor mange der er på skærmen ad gangen. */
export function partiklerFor(tema: string): { art: PartikelArt; antal: number }[] {
  switch (tema) {
    case 'pennedal':
      return [
        { art: 'ildflue', antal: 14 },
        { art: 'blad', antal: 6 },
      ];
    case 'floden':
    case 'fyrtaarn':
      return [{ art: 'ildflue', antal: 16 }];
    case 'viskeskov':
      // Fnug og en tynd, hvid regn (Henrik, 9. november 2026). Tågebankerne tegnes for sig (KortScene).
      return [
        { art: 'fnug', antal: 12 },
        { art: 'regn', antal: 16 },
      ];
    case 'rimbjerg':
      // Sne, der driver i vinden (Rimbjerget, kapitel 4).
      return [{ art: 'fnug', antal: 24 }];
    case 'eng':
      return [
        { art: 'pollen', antal: 18 },
        { art: 'blad', antal: 4 },
      ];
    case 'torv':
    case 'smoeger':
      return [{ art: 'pollen', antal: 12 }];
    case 'bibliotek':
    case 'kaelder':
    case 'trykkeri':
      return [{ art: 'stoev', antal: 18 }];
    case 'blaeksoe':
      // Blæksøen om aftenen: ildfluer over det sorte vand.
      return [{ art: 'ildflue', antal: 14 }];
    case 'hytte':
      return [{ art: 'stoev', antal: 10 }];
    case 'arkiv':
      // Fodnoternes kælder (kapitel 5): mere støv, gamle papirer.
      return [{ art: 'stoev', antal: 26 }];
    default:
      return [];
  }
}

export type Partikel = { art: PartikelArt; x: number; y: number; fase: number };

/** Hvor partiklen er efter tiden ur, og hvor synlig den er (0-1). Bevægelsen er langsom og blød. */
export function partikelTrin(p: Partikel, dt: number, ur: number): { dx: number; dy: number; alpha: number; ramme: 0 | 1 } {
  const f = p.fase;
  switch (p.art) {
    case 'ildflue': {
      // Svæver i små buer og gløder langsomt op og ned (aldrig hurtigt blink).
      const dx = Math.sin(ur * 0.9 + f * 6) * 7 * dt;
      const dy = Math.cos(ur * 0.7 + f * 9) * 5 * dt;
      const alpha = 0.25 + 0.75 * Math.max(0, Math.sin(ur * 0.8 + f * 20));
      return { dx, dy, alpha, ramme: 0 };
    }
    case 'blad':
      // Daler skråt og vender sig.
      return { dx: (-6 + Math.sin(ur * 1.3 + f * 7) * 8) * dt, dy: (7 + Math.sin(ur * 2 + f) * 3) * dt, alpha: 1, ramme: Math.sin(ur * 2.6 + f * 11) > 0 ? 0 : 1 };
    case 'fnug':
      // Falder blidt og vugger fra side til side.
      return { dx: Math.sin(ur * 1.1 + f * 8) * 6 * dt, dy: (5 + f * 4) * dt, alpha: 0.7 + 0.3 * Math.sin(ur + f * 5), ramme: f > 0.6 ? 1 : 0 };
    case 'pollen':
      // Stiger langsomt og glimter svagt.
      return { dx: Math.sin(ur * 0.8 + f * 9) * 4 * dt, dy: -(2 + f * 2) * dt, alpha: 0.4 + 0.6 * Math.max(0, Math.sin(ur * 1.2 + f * 13)), ramme: 0 };
    case 'regn':
      // Tynde, hvide streger, der falder skråt og roligt. De glimter ikke.
      return { dx: -14 * dt, dy: (62 + f * 18) * dt, alpha: 0.5, ramme: 0 };
    case 'stoev':
      // Næsten stillestående støv, der driver.
      return { dx: Math.sin(ur * 0.4 + f * 7) * 2 * dt, dy: Math.cos(ur * 0.3 + f * 5) * 1.5 * dt, alpha: 0.35 + 0.4 * Math.max(0, Math.sin(ur * 0.6 + f * 17)), ramme: 0 };
  }
}

/** Holder en position inden for kameraets udsnit plus en margen: går den ud på den ene side, kommer den ind på den anden. */
export function indenfor(v: number, start: number, laengde: number, margen = 6): number {
  const a = start - margen;
  const l = laengde + margen * 2;
  return a + ((((v - a) % l) + l) % l);
}

/**
 * Farvetone pr. sted om dagen (Henrik, 9. november 2026): hvert sted sin stemning.
 * Tonen ganges på billedet, så den skal være lys. null: brug lysets standard.
 */
export function stedTone(tema: string, mindreUhygge: boolean): [number, number, number] | null {
  switch (tema) {
    case 'viskeskov':
      return mindreUhygge ? [236, 244, 242] : [222, 236, 234];
    case 'torv':
      return [255, 240, 212];
    case 'rimbjerg':
      return [228, 236, 250];
    case 'eng':
      return [255, 250, 224];
    case 'smoeger':
      return [234, 230, 242];
    case 'hytte':
      return [255, 236, 210];
    default:
      return null;
  }
}

/**
 * Vignet: kanterne af billedet bliver lidt mørkere, så blikket samles på midten. Styrken 0-1 er, hvor mørkt
 * hjørnerne højst bliver. Tre trin med Bayer-dither, så den passer til pixelgrafikken. Mørkere i kælderen og om natten.
 */
export function vignetStyrke(tema: string, mindreUhygge: boolean): number {
  const s = tema === 'kaelder' || tema === 'trykkeri' || tema === 'arkiv' ? 0.32 : tema === 'pennedal' || tema === 'floden' || tema === 'fyrtaarn' ? 0.26 : 0.18;
  return mindreUhygge ? s * 0.5 : s;
}
