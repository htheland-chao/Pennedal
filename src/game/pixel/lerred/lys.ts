/**
 * Lys og skygge: grundtonen for hvert sted, lyskilderne og skyggen under figurerne.
 * Delt ud af lerred.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { lysTrin, lerred } from './grundlag';

export type Farve = [number, number, number];

/** Nattens grundtone. Lyset ganges på billedet, så alt bliver blåligt undtagen der, hvor noget lyser. */
export function grundtone(mindreUhygge: boolean): Farve {
  return mindreUhygge ? [205, 210, 238] : [140, 148, 217];
}
export const VARMT: Farve = [255, 250, 219];

/**
 * Lyset på et sted. Grundtonen ganges på hele billedet. Hovedpersonens lygte har radius spillerLys (0 = ingen).
 *   nat:    udendørs om natten (Pennedal, floden, fyrtårnet)
 *   morgen: skolebiblioteket med morgensol gennem vinduerne
 *   moerke: kælderen, hvor kun lygten og lyset fra trappen lyser
 */
export type Belysning = 'nat' | 'morgen' | 'moerke' | 'dag';
/** Byen i kapitel 2 ligger i varmt dagslys. Trykkeriet er mørkt som kælderen. */
export function belysning(tema: string): Belysning {
  if (tema === 'bibliotek' || tema === 'hytte') return 'morgen';
  if (tema === 'kaelder' || tema === 'trykkeri' || tema === 'arkiv') return 'moerke';
  if (tema === 'eng' || tema === 'torv' || tema === 'smoeger' || tema === 'viskeskov' || tema === 'halve' || tema === 'siden') return 'dag';
  return 'nat';
}
export function lysOpsaetning(b: Belysning, mindreUhygge: boolean): { tone: Farve; spillerLys: number } {
  if (b === 'morgen') return { tone: [236, 222, 200], spillerLys: 0 };
  if (b === 'dag') return { tone: [255, 248, 232], spillerLys: 0 };
  if (b === 'moerke') return mindreUhygge ? { tone: [150, 148, 184], spillerLys: 80 } : { tone: [64, 62, 96], spillerLys: 70 };
  return { tone: grundtone(mindreUhygge), spillerLys: 76 };
}

/** En lyskegle i 4 trin med Bayer-dither. Gennemsigtig uden for keglen. */
/**
 * Et lys som et rundt billede. Med opl = 1 er det pixellys i fire trin med dither (320 x 180).
 * Med opl > 1 (fin grafik, 10. november 2026) tegnes lyset i opl gange så høj opløsning med en blød overgang og en
 * varm kerne, så det gløder. Billedets mål i verden er altid 2 * r, og opløsningen står i dataset.opl.
 */
export function lavLys(r: number, styrke: number, tone: Farve, farve: Farve = VARMT, opl = 1): HTMLCanvasElement {
  const n = r * 2 * opl;
  const c = lerred(n, n);
  c.dataset.opl = String(opl);
  const g = c.getContext('2d')!;
  const img = g.createImageData(n, n);
  const p = img.data;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const d = Math.hypot((x + 0.5) / opl - r, ((y + 0.5) / opl - r) * 1.25);
      const raa = Math.max(0, 1 - d / r);
      let s: number;
      if (opl === 1) s = lysTrin(Math.pow(raa, 1.1) * styrke, x, y);
      else {
        // Blød kurve: et bredt skær og en lysere kerne i midten.
        const blod = raa * raa * (3 - 2 * raa);
        s = Math.min(1, (blod * 0.85 + Math.pow(raa, 6) * 0.35) * styrke);
      }
      if (s <= 0) continue;
      const o = (y * n + x) * 4;
      for (let k = 0; k < 3; k++) p[o + k] = tone[k] + s * (farve[k] - tone[k]);
      p[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}

/** Hvor bredt et lysbillede er i verden (et lys i høj opløsning er opl gange så stort i pixel). */
export const lysBredde = (c: HTMLCanvasElement) => c.width / Number(c.dataset.opl ?? 1);

/** Lille skygge under figurer. */
export function lavSkygge(b: number): HTMLCanvasElement {
  const c = lerred(b, 4);
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(20, 30, 25, 0.45)';
  g.fillRect(1, 0, b - 2, 1);
  g.fillRect(0, 1, b, 2);
  g.fillRect(1, 3, b - 2, 1);
  return c;
}
