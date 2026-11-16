import Phaser from 'phaser';
import type { KortScene } from '../KortScene';
import { VIS_B, VIS_H, SKALA, skarpZoom } from './skala';
import { FELT, type Felt, feltMidte, feltVed, felterVed, findVej } from '../kort';
import { glid } from '../kamera';

/**
 * Kameraet og dialogen: hvor kameraet kigger hen, zoom ind på den der taler, og træer der bliver gennemsigtige foran figurerne.
 * Delt ud af KortScene.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
/**
 * Dialog: kameraet zoomer ind på den, der taler, og hovedpersonen, og de vender sig mod hinanden.
 * Fortælleren og figurer, der ikke er på stedet, zoomer ikke. null zoomer ud igen.
 */
export function vendModTaler(s: KortScene, taler: string | null) {
  const foer = s.taler;
  s.taler = taler;
  s.sidsteLys = '';
  if (!taler) {
    // Stop kun den tur, dialogen selv startede, ikke en tur, eleven lige har sat i gang.
    if (s.gaarTilTaler) s.vej = [];
    s.gaarTilTaler = false;
    return;
  }
  // Står hovedpersonen langt fra den, der taler, går den derhen.
  const o = s.data_.sted.objekter.find((x) => x.id === taler && x.felt && !s.data_.skjulte?.includes(x.id));
  if (o?.felt && foer !== taler) {
    const m = feltMidte(o.felt);
    if (Phaser.Math.Distance.Between(s.spiller.x, s.spiller.y, m.x, m.y) > 34) {
      const fra = feltVed(s.spiller.x, s.spiller.y - 2);
      let bedst: Felt[] | null = null;
      for (const f of felterVed(s.kort, o.felt, (x, y) => s.erFast(x, y))) {
        const v = findVej(s.kort, fra, f, (x, y) => s.erFast(x, y));
        if (v && (!bedst || v.length < bedst.length)) bedst = v;
      }
      if (bedst) {
        s.vej = bedst;
        s.interagerVedMaal = false;
        s.gaarTilTaler = true;
      }
    }
  }
}

/** Zoom under dialog: så tæt på som muligt, men begge skal kunne ses. Hovedpersonen kigger på den, der taler. */
export function opdaterTalerZoom(s: KortScene) {
  if (!s.taler) {
    s.zoomMaal = 1;
    return;
  }
  const p = talerPunkt(s);
  if (!p) {
    s.zoomMaal = 1;
    return;
  }
  const dx = Math.abs(p.x - s.spiller.x);
  const dy = Math.abs(p.y - s.spiller.y);
  s.zoomMaal = Math.max(1, Math.min(2, (VIS_B - 40) / (dx + 60), (VIS_H - 30) / (dy + 70)));
  if (!s.gaarTilTaler && (dx > 2 || dy > 2)) {
    const ax = p.x - s.spiller.x;
    const ay = p.y - s.spiller.y;
    s.retning = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'hoejre' : 'venstre') : ay > 0 ? 'ned' : 'op';
  }
}

/** Hvor den, der taler, står. Æseløre er fuglen, de andre er objekter på stedet med samme id. */
export function talerPunkt(s: KortScene): { x: number; y: number; billede?: Phaser.GameObjects.Image } | null {
  if (!s.taler || s.taler === 'fortaeller') return null;
  if (s.taler === 'aeseloere') return s.fugl.visible ? { x: s.fugl.x, y: s.fugl.y, billede: s.fugl } : null;
  const o = s.data_.sted.objekter.find((x) => x.id === s.taler && x.felt);
  if (!o?.felt || s.data_.skjulte?.includes(o.id)) return null;
  const m = feltMidte(o.felt);
  const billeder = s.objektBilleder.get(o.id) ?? [];
  return { x: m.x, y: m.y, billede: billeder.find((b) => b.getData('y0') !== undefined) };
}

/**
 * Kameraet (rettet 10. november 2026): glidningen regnes efter tid, ikke efter billeder. Før flyttede kameraet 12 %
 * pr. billede, så det på en skærm med 240 billeder pr. sekund nåede frem fire gange så hurtigt og rykkede ved hver
 * vending. Fremadkigget glider nu for sig selv (cirka et halvt sekund), og kameraet følger efter (cirka 0,15 sekund).
 * dt = Infinity sætter kameraet på plads med det samme.
 */
export function flytKamera(s: KortScene, dt: number, fart = 7) {
  const [lx, ly] = { op: [0, -1], ned: [0, 1], venstre: [-1, 0], hoejre: [1, 0] }[s.retning];
  s.fremad.x = glid(s.fremad.x, lx * 18, dt, 2.5);
  s.fremad.y = glid(s.fremad.y, ly * 14, dt, 2.5);
  let mx = s.spiller.x + s.fremad.x;
  let my = s.spiller.y - 10 + s.fremad.y;
  if (s.taler) {
    // Under dialog: midt imellem hovedpersonen og den, der taler.
    const p = talerPunkt(s);
    mx = p ? (s.spiller.x + p.x) / 2 : s.spiller.x;
    // Kameraet sigter lidt under figurerne, så de står over dialogboksen nederst.
    my = (p ? (s.spiller.y + p.y) / 2 : s.spiller.y) + 6;
  }
  s.kam.x = glid(s.kam.x, mx, dt, fart);
  s.kam.y = glid(s.kam.y, my, dt, fart);
  const z = skarpZoom(s.zoom);
  const bw = VIS_B / z;
  const bh = VIS_H / z;
  const W = s.kort.bredde * FELT;
  const H = s.kort.hoejde * FELT;
  const vx = Phaser.Math.Clamp(s.kam.x - bw / 2, 0, Math.max(0, W - bw));
  const vy = Phaser.Math.Clamp(s.kam.y - bh / 2, 0, Math.max(0, H - bh));
  const cam = s.cameras.main;
  cam.setZoom(z * SKALA);
  cam.centerOn(vx + bw / 2, vy + bh / 2);
  return { vx, vy, z };
}

/**
 * Træer, der står foran hovedpersonen, Æseløre eller den, der taler, bliver halvt gennemsigtige,
 * så figurerne altid kan ses (især når kameraet zoomer ind under dialog).
 */
export function gennemsigtigeTraeer(s: KortScene) {
  const figurer: { x: number; y: number }[] = [{ x: s.spiller.x, y: s.spiller.y - 8 }];
  if (s.fugl.visible) figurer.push({ x: s.fugl.x, y: s.fugl.y - 22 });
  const tp = talerPunkt(s);
  if (tp) figurer.push({ x: tp.x, y: tp.y - 8 });
  for (const t of s.traeBilleder) {
    const halv = t.width / 2;
    let foran = false;
    for (const f of figurer)
      if (t.y > f.y + 6 && Math.abs(t.x - f.x) < halv + 3 && t.y - t.height < f.y + 4 && t.y - f.y < t.height + 4) {
        foran = true;
        break;
      }
    const a = foran ? 0.45 : 1;
    if (t.alpha !== a) t.setAlpha(a);
  }
}
