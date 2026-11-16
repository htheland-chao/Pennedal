import Phaser from 'phaser';
import type { KortScene } from '../KortScene';
import { VIS_B, VIS_H, SKALA } from './skala';
import { FELT } from '../kort';
import { vindueslys } from '../pixel/inde';
import { type Farve, VARMT, lavLys, lysBredde } from '../pixel/lerred';

/**
 * Lyset om natten og indendørs: faste lys, glød om lygterne, fyrtårnets blafren og lyslaget, der ganges på billedet.
 * Delt ud af KortScene.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
/** Lys indendørs: morgensol gennem vinduerne, en lampe på disken og lys fra trappen op. */
export function lavFaesteLys(s: KortScene) {
  const k = s.kort;
  const morgensol: Farve = [255, 252, 240];
  const sol = vindueslys(s.tone, morgensol);
  const lampe = lavLys(40, 0.7, s.tone, [255, 246, 222], SKALA);
  const trappelys = lavLys(34, 0.8, s.tone, VARMT, SKALA);
  for (let ty = 0; ty < k.hoejde; ty++)
    for (let tx = 0; tx < k.bredde; tx++) {
      const c = k.tegn(tx, ty);
      if (c === 'v' && ty === 0 && k.tegn(tx - 1, ty) !== 'v') s.faesteLys.push({ x: tx * FELT + 30, y: 2 * FELT + 48, billede: sol });
      else if (c === 'D' && k.tegn(tx + 1, ty) !== 'D') s.faesteLys.push({ x: tx * FELT, y: ty * FELT, billede: lampe });
      else if (c === 'U' && k.tegn(tx, ty - 1) !== 'U') s.faesteLys.push({ x: tx * FELT + 8, y: ty * FELT + 8, billede: trappelys });
    }
}

/**
 * Glød (fin grafik, 10. november 2026): et blødt, varmt skær om lanterner, lamper og fyrtårnet, som får lyset til
 * at stråle ud over kanten. Tegnes af grafikkortet (ADD), så det koster næsten intet. Kun med fin grafik.
 */
export function byggGloed(s: KortScene) {
  for (const g of s.gloed) g.destroy();
  s.gloed = [];
  if (SKALA < 2) return;
  if (!s.textures.exists('px-gloed')) {
    const n = 64;
    const c = s.textures.createCanvas('px-gloed', n, n)!;
    const ctx = c.context;
    const grad = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    grad.addColorStop(0, 'rgba(255, 226, 160, 1)');
    grad.addColorStop(0.25, 'rgba(255, 205, 130, 0.55)');
    grad.addColorStop(0.6, 'rgba(255, 180, 110, 0.15)');
    grad.addColorStop(1, 'rgba(255, 170, 100, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, n, n);
    c.refresh();
  }
  const styrke = s.data_.mindreUhygge ? 0.3 : 0.4;
  const lav = (x: number, y: number, r: number, a = styrke) =>
    s.add
      .image(x, y, 'px-gloed')
      .setDisplaySize(r * 2, r * 2)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(a)
      .setDepth(1_000_001);
  for (const l of s.fyrLamper) {
    const g = lav(l.x, l.y, 26, styrke + 0.15).setData('a0', styrke + 0.15);
    s.gloed.push(g);
    s.fyrGloed.push(g);
  }
  for (const l of s.faesteLys) s.gloed.push(lav(l.x, l.y, lysBredde(l.billede) * 0.35));
  for (const l of s.lyskilder) s.gloed.push(lav(l.x, l.y, 22));
  if (!s.lygteGloed?.scene && s.lygte) s.lygteGloed = lav(0, 0, 16, styrke * 0.8);
}

/** Hvor kraftigt fyrtårnets lys lyser lige nu (0-1). Blafrer, når det tænder, og står så. */
export function fyrStyrke(s: KortScene): number {
  if (s.fyrStart === null) return 1;
  const t = s.ur - s.fyrStart;
  // Mørkt, så tre blaf, der bliver længere, og til sidst lyset.
  const trin: [number, number][] = [
    [0.5, 0],
    [0.62, 0.55],
    [0.8, 0.05],
    [1.0, 0.75],
    [1.15, 0.2],
    [1.5, 0.9],
    [1.6, 0.45],
  ];
  for (const [til, styrke] of trin) if (t < til) return styrke;
  s.fyrStart = null;
  return 1;
}

/** Tegner lyslaget forfra, men kun når noget har flyttet sig (det sparer meget på langsomme computere). */
export function tegnLyslag(s: KortScene, vx: number, vy: number, z: number) {
  const fyrRamme = Math.floor(s.ur * 1.2) % 2;
  const fyr = fyrStyrke(s);
  for (const g of s.fyrGloed) g.setAlpha((g.getData('a0') as number) * fyr);
  const noegle = `${Math.round(vx * z)},${Math.round(vy * z)},${z.toFixed(3)},${Math.round(s.spiller.x)},${Math.round(s.spiller.y)},${fyrRamme},${fyr},${s.lyskilder.length},${s.data_.mindreUhygge}`;
  if (noegle === s.sidsteLys) return;
  s.sidsteLys = noegle;
  const ctx = s.lysTekstur.context;
  const tone = s.tone;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgb(${tone[0]}, ${tone[1]}, ${tone[2]})`;
  ctx.fillRect(0, 0, VIS_B * SKALA, VIS_H * SKALA);
  // "lighten": hvor to lys mødes, vinder det stærkeste, i stedet for at det sidste dækker.
  ctx.globalCompositeOperation = 'lighten';
  // Lyslaget dækker det, kameraet ser. Med zoom er hver verdenspixel z * SKALA pixel i laget.
  ctx.imageSmoothingEnabled = SKALA > 1;
  const k = z * SKALA;
  const tegnLys = (x: number, y: number, c: HTMLCanvasElement) => {
    const b = lysBredde(c);
    const h = (c.height / c.width) * b;
    ctx.drawImage(c, Math.round((x - vx - b / 2) * k), Math.round((y - vy - h / 2) * k), Math.round(b * k), Math.round(h * k));
  };
  ctx.globalAlpha = fyr;
  for (const l of s.fyrLamper) tegnLys(l.x, l.y, s.fyrlys[fyrRamme]);
  ctx.globalAlpha = 1;
  for (const l of s.faesteLys) tegnLys(l.x, l.y, l.billede);
  for (const l of s.lyskilder) tegnLys(l.x, l.y, l.billede);
  if (s.lygte) tegnLys(s.spiller.x, s.spiller.y - 12, s.lygte);
  // Vignetten ganges på til sidst, så kanterne er lidt mørkere, også hvor der er lys.
  if (s.vignet) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(s.vignet, 0, 0);
  }
  ctx.globalCompositeOperation = 'source-over';
  s.lysTekstur.refresh();
}
