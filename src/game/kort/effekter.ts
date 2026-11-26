import Phaser from 'phaser';
import type { KortScene } from '../KortScene';
import { FASTE_FORMER, PIL_HOEJDE } from './figurer';
import { aktivtObjekt } from './gang';
import { talerPunkt } from './kameraet';
import { byggGloed } from './lys';
import { FELT, feltMidte } from '../kort';
import { hvileTilstand } from '../pixel/liv';
import { spilEffekt } from '../../lyd/effekter';

/**
 * Små animationer på stedet: figurer der toner frem og væk, Æseløres fremkomst, Klattens blækstribe, broen der samler sig, og figurer der blinker, trækker vejret og taler.
 * Delt ud af KortScene.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
/**
 * Æseløres fremkomst (Henrik, 8. november 2026): han ligger foldet i skuffen, folder sig ud i et lysglimt
 * med papirstumper og flagrer i en bue op til hovedpersonen. Med reduceret bevægelse dukker han bare op.
 */
export function fuglFremkomst(s: KortScene) {
  const f = s.fugl;
  const kilde = s.data_.sted.objekter.find((o) => o.id === s.data_.aktiv && o.felt);
  const sx = kilde?.felt ? kilde.felt[0] * FELT + FELT / 2 : s.spiller.x + 20;
  const sy = kilde?.felt ? kilde.felt[1] * FELT + FELT / 2 : s.spiller.y - 10;
  if (s.roligt) {
    f.setVisible(true);
    return;
  }
  s.fuglAnim = true;
  const top = 9000;
  f.setVisible(true).setPosition(sx, sy).setScale(0.15).setAngle(-200).setAlpha(0).setDepth(top).setDisplayOrigin(8, 10);
  // Et glimt af lys og en ring, der vokser.
  const glimt = s.add
    .circle(sx, sy - 4, 4, 0xffe9a8, 0.9)
    .setDepth(top - 1)
    .setBlendMode(Phaser.BlendModes.ADD);
  s.tweens.add({ targets: glimt, radius: 26, alpha: 0, duration: 700, ease: 'Cubic.Out', onComplete: () => glimt.destroy() });
  const ring = s.add
    .circle(sx, sy - 4, 6)
    .setStrokeStyle(1, 0xf0c45a)
    .setDepth(top - 1);
  s.tweens.add({ targets: ring, scale: 5, alpha: 0, duration: 900, ease: 'Sine.Out', onComplete: () => ring.destroy() });
  // Papirstumper, der hvirvler ud og daler.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const stump = s.add.rectangle(sx, sy - 4, 2, 2, i % 3 === 0 ? 0xf0c45a : 0xf4efe0).setDepth(top - 1);
    s.tweens.add({
      targets: stump,
      x: sx + Math.cos(a) * (14 + (i % 4) * 6),
      y: sy - 4 + Math.sin(a) * (10 + (i % 3) * 5) + 14,
      angle: 360 + i * 30,
      alpha: 0,
      duration: 900 + (i % 5) * 120,
      ease: 'Quad.Out',
      onComplete: () => stump.destroy(),
    });
  }
  // Han folder sig ud.
  s.tweens.add({
    targets: f,
    scale: 1,
    angle: 0,
    alpha: 1,
    y: sy - 10,
    duration: 650,
    ease: 'Back.Out',
    onComplete: () => {
      // En filmsekvens kan have stoppet fremkomsten ("Spring over").
      if (!s.fuglAnim) return;
      // Og flagrer i en bue op til hovedpersonen.
      const fra = { x: f.x, y: f.y };
      const bue = { t: 0 };
      s.tweens.add({
        targets: bue,
        t: 1,
        duration: 1100,
        ease: 'Sine.InOut',
        onUpdate: () => {
          if (!s.fuglAnim) return;
          const til = { x: s.spiller.x - 14, y: s.spiller.y + 4 };
          const kx = (fra.x + til.x) / 2;
          const ky = Math.min(fra.y, til.y) - 34;
          const t = bue.t;
          const x = (1 - t) * (1 - t) * fra.x + 2 * (1 - t) * t * kx + t * t * til.x;
          const y = (1 - t) * (1 - t) * fra.y + 2 * (1 - t) * t * ky + t * t * til.y + Math.sin(t * Math.PI * 6) * 2;
          f.setFlipX(x < f.x)
            .setPosition(x, y)
            .setDepth(top);
        },
        onComplete: () => {
          s.fuglAnim = false;
          f.setDepth(f.y);
        },
      });
    },
  });
}

/** Klatten flygter (idélisten): små blækklatter bliver liggende i en stribe efter ham og tørrer langsomt ud. */
export function blaekStribe(s: KortScene, x: number, y: number) {
  for (let i = 0; i < 9; i++)
    s.time.delayedCall(i * 70, () => {
      const klat = s.add
        .rectangle(Math.round(x + i * 8 + (i % 2) * 2), Math.round(y - 1 - (i % 3)), i % 3 === 0 ? 3 : 2, 2, 0x1b1b24)
        .setDepth(-99970)
        .setAlpha(0.9);
      s.tweens.add({ targets: klat, alpha: 0, delay: 2200, duration: 1800, onComplete: () => klat.destroy() });
    });
}

/**
 * Viser og skjuler objekter. animer (13. november 2026, idélisten): figurer toner frem og væk i stedet for at
 * blinke. Den Ufærdige toner langsomt frem i mørket, og Klatten flygter med en stribe blæk efter sig.
 */
