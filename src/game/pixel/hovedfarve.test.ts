import { describe, expect, it } from 'vitest';
import { AVATAR_GRAENSER, STANDARD_AVATAR } from '../../data/gem';
import { avatarPixel, brugerHovedfarve } from './sprites';

// Farven på hovedet (26. november 2026): editoren slår valget fra, når farven ikke kan ses på figuren.
// Testen tegner figuren med to farver og ser, om den ændrer sig, så reglen passer til tegningen.
/** Figuren som farver pixel for pixel (paletten har altid hovedets farve med, også når den ikke bruges). */
const tegn = (hoved: number, tilbehoer: number, haar: number, hovedfarve: number) =>
  ['ned', 'op', 'venstre', 'hoejre']
    .map((r) => {
      const k = avatarPixel({ ...STANDARD_AVATAR, hoved, tilbehoer, haar, hovedfarve }, r as 'ned', 0);
      return k.raekker.map((rk) => [...rk].map((c) => k.palet[c] ?? c).join(',')).join('/');
    })
    .join('|');

describe('farven på hovedet', () => {
  it('kan ses, præcis når editoren tilbyder den (alle frisurer, hovedbeklædninger og tilbehør)', () => {
    const forkert: string[] = [];
    for (let haar = 0; haar < AVATAR_GRAENSER.haar; haar++)
      for (let hoved = 0; hoved < AVATAR_GRAENSER.hoved; hoved++)
        for (let tilbehoer = 0; tilbehoer < AVATAR_GRAENSER.tilbehoer; tilbehoer++) {
          const ses = tegn(hoved, tilbehoer, haar, 0) !== tegn(hoved, tilbehoer, haar, 3);
          if (brugerHovedfarve({ hoved, tilbehoer, haar }) !== ses) forkert.push(`hår ${haar}, hoved ${hoved}, tilbehør ${tilbehoer}`);
        }
    expect(forkert).toEqual([]);
  });
});
