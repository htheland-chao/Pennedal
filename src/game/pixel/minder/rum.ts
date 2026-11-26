/**
 * Baggrunde til minderne (26. november 2026): vægge i lampelys, bordplader, gulve og voksdugen.
 */
import { bay } from '../lerred/grundlag';
import { B, H, felt } from './faelles';
import { firkant, lampelys, lysfelt, polygon, traeaarer } from './kit';

/** Varm væg om aftenen, lysest ved lampen. */
export const VAEG_AFTEN = ['#1b1b24', '#3a2a20', '#4a3426', '#5d5243', '#8a7656', '#c4ab7c', '#e0c995'];
/** Bordplade af træ i lampelys. */
export const BORD = ['#3a2a20', '#4a3426', '#6b4a2b', '#8a5a3a', '#a96e48', '#c98d63'];
/** Lys væg om dagen. */
export const VAEG_DAG = ['#8a7656', '#a99068', '#c4ab7c', '#e0c995', '#f3ead2'];
/** Mørkt værelse om natten. */
export const NAT = ['#070912', '#1a1e36', '#2a2f48', '#3a3560'];

/** Væg fra y0 til y1 lyst op af en lampe i (lx, ly). */
export function vaeg(g: CanvasRenderingContext2D, y0: number, y1: number, farver: string[], lx: number, ly: number, r: number) {
  lysfelt(g, firkant(0, y0, B, y1 - y0), farver, lampelys(lx, ly, r));
}

/** Bordplade set forfra fra y0 og ned, lys omkring (lx, ly). Med en lys forkant ved y0. */
export function bordplade(g: CanvasRenderingContext2D, y0: number, lx: number, ly: number, r = 220, farver = BORD) {
  lysfelt(g, firkant(0, y0, B, H - y0), farver, lampelys(lx, ly, r, 1.6));
  traeaarer(g, 0, y0 + 4, B, H - y0 - 4, '#4a3426', 7);
  for (let x = 0; x < B; x++) felt(g, x, y0, 1, 1, '#3a2a20');
  for (let x = 0; x < B; x++) felt(g, x, y0 + 1, 1, 1, x / B < 0.5 ? '#c98d63' : '#a96e48');
}

/** Bordplade set oppefra som baggrund i hele billedet. */
export function bordOppefra(g: CanvasRenderingContext2D, lx: number, ly: number, r = 260, farver = BORD) {
  lysfelt(g, firkant(0, 0, B, H), farver, lampelys(lx, ly, r));
  traeaarer(g, 0, 2, B, H - 2, '#4a3426', 11);
}

/** Gulvbrædder i perspektiv fra y0 og ned mod et forsvindingspunkt over billedet. */
export function gulv(g: CanvasRenderingContext2D, y0: number, farver: string[], lx: number, ly: number, r = 240, vx = B / 2) {
  lysfelt(g, firkant(0, y0, B, H - y0), farver, lampelys(lx, ly, r, 1.4));
  for (let i = -12; i <= 12; i++)
    for (let y = y0 + 1; y < H; y++) {
      const t = (y - y0) / (H - y0);
      const x = Math.round(vx + i * (14 + 26 * t));
      if (x >= 0 && x < B) felt(g, x, y, 1, 1, '#4a3426');
    }
  for (let x = 0; x < B; x++) felt(g, x, y0, 1, 1, '#3a2a20');
}

/** Voksdug med tern i perspektiv fra y0 og ned. */
export function voksdug(g: CanvasRenderingContext2D, y0: number, lx: number, ly: number) {
  for (let y = y0; y < H; y++) {
    const t = (y - y0) / (H - y0);
    const str = 10 + t * 14;
    const ty = Math.floor(Math.sqrt(t) * 9);
    for (let x = 0; x < B; x++) {
      const tx = Math.floor((x - B / 2) / str + 100);
      const roed = (tx + ty) % 2 === 0;
      const l = 1 - Math.hypot(x - lx, (y - ly) * 1.4) / 300 + (bay(x, y) - 0.5) * 0.25;
      felt(g, x, y, 1, 1, roed ? (l > 0.45 ? '#e0a982' : '#c98d63') : l > 0.45 ? '#f3ead2' : '#d9d2bd');
    }
  }
  for (let x = 0; x < B; x++) felt(g, x, y0, 1, 1, '#a96e48');
}

/** En stribe lys hen over et gulv, fra en dørsprække. */
export function lysstribe(g: CanvasRenderingContext2D, pkt: [number, number][], farver = ['#5d5243', '#8a7656', '#c4ab7c', '#e0c995']) {
  const p = polygon(pkt);
  const [x0, , x1] = p.kasse;
  lysfelt(g, p, farver, (x) => 1 - (x - x0) / Math.max(1, x1 - x0));
}
