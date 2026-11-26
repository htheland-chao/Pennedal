import type Phaser from 'phaser';
import type { EnkelHandling } from '../engine/film/typer';
import { KortScene } from './KortScene';
import { BaneScene } from './BaneScene';
import { erPhaserHandling } from './filmlag';
import { filmOprydning, filmSlut, filmStart, filmUdfoer } from './kort/film';
import { baneOprydning, baneSlut, baneStart, baneUdfoer } from './bane/film';

/**
 * Det, React-arbejderen (src/components/film/) får fra Phaser: kortets arbejder (kort/film.ts) eller
 * platformbanens (bane/film.ts), alt efter hvilken scene der kører. hent giver den scene, der kører lige nu.
 */
export type PhaserFilm = {
  start(): void;
  udfoer(h: EnkelHandling): Promise<void>;
  slut(h: EnkelHandling): void;
  oprydning(): void;
};

export function phaserFilm(hent: () => Phaser.Scene | null): PhaserFilm {
  return {
    start: () => {
      const s = hent();
      if (s instanceof KortScene) filmStart(s);
      else if (s instanceof BaneScene) baneStart(s);
    },
    udfoer: (h) => {
      const s = hent();
      if (!erPhaserHandling(h)) return Promise.resolve();
      if (s instanceof KortScene) return filmUdfoer(s, h);
      if (s instanceof BaneScene) return baneUdfoer(s, h);
      return Promise.resolve();
    },
    slut: (h) => {
      const s = hent();
      if (!erPhaserHandling(h)) return;
      if (s instanceof KortScene) filmSlut(s, h);
      else if (s instanceof BaneScene) baneSlut(s, h);
    },
    oprydning: () => {
      const s = hent();
      if (s instanceof KortScene) filmOprydning(s);
      else if (s instanceof BaneScene) baneOprydning(s);
    },
  };
}
