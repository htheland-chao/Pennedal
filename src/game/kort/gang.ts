import Phaser from 'phaser';
import type { KortScene } from '../KortScene';
import { VIS_B, VIS_H, SKALA } from './skala';
import { FART, NAER, PIL_HOEJDE } from './figurer';
import { type StedObjekt } from '../../content';
import { type Felt, feltMidte, feltVed, felterVed, findVej } from '../kort';
import { spilEffekt } from '../../ui/effekter';

/**
 * Hovedpersonen går: tastatur, klik, stifinding, hvad man står ved, E-hintet og Æseløre, der følger efter.
 * Delt ud af KortScene.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function aktivtObjekt(s: KortScene): StedObjekt | undefined {
  return s.data_.sted.objekter.find((o) => o.id === s.data_.aktiv);
}

/** Det, man kan undersøge lige nu: det aktive objekt eller alt i et escape room. */
export function kanUndersoeges(s: KortScene): StedObjekt[] {
  const ids = s.data_.aktive?.length ? s.data_.aktive : s.data_.aktiv ? [s.data_.aktiv] : [];
  return s.data_.sted.objekter.filter((o) => ids.includes(o.id) && !(s.data_.skjulte ?? []).includes(o.id));
}

/** Går hen ved siden af objektet ad den korteste vej og undersøger det, når hovedpersonen er fremme. */
export function gaaTilObjekt(s: KortScene, id: string) {
  const o = s.data_.sted.objekter.find((x) => x.id === id);
  if (!o?.felt || !s.spiller) return;
  const fra = feltVed(s.spiller.x, s.spiller.y - 2);
  const muligheder = [...(s.erFast(o.felt[0], o.felt[1]) ? [] : [o.felt]), ...felterVed(s.kort, o.felt, (x, y) => s.erFast(x, y))];
  let bedst: Felt[] | null = null;
  for (const m of muligheder) {
    if (m[0] === fra[0] && m[1] === fra[1]) {
      bedst = [];
      break;
    }
    const v = findVej(s.kort, fra, m, (x, y) => s.erFast(x, y));
    if (v && (!bedst || v.length < bedst.length)) bedst = v;
  }
  if (!bedst) return;
  s.vej = bedst;
  s.gaarTilTaler = false;
  s.interagerVedMaal = true;
  s.maalObjekt = id;
  if (bedst.length === 0) ankommet(s);
}

export function saetVej(s: KortScene, til: Felt, interager: boolean) {
  const fra = feltVed(s.spiller.x, s.spiller.y - 2);
  const v = findVej(s.kort, fra, til, (x, y) => s.erFast(x, y));
  if (!v) return;
  s.vej = v;
  s.gaarTilTaler = false;
  s.interagerVedMaal = interager;
  s.maalObjekt = null;
}

export function ankommet(s: KortScene) {
  const interager = s.interagerVedMaal;
  const maal = s.maalObjekt;
  s.interagerVedMaal = false;
  s.maalObjekt = null;
  opdaterNaer(s);
  if (!interager) return;
  // Står hovedpersonen ved den ting, der blev klikket på, er det den, der undersøges, også hvis en anden er lige så tæt på.
  const valgt = kanUndersoeges(s).find((o) => o.id === maal && o.felt);
  if (valgt?.felt) {
    const m = feltMidte(valgt.felt);
    if (Phaser.Math.Distance.Between(s.spiller.x, s.spiller.y, m.x, m.y) < NAER + 0.01) {
      s.kroge?.onInteraktion(valgt.id);
      return;
    }
  }
  if (s.naer) s.kroge?.onInteraktion(s.naer);
}

export function kollision(s: KortScene, x: number, y: number): boolean {
  for (const [dx, dy] of [
    [-5, -3],
    [5, -3],
    [-5, 1],
    [5, 1],
  ]) {
    const [tx, ty] = feltVed(x + dx, y + dy);
    if (s.erFast(tx, ty)) return true;
  }
  return false;
}

export function opdaterNaer(s: KortScene, tving = false) {
  let ny: string | null = null;
  let bedst = NAER + 0.01;
  if (s.spiller)
    for (const o of kanUndersoeges(s)) {
      if (!o.felt) continue;
      const m = feltMidte(o.felt);
      const d = Phaser.Math.Distance.Between(s.spiller.x, s.spiller.y, m.x, m.y);
      if (d < bedst) {
        bedst = d;
        ny = o.id;
      }
    }
  if (ny !== s.naer || tving) {
    s.naer = ny;
    s.kroge?.onNaer(ny);
  }
}

/** Hvor E-hintet skal stå: over det, eleven kan undersøge, i procent af spilfladen. */
export function sendHint(s: KortScene) {
  let pos: { x: number; y: number } | null = null;
  const o = s.naer && !s.laast && !s.taler ? s.data_.sted.objekter.find((x) => x.id === s.naer) : undefined;
  if (o?.felt) {
    const m = feltMidte(o.felt);
    const h = PIL_HOEJDE[o.form] ?? 6;
    const cam = s.cameras.main;
    const sx = (m.x - cam.worldView.x) * cam.zoom;
    const sy = (m.y - h - 4 - cam.worldView.y) * cam.zoom;
    pos = { x: Math.round((sx / (VIS_B * SKALA)) * 1000) / 10, y: Math.round((sy / (VIS_H * SKALA)) * 1000) / 10 };
  }
  const noegle = pos ? `${pos.x},${pos.y}` : '';
  if (noegle === s.sidsteHint) return;
  s.sidsteHint = noegle;
  s.kroge?.onHint?.(pos);
}

