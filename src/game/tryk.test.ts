import { describe, expect, it } from 'vitest';
import { objektVedTryk } from './tryk';

// Som i Pennedal i kapitel 1: Klatten står skråt under skiltet.
const klatten = { id: 'klatten', felt: [14, 8] as [number, number] };
const skilt = { id: 'skilt', felt: [15, 7] as [number, number] };

describe('tryk på kortet', () => {
  it('rammer skiltet, når man trykker på skiltet, selv om Klatten står lige ved siden af', () => {
    expect(objektVedTryk([klatten, skilt], 15, 7)?.id).toBe('skilt');
    expect(objektVedTryk([klatten, skilt], 15, 6)?.id).toBe('skilt');
  });

  it('rammer Klatten, når man trykker på Klatten', () => {
    expect(objektVedTryk([klatten, skilt], 14, 8)?.id).toBe('klatten');
  });

  it('lader opgavens objekt vinde ved lige afstand', () => {
    expect(objektVedTryk([klatten, skilt], 15, 8, 'skilt')?.id).toBe('skilt');
    expect(objektVedTryk([klatten, skilt], 15, 8, 'klatten')?.id).toBe('klatten');
  });

  it('rammer også toppen af en høj figur, men ikke noget langt væk', () => {
    expect(objektVedTryk([skilt], 15, 5)?.id).toBe('skilt');
    expect(objektVedTryk([skilt], 15, 4)).toBeUndefined();
    expect(objektVedTryk([skilt], 18, 7)).toBeUndefined();
  });
});
