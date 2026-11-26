import { existsSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { iPaletten } from '../palet';
import { GEMINI_MINDER } from './gemini';

// Billeder fra Gemini skal være gjort klar med scripts/billede-til-palet.mjs (26. november 2026).
describe('Gemini-billeder til minderne', () => {
  for (const id of GEMINI_MINDER)
    it(`${id}: findes, er 320 x 180 og bruger kun masterpaletten`, () => {
      const sti = `public/minder/${id}.png`;
      expect(existsSync(sti), sti).toBe(true);
      const png = PNG.sync.read(readFileSync(sti));
      expect([png.width, png.height]).toEqual([320, 180]);
      const fremmede = new Set<string>();
      for (let i = 0; i < png.data.length; i += 4) {
        const hex = '#' + [0, 1, 2].map((k) => png.data[i + k].toString(16).padStart(2, '0')).join('');
        if (!iPaletten(hex)) fremmede.add(hex);
      }
      expect([...fremmede]).toEqual([]);
    });
  it('listen har ingen dubletter', () => expect(new Set(GEMINI_MINDER).size).toBe(GEMINI_MINDER.length));
});
