import type Phaser from 'phaser';
import type { BaneScene } from '../BaneScene';
import { lagHandling, lagRyd, roligBevaegelse, tonFigur, type PhaserHandling } from '../filmlag';

/**
 * Phaser-arbejderen til filmsekvenser på en platformbane (26. november 2026), fx mørket over tagene i kapitel 2.
 * Banen kan: ton, ryst, blink, mørke og figurer, der toner frem eller væk. Kameraet følger hovedpersonen, og
 * ingen går eller vender sig. Det tjekker testen i src/engine/film/kapitler.test.ts.
 * En figur, der toner væk, bliver væk (som på kortet). Hovedpersonen kommer altid frem igen.
 */

/** Banerne, der har en film i gang. */
const igang = new WeakSet<BaneScene>();

function billeder(s: BaneScene, id: string): Phaser.GameObjects.Image[] {
  const b = id === 'spiller' ? s.spiller : id === 'aeseloere' ? s.fugl : id === 'klatten' ? s.klatten : s.figurer.get(id);
  return b?.scene ? [b] : [];
}

export function baneStart(s: BaneScene) {
  igang.add(s);
  s.laas(true);
}

export function baneUdfoer(s: BaneScene, h: PhaserHandling, slut = false): Promise<void> {
  if (!igang.has(s)) return Promise.resolve();
  const mild = !!s.data_.mindreUhygge;
  if (h.type === 'kamera' || (h.type === 'figur' && (h.gaaTil || h.vend))) {
    console.warn(`Filmen: platformbanen kan ikke ${h.type === 'kamera' ? 'flytte kameraet' : 'flytte figurer'}`);
    return Promise.resolve();
  }
  if (h.type === 'figur' && h.toner) {
    const bs = billeder(s, h.id);
    if (bs.length === 0) console.warn(`Filmen: figuren ${h.id} findes ikke på banen`);
    return tonFigur(s, bs, h.toner === 'frem', slut || roligBevaegelse());
  }
  return lagHandling(s, h, mild, slut);
}

export function baneSlut(s: BaneScene, h: PhaserHandling) {
  void baneUdfoer(s, h, true);
}

export function baneOprydning(s: BaneScene) {
  if (!igang.has(s)) return;
  lagRyd(s);
  if (s.spiller?.scene) s.spiller.setVisible(true).setAlpha(1);
  igang.delete(s);
  s.laas(false);
}