/** Tastatur, klik og dialogen flytter hovedpersonen. Svarer sand, når hovedpersonen går. */
export function gaaSkridt(s: KortScene, dt: number): boolean {
  let gaar = false;
  if (!s.laast) {
    const t = s.taster;
    let dx = 0;
    let dy = 0;
    if (t) {
      if (t.venstre.isDown || t.a.isDown) dx -= 1;
      if (t.hoejre.isDown || t.d.isDown) dx += 1;
      if (t.op.isDown || t.w.isDown) dy -= 1;
      if (t.ned.isDown || t.s.isDown) dy += 1;
    }
    const skridt = FART * dt;
    if (dx !== 0 || dy !== 0) {
      s.vej = [];
      s.interagerVedMaal = false;
      const l = Math.hypot(dx, dy);
      const nx = s.spiller.x + (dx / l) * skridt;
      const ny = s.spiller.y + (dy / l) * skridt;
      if (!kollision(s, nx, s.spiller.y)) s.spiller.x = nx;
      if (!kollision(s, s.spiller.x, ny)) s.spiller.y = ny;
      s.retning = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'hoejre' : 'venstre') : dy > 0 ? 'ned' : 'op';
      gaar = true;
    } else if (s.vej.length > 0) {
      const m = feltMidte(s.vej[0]);
      const ax = m.x - s.spiller.x;
      const ay = m.y - s.spiller.y;
      const l = Math.hypot(ax, ay);
      if (l > 0.01) s.retning = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'hoejre' : 'venstre') : ay > 0 ? 'ned' : 'op';
      if (l <= skridt) {
        s.spiller.setPosition(m.x, m.y);
        s.vej.shift();
        if (s.vej.length === 0) ankommet(s);
      } else {
        s.spiller.x += (ax / l) * skridt;
        s.spiller.y += (ay / l) * skridt;
      }
      gaar = true;
    }
    if (gaar) spilEffekt('skridt');
    // E undersøger. Enter og mellemrum virker også, så tastaturbrugere ikke skal lære noget nyt.
    if (t && s.naer && (Phaser.Input.Keyboard.JustDown(t.e) || Phaser.Input.Keyboard.JustDown(t.enter) || Phaser.Input.Keyboard.JustDown(t.mellemrum))) {
      s.kroge?.onInteraktion(s.naer);
    }
  } else if (s.gaarTilTaler && s.vej.length > 0) {
    // Under dialog går hovedpersonen selv hen til den, der taler.
    const skridt = FART * dt;
    const m = feltMidte(s.vej[0]);
    const ax = m.x - s.spiller.x;
    const ay = m.y - s.spiller.y;
    const l = Math.hypot(ax, ay);
    if (l > 0.01) s.retning = Math.abs(ax) > Math.abs(ay) ? (ax > 0 ? 'hoejre' : 'venstre') : ay > 0 ? 'ned' : 'op';
    if (l <= skridt) {
      s.spiller.setPosition(m.x, m.y);
      s.vej.shift();
      if (s.vej.length === 0) s.gaarTilTaler = false;
    } else {
      s.spiller.x += (ax / l) * skridt;
      s.spiller.y += (ay / l) * skridt;
    }
    gaar = true;
  }
  return gaar;
}

/** Æseløre flyver efter hovedpersonen, og står stille ved siden af, når han selv taler. */
export function fuglFoelger(s: KortScene, dt: number) {
  // Når Æseløre taler, vender hovedpersonen sig mod ham. Hvis han så fulgte retningen, ville han flyve om
  // på den anden side, hovedpersonen ville vende sig igen, og han ville flakke frem og tilbage. Derfor står
  // han stille ved siden af hovedpersonen, så længe han taler, og kigger på hovedpersonen.
  let fx: number;
  let fy: number;
  if (s.taler === 'aeseloere') {
    if (s.fuglSide === null) {
      // Den side, han er på i forvejen, medmindre der står træer eller en væg. Så den anden side.
      const side = s.fugl.x < s.spiller.x ? -1 : 1;
      const [tx, ty] = feltVed(s.spiller.x + side * 18, s.spiller.y - 2);
      // Han svæver lidt over jorden, så feltet over tæller også (ellers gemmer han sig bag trækronerne).
      s.fuglSide = s.erFast(tx, ty) || s.erFast(tx, ty - 1) ? -side : side;
    }
    fx = s.spiller.x + s.fuglSide * 18;
    fy = s.spiller.y + 2;
  } else {
    s.fuglSide = null;
    const [rx, ry] = { op: [0, -1], ned: [0, 1], venstre: [-1, 0], hoejre: [1, 0] }[s.retning];
    fx = s.spiller.x - rx * 16 + (ry ? -12 : 0);
    fy = s.spiller.y - ry * 10 + 2;
  }
  if (!s.fuglAnim) {
    const k = 1 - Math.pow(0.04, dt);
    const gammelX = s.fugl.x;
    s.fugl.x += (fx - s.fugl.x) * k;
    s.fugl.y += (fy - s.fugl.y) * k;
    if (s.fuglSide !== null) s.fugl.setFlipX(s.fuglSide > 0);
    else if (Math.abs(s.fugl.x - gammelX) > 0.3) s.fugl.setFlipX(s.fugl.x < gammelX);
    const svaev = Math.sin(s.ur * 4) * 2;
    s.fugl.setDepth(s.fugl.y).setDisplayOrigin(8, 10 + 18 - svaev);
  }
}
