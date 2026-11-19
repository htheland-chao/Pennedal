import Phaser from 'phaser';
import { BFELT, find, laesBane, viskedeGrupper } from '../bane';
import type { BaneScene } from '../BaneScene';
import { SKALA, VIS_B, VIS_H } from '../KortScene';
import { checkpoint, MAAL, NY_PLANKE, tegnArkivBaggrund, tegnBane, tegnBjergBaggrund, tegnByBaggrund, tegnHalvBaggrund, tegnSkovBaggrund, tegnSoeBaggrund, tegnTaage, VARDE } from '../pixel/banetegn';
import { ekkosten } from '../pixel/rimbjerg';
import { GRENPORT, ordsten } from '../pixel/viskeskov';
import { FUGL, KLATTEN, SKYGGE } from '../pixel/sprites';

/**
 * Bygger platformbanen, når scenen starter: teksturer, baggrund, planker, ordsten, lanterner, mål, figurer, tåge, kamera og taster.
 * Delt ud af BaneScene.ts 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function byggBane(s: BaneScene) {
  s.bane = laesBane(s.data_.sted.bane ?? ['S', '#']);
  const W = s.bane.bredde * BFELT;
  const H = s.bane.hoejde * BFELT;
  const tema = s.data_.sted.tema;
  s.byggAvatar();
  s.tekstur('px-klatten', KLATTEN);
  s.tekstur('px-fugl', FUGL);
  s.tekstur('px-cp-0', checkpoint(false));
  s.tekstur('px-cp-1', checkpoint(true));
  s.tekstur('px-maal', MAAL);
  s.tekstur('px-grenport', GRENPORT);
  const bjerg = tema === 'rimbjerg';
  // Ordstenene hedder ekkosten på Rimbjerget og ser anderledes ud. Teksturen får sit eget navn pr. tema.
  s.stenNoegle = bjerg ? 'px-ekkosten' : 'px-ordsten';
  s.tekstur(`${s.stenNoegle}-0`, bjerg ? ekkosten(false) : ordsten(false));
  s.tekstur(`${s.stenNoegle}-1`, bjerg ? ekkosten(true) : ordsten(true));
  s.tekstur('px-varde', VARDE);
  s.tekstur('px-ny-planke', NY_PLANKE);
  const skov = tema === 'viskesti';

  // Baggrunden er halvt så bred plus skærmen, fordi den flytter sig med halv fart.
  // Kameraet zoomer om sin midte, så baggrunden (som ikke følger med lodret) flyttes, så den står det samme sted
  // med fin grafik (SKALA 2) som med hurtig (SKALA 1).
  s.add
    .image((VIS_B * (SKALA - 1)) / 4, (VIS_H * (SKALA - 1)) / 2, s.tekstur(`px-bane-bag-${tema}`, (skov ? tegnSkovBaggrund : bjerg ? tegnBjergBaggrund : tema === 'arkiv' ? tegnArkivBaggrund : tema === 'blaeksoe' ? tegnSoeBaggrund : tema === 'halve' ? tegnHalvBaggrund : tegnByBaggrund)(Math.ceil(W / 2) + VIS_B, Math.max(H, VIS_H)), true))
    .setOrigin(0)
    .setScrollFactor(0.5, 0)
    .setDepth(-2);
  s.add.image(0, 0, s.tekstur(`px-bane-${s.data_.sted.navn}`, tegnBane(s.bane, tema), true)).setOrigin(0).setDepth(0);

  // Viskede planker og ordsten (Viskeskoven). Er banen klaret, er alle planker skrevet tilbage.
  s.grupper = viskedeGrupper(s.bane);
  s.grupper.forEach((g, i) => g.forEach(([x, y]) => s.gruppeVed.set(`${x},${y}`, i)));
  for (const [x, y] of find(s.bane, 'O').sort((a, b) => a[0] - b[0])) {
    const ox = x * BFELT + 8;
    const oy = (y + 1) * BFELT;
    s.ordsten.push({ x: ox, y: oy, billede: s.add.image(ox, oy, `${s.stenNoegle}-0`).setOrigin(0.5, 1).setDepth(1) });
  }
  if (s.data_.baneKlaret) s.grupper.forEach((_g, i) => s.genskab(i, false));

  for (const [x, y] of find(s.bane, 'C')) {
    const bx = x * BFELT + 8;
    const by = (y + 1) * BFELT;
    s.lanterner.push({ x: bx, y: by, billede: s.add.image(bx, by, 'px-cp-0').setOrigin(0.5, 1).setDepth(1), taendt: false });
  }
  s.lanterner.sort((a, b) => a.x - b.x);
  const [m] = find(s.bane, 'M');
  if (m) {
    s.maal = { x: m[0] * BFELT + 8, y: (m[1] + 1) * BFELT };
    s.add.image(s.maal.x, s.maal.y, skov ? 'px-grenport' : bjerg ? 'px-varde' : 'px-maal').setOrigin(0.5, 1).setDepth(1);
  }
  const [startFelt] = find(s.bane, 'S');
  s.start = { x: (startFelt?.[0] ?? 1) * BFELT + 8, y: ((startFelt?.[1] ?? 1) + 1) * BFELT };
  // Er målet allerede nået, står hovedpersonen ved målet (fx hvis spillet blev genåbnet midt i slutscenen).
  const fra = s.data_.baneKlaret ? { x: s.maal.x - 24, y: s.maal.y } : s.start;
  if (s.data_.baneKlaret) s.faerdig = true;
  s.spiller = s.add.image(fra.x, fra.y, 'px-side-0').setOrigin(0.5, 1).setDepth(5);
  s.fugl = s.add.image(s.start.x - 16, s.start.y - 20, 'px-fugl').setOrigin(0.5, 1).setDepth(6);
  s.fugl.setVisible(!(s.data_.skjulte ?? []).includes('aeseloere'));
  const [k] = find(s.bane, 'K');
  if (k && !(s.data_.skjulte ?? []).includes('klatten'))
    s.klatten = s.add
      .image(s.data_.baneKlaret ? s.maal.x + 24 : k[0] * BFELT + 8, s.data_.baneKlaret ? s.maal.y : (k[1] + 1) * BFELT, 'px-klatten')
      .setOrigin(0.5, 1)
      .setDepth(4);

  s.tekstur('px-skygge-figur', SKYGGE);
  for (const o of s.data_.sted.objekter) {
    if (!o.felt || o.form !== 'skygge') continue;
    const b = s.add.image(o.felt[0] * BFELT + 8, (o.felt[1] + 1) * BFELT, 'px-skygge-figur').setOrigin(0.5, 1).setDepth(7);
    b.setVisible(!(s.data_.skjulte ?? []).includes(o.id));
    s.figurer.set(o.id, b);
  }

  // Tågen i Viskeskoven: hvid i kanten, åben omkring hovedpersonen, hvor lanternen lyser (docs/historie.md).
  if (skov) {
    const noegle = s.tekstur('px-taage', tegnTaage(VIS_B * 2, VIS_H * 2, 70));
    s.taage = s.add.image(fra.x, fra.y - 10, noegle).setDepth(9).setAlpha(s.data_.mindreUhygge ? 0.6 : 1);
  }

  const cam = s.cameras.main;
  // Tegnes i høj opløsning som kortet (SKALA). Kameraet styres med centerOn som på kortet (Henrik, 13. november 2026):
  // med origo i hjørnet og zoom 2 (fin grafik) så man himlen i stedet for banen, fordi scroll og zoom ikke passede sammen.
  cam.setBounds(0, 0, W, Math.max(H, VIS_H)).setRoundPixels(true);
  cam.setZoom(SKALA);
  s.kamX = fra.x;
  cam.centerOn(fra.x, s.kamY());
  s.fremad = 0;

  const kb = s.input.keyboard;
  if (kb) {
    const K = Phaser.Input.Keyboard.KeyCodes;
    s.taster = {
      venstre: kb.addKey(K.LEFT),
      hoejre: kb.addKey(K.RIGHT),
      op: kb.addKey(K.UP),
      a: kb.addKey(K.A),
      d: kb.addKey(K.D),
      w: kb.addKey(K.W),
      mellemrum: kb.addKey(K.SPACE),
    };
  }
}
