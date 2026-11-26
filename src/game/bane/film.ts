import type Phaser from 'phaser';
import type { BaneScene } from '../BaneScene';
import { lagHandling, lagRyd, roligBevaegelse, tonFigur, type PhaserHandling } from '../filmlag';

/**
 * Phaser-arbejderen til filmsekvenser på en platformbane (26. november 2026), fx mørket over tagene i kapitel 2.
 * Banen kan: ton, ryst, blink, mørke og figurer, der toner frem eller væk. Kameraet følger hovedpersonen, og
 * ingen går eller vender sig. Det tjekker testen i src/engine/film/kapitler.test.ts.
 */

/** Figurer, der er tonet væk i filmen. De kommer tilbage i oprydningen (undtagen dem, stedet selv skjuler). */
const vaekFor = new WeakMap<BaneScene, Set<string>>();

function billeder(s: BaneScene, id: string): Phaser.GameObjects.Image[] {
  const b = id === 'spiller' ? s.spiller : id === 'aeseloere' ? s.fugl : id === 'klatten' ? s.klatten : s.figurer.get(id);
  return b?.scene ? [b] : [];
}

export function baneStart(s: BaneScene) {
  vaekFor.set(s, new Set());
  s.laas(true);
}

export function baneUdfoer(s: BaneScene, h: PhaserHandling, slut = false): Promise<void> {
  if (!vaekFor.has(s)) return Promise.resolve();
  const mild = !!s.data_.mindreUhygge;
  if (h.type === 'kamera' || (h.type === 'figur' && (h.gaaTil || h.vend))) {
    console.warn(`Filmen: platformbanen kan ikke ${h.type === 'kamera' ? 'flytte kameraet' : 'flytte figurer'}`);
    return Promise.resolve();
  }
  if (h.type === 'figur' && h.toner) {
    const bs = billeder(s, h.id);
    if (bs.length === 0) console.warn(`Filmen: figuren ${h.id} findes ikke på banen`);
    const frem = h.toner === 'frem';
    vaekFor.get(s)![frem ? 'delete' : 'add'](h.id);
    return tonFigur(s, bs, frem, slut || roligBevaegelse());
  }
  return lagHandling(s, h, mild, slut);
}

export function baneSlut(s: BaneScene, h: PhaserHandling) {
  void baneUdfoer(s, h, true);
}

export function baneOprydning(s: BaneScene) {
  const vaek = vaekFor.get(s);
  if (!vaek) return;
  lagRyd(s);
  const skjulte = s.data_.skjulte ?? [];
  for (const id of vaek) if (!skjulte.includes(id)) for (const b of billeder(s, id)) b.setVisible(true).setAlpha(1);
  vaekFor.delete(s);
  s.laas(false);
}