export function visOgSkjul(s: KortScene, skjulte: string[], animer = true) {
  const fuglFoer = s.fugl?.scene ? s.fugl.visible : true;
  s.data_ = { ...s.data_, skjulte };
  const fuglNu = !skjulte.includes('aeseloere');
  if (s.fugl?.scene) {
    if (!fuglFoer && fuglNu) fuglFremkomst(s);
    else s.fugl.setVisible(fuglNu);
  }
  s.faste.clear();
  for (const o of s.data_.sted.objekter) {
    const skjult = skjulte.includes(o.id);
    for (const b of s.objektBilleder.get(o.id) ?? []) {
      if (!animer || s.roligt || b.visible === !skjult) {
        b.setVisible(!skjult);
        // Står broen allerede, er de løse planker i vandet blevet til den.
        if (o.form === 'broplanker' && !skjult) for (const p of s.planker) p.setVisible(false);
        continue;
      }
      s.tweens.killTweensOf(b);
      if (!skjult && o.form === 'broplanker') {
        // Broen samler sig planke for planke (idélisten): hver planke flyder op fra vandet og lægger sig på plads.
        // De løse planker i vandet forsvinder samtidig, for det er dem, der bliver til broen.
        const i = (b.getData('planke') as number) ?? 0;
        const y0 = b.getData('y0') as number;
        b.setVisible(true)
          .setAlpha(0)
          .setY(y0 + 10);
        s.tweens.add({ targets: b, alpha: 1, y: y0, delay: 300 + i * 160, duration: 380, ease: 'Back.Out' });
        if (i === 0) {
          for (const p of s.planker) s.tweens.add({ targets: p, alpha: 0, duration: 600, onComplete: () => p.setVisible(false).setAlpha(1) });
          spilEffekt('skaar');
        }
      } else if (!skjult) {
        b.setVisible(true).setAlpha(0);
        s.tweens.add({ targets: b, alpha: 1, duration: o.form === 'ufaerdige' ? 1800 : 500, ease: 'Sine.InOut' });
      } else if (o.form === 'gnom') {
        const x0 = b.x;
        blaekStribe(s, b.x, b.y);
        s.tweens.add({
          targets: b,
          x: x0 + 70,
          alpha: 0,
          duration: 750,
          ease: 'Quad.In',
          onComplete: () => b.setVisible(false).setAlpha(1).setX(x0),
        });
      } else s.tweens.add({ targets: b, alpha: 0, duration: 400, onComplete: () => b.setVisible(false).setAlpha(1) });
    }
    if (!skjult && o.felt && FASTE_FORMER.has(o.form)) s.faste.add(`${o.felt[0]},${o.felt[1]}`);
  }
  s.lyskilder = s.data_.sted.objekter
    .filter((o) => o.lys && o.felt && !skjulte.includes(o.id))
    .map((o) => {
      const m = feltMidte(o.felt!);
      return { x: m.x + 7, y: m.y - 12, billede: s.objektlys };
    });
  byggGloed(s);
}

/** Vand og planker, den der taler, levende figurer, taleboblerne og pilen over det, man skal undersøge. */
export function opdaterFigurer(s: KortScene) {
  // Vand og planker.
  const vandNoegle = `px-vand-${s.data_.sted.tema}-${Math.floor(s.ur * 2.5) % 3}`;
  if (s.vand.texture.key !== vandNoegle) s.vand.setTexture(vandNoegle);
  s.planker.forEach((p, i) => p.setY((p.getData('y0') as number) + (Math.sin(s.ur * 1.6 + i * 2) > 0.3 ? 1 : 0)));

  // Den, der taler, vipper lidt op og ned, og en lille taleboble står over hovedet.
  const tp = s.taler ? talerPunkt(s) : null;
  for (const billeder of s.objektBilleder.values()) {
    const hoved = billeder.find((b) => b.getData('y0') !== undefined);
    if (!hoved) continue;
    const taler = tp?.billede === hoved;
    const hop = taler && !s.roligt ? (Math.sin(s.ur * 9) > 0.2 ? 1 : 0) : 0;
    hoved.setY((hoved.getData('y0') as number) - hop);
  }
  // Levende figurer blinker og trækker vejret. Den, der taler, vipper i stedet.
  for (const l of s.levende) {
    const taler = tp?.billede === l.billede;
    const t = taler ? 'staa' : hvileTilstand(s.ur, l.fase, s.roligt);
    const n = t === 'staa' ? l.noegle : `${l.noegle}-${t}`;
    l.billede.setTexture(s.textures.exists(n) ? n : l.noegle);
  }
  if (tp && !s.roligt) {
    // Boblen står over billedets øverste kant. Æseløre svæver over sin plads, så hans fodpunkt kan ikke bruges.
    const b = tp.billede;
    const top = b ? b.y - b.displayOriginY * b.scaleY : tp.y - 24;
    s.boble.setVisible(true).setPosition(Math.round(tp.x), Math.round(top - 2));
  } else s.boble.setVisible(false);

  // Byens folk snakker uden pause (taleboblerne blinker skiftevis).
  if (!s.roligt)
    for (const b of s.snakkebobler) {
      const skjult = (s.data_.skjulte ?? []).includes(b.getData('id') as string) || !!s.taler;
      b.setVisible(!skjult && Math.sin(s.ur * 2.2 + (b.getData('snak') as number)) > 0.1);
    }

  // Pil over det, eleven skal undersøge.
  const aktiv = aktivtObjekt(s);
  if (aktiv?.felt && !s.laast && !s.taler) {
    const m = feltMidte(aktiv.felt);
    const hoejde = PIL_HOEJDE[aktiv.form] ?? 6;
    s.pil.setVisible(true).setPosition(m.x, m.y - hoejde - 2 - (Math.sin(s.ur * 5) > 0 ? 1 : 0));
  } else s.pil.setVisible(false);
}
