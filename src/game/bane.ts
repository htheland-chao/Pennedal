/**
 * Platformbaner set fra siden. Ren logik uden Phaser, så den kan testes.
 *
 * Tegn i banen (src/content/kapitler/*.json, feltet "bane" på et sted), 16 x 16 pixel pr. felt:
 *   .  luft                       #  tag eller mur (fast)
 *   =  planke, man kan hoppe op igennem nedefra
 *   ^  blækpyt: rører man den, starter man ved sidste checkpoint (ingen død)
 *   S  start                      C  checkpoint (en lanterne)
 *   M  målet                      K  hvor Klatten starter (han løber foran)
 *   ~  vand under byen (som blæk: tilbage til checkpoint)
 *   v  visket planke: kan ikke bære, før ordet er skrevet tilbage ved ordstenen foran (Viskeskoven)
 *   O  ordsten: et rigtigt synonym skriver den næste gruppe viskede planker tilbage
 */
export const BFELT = 16;

/** Fysikken. Den bestemmer også, hvor langt og højt man kan hoppe (se kanKlares). */
export const FYSIK = {
  tyngde: 900,
  hop: 300,
  fart: 95,
  /** Man kan stadig hoppe så længe efter, man er gået ud over en kant. */
  coyote: 0.1,
  /** Et tryk på hop lige før landing tæller. */
  hopBuffer: 0.12,
};

/** Hvor mange felter man sikkert kan hoppe: vandret over et hul og lodret op. Lidt under det fysikken kan. */
export const MAKS_SPRING = { vandret: 3, op: 2 };

export type Bane = {
  bredde: number;
  hoejde: number;
  tegn: (x: number, y: number) => string;
};

export function laesBane(raekker: string[]): Bane {
  const bredde = Math.max(...raekker.map((r) => r.length));
  const hoejde = raekker.length;
  return {
    bredde,
    hoejde,
    tegn: (x, y) => (x < 0 || x >= bredde ? '#' : y < 0 ? '.' : y >= hoejde ? '~' : (raekker[y][x] ?? '.')),
  };
}

export const erFast = (c: string) => c === '#';
export const erPlanke = (c: string) => c === '=';
export const erFare = (c: string) => c === '^' || c === '~';
export const erVisket = (c: string) => c === 'v';
/** Kan man stå på feltet ovenfra? */
export const kanStaa = (c: string) => erFast(c) || erPlanke(c);

export function find(bane: Bane, c: string): [number, number][] {
  const ud: [number, number][] = [];
  for (let y = 0; y < bane.hoejde; y++) for (let x = 0; x < bane.bredde; x++) if (bane.tegn(x, y) === c) ud.push([x, y]);
  return ud;
}

/** Felter, man kan stå på: luft (eller start/checkpoint/mål) med noget fast eller en planke lige under. */
export function standpladser(bane: Bane): Set<string> {
  const ud = new Set<string>();
  for (let y = 0; y < bane.hoejde; y++)
    for (let x = 0; x < bane.bredde; x++) {
      const c = bane.tegn(x, y);
      if (kanStaa(c) || erFare(c)) continue;
      if (kanStaa(bane.tegn(x, y + 1))) ud.add(`${x},${y}`);
    }
  return ud;
}

/**
 * Kan banen klares fra start til mål med de spring, MAKS_SPRING tillader?
 * Bredde først over standpladserne: gå til naboen, falde ned eller hoppe over et hul.
 * Returnerer de checkpoints og mål, der ikke kan nås (tom liste = banen kan klares).
 */
export function kanKlares(bane0: Bane): string[] {
  // Viskede planker tæller som planker: eleven kan altid skrive dem tilbage ved ordstenen.
  const bane: Bane = { ...bane0, tegn: (x, y) => (erVisket(bane0.tegn(x, y)) ? '=' : bane0.tegn(x, y)) };
  const steder = standpladser(bane);
  const [start] = find(bane, 'S');
  if (!start) return ['S mangler'];
  const naaet = new Set<string>();
  const koe: [number, number][] = [start];
  naaet.add(`${start[0]},${start[1]}`);
  // Find den standplads, man lander på, hvis man falder lodret ned fra (x, y).
  const fald = (x: number, y: number): [number, number] | null => {
    for (let yy = y; yy < bane.hoejde; yy++) {
      const c = bane.tegn(x, yy);
      if (kanStaa(c) && !erPlanke(c)) return null;
      if (erFare(c)) return null;
      if (steder.has(`${x},${yy}`)) return [x, yy];
    }
    return null;
  };
  while (koe.length) {
    const [x, y] = koe.shift()!;
    const muligheder: [number, number][] = [];
    for (let dx = -MAKS_SPRING.vandret - 1; dx <= MAKS_SPRING.vandret + 1; dx++)
      for (let dy = -MAKS_SPRING.op; dy <= bane.hoejde; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (!steder.has(`${nx},${ny}`)) continue;
        // Til siden og op: højst MAKS_SPRING. Ned: man kan falde langt, men kun lidt til siden pr. felt.
        if (dy < 0 && Math.abs(dx) > MAKS_SPRING.vandret) continue;
        // Loftet må ikke være lavt lige over startfeltet, når man hopper.
        if (dy < 0 && erFast(bane.tegn(x, y - 1))) continue;
        muligheder.push([nx, ny]);
      }
    const f1 = fald(x - 1, y);
    const f2 = fald(x + 1, y);
    if (f1) muligheder.push(f1);
    if (f2) muligheder.push(f2);
    for (const [nx, ny] of muligheder) {
      const k = `${nx},${ny}`;
      if (naaet.has(k)) continue;
      naaet.add(k);
      koe.push([nx, ny]);
    }
  }
  const mangler: string[] = [];
  for (const c of ['C', 'M'])
    for (const [x, y] of find(bane, c)) if (!naaet.has(`${x},${y}`)) mangler.push(`${c} (${x}, ${y})`);
  return mangler;
}

/**
 * Grupper af viskede planker, sorteret fra venstre. Ordsten nummer i (fra venstre) skriver gruppe i tilbage.
 * En gruppe er viskede planker, der hænger sammen vandret eller lodret.
 */
export function viskedeGrupper(bane: Bane): [number, number][][] {
  const set = new Set(find(bane, 'v').map(([x, y]) => `${x},${y}`));
  const grupper: [number, number][][] = [];
  for (const start of find(bane, 'v')) {
    const k0 = `${start[0]},${start[1]}`;
    if (!set.has(k0)) continue;
    set.delete(k0);
    const g: [number, number][] = [start];
    for (let i = 0; i < g.length; i++)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${g[i][0] + dx},${g[i][1] + dy}`;
        if (set.has(k)) {
          set.delete(k);
          g.push([g[i][0] + dx, g[i][1] + dy]);
        }
      }
    grupper.push(g);
  }
  return grupper.sort((a, b) => Math.min(...a.map((p) => p[0])) - Math.min(...b.map((p) => p[0])));
}
