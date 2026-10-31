/**
 * Kort over et sted i felter på 16 x 16 pixel. Ren logik uden Phaser, så den kan testes.
 *
 * Tegn i kortet (src/content/kapitler/*.json, feltet "kort"):
 *   #  skov (kan ikke gås på)      ,  græs
 *   .  sti                         L  bladbunke (sti, hvor man lander)
 *   ~  vand (kan ikke gås på)      M  vand, hvor en af de tre måner spejler sig
 *   p  brostolpe (kan ikke gås på) q  planke, der driver i vandet
 *   F  fyrtårn (kan ikke gås på)
 *
 * Indendørs (kortet har K). Gulvet er '.', i kælderen af sten:
 *   K  mørk ydervæg                V  væg          v  vindue i væggen
 *   W  kældervæg af sten           R  reol ved væggen
 *   r  fritstående reol (to felter høj, tegnes fra det øverste felt)
 *   D  disk                        B  læsebord (2 x 2 felter)
 *   P  plante                      k  trækasse
 *   S  trappe ned                  U  trappe op
 *   d  dør ud                      t  tæppe (kan gås på)
 * Alle indendørs tegn undtagen '.' og 't' kan ikke gås på.
 */
export const FELT = 16;

export type Felt = [number, number];

export type Kort = {
  bredde: number;
  hoejde: number;
  tegn: (x: number, y: number) => string;
};

export function laesKort(raekker: string[]): Kort {
  const bredde = Math.max(...raekker.map((r) => r.length));
  const hoejde = raekker.length;
  return {
    bredde,
    hoejde,
    tegn: (x, y) => (x < 0 || y < 0 || x >= bredde || y >= hoejde ? '#' : (raekker[y][x] ?? '#')),
  };
}

export const erSti = (c: string) => c === '.' || c === 'L';
export const erVand = (c: string) => c === '~' || c === 'M' || c === 'q';
const INDE_FAST = new Set([...'KVvWRrDBPkSUd']);
export const erFastTegn = (c: string) => c === '#' || erVand(c) || c === 'p' || c === 'F' || INDE_FAST.has(c);

/** Feltet, en pixelposition ligger i. */
export const feltVed = (x: number, y: number): Felt => [Math.floor(x / FELT), Math.floor(y / FELT)];

/** Midten af et felt i pixel. Fødderne står lidt under midten. */
export const feltMidte = ([x, y]: Felt): { x: number; y: number } => ({ x: x * FELT + FELT / 2, y: y * FELT + FELT / 2 + 4 });

/**
 * Korteste vej mellem to felter (bredde først, fire retninger).
 * Returnerer felterne efter start til og med målet, eller null, hvis der ikke er nogen vej.
 */
export function findVej(kort: Kort, fra: Felt, til: Felt, fast: (x: number, y: number) => boolean): Felt[] | null {
  const noegle = (x: number, y: number) => y * kort.bredde + x;
  if (fast(til[0], til[1])) return null;
  const forrige = new Map<number, number>();
  const start = noegle(fra[0], fra[1]);
  forrige.set(start, -1);
  const koe: Felt[] = [fra];
  for (let i = 0; i < koe.length; i++) {
    const [x, y] = koe[i];
    if (x === til[0] && y === til[1]) {
      const vej: Felt[] = [];
      let k = noegle(x, y);
      while (k !== start) {
        vej.push([k % kort.bredde, Math.floor(k / kort.bredde)]);
        k = forrige.get(k)!;
      }
      return vej.reverse();
    }
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= kort.bredde || ny >= kort.hoejde) continue;
      const k = noegle(nx, ny);
      if (forrige.has(k) || fast(nx, ny)) continue;
      forrige.set(k, noegle(x, y));
      koe.push([nx, ny]);
    }
  }
  return null;
}

/** Det felt ved siden af et objekt, man skal stå på for at undersøge det. Nærmest først. */
export function felterVed(kort: Kort, felt: Felt, fast: (x: number, y: number) => boolean): Felt[] {
  const ud: Felt[] = [];
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const x = felt[0] + dx;
    const y = felt[1] + dy;
    if (x >= 0 && y >= 0 && x < kort.bredde && y < kort.hoejde && !fast(x, y)) ud.push([x, y]);
  }
  return ud;
}
