import { describe, expect, it } from 'vitest';
import { AVATAR_DELE, AVATAR_GRAENSER, STANDARD_AVATAR, type Avatar } from '../engine/gem';
import { avatarDele } from '../content';
import { avatarSvg } from './avatarSvg';

describe('avatar', () => {
  it('giver gyldig SVG for hvert valg i hver del', () => {
    const parser = new DOMParser();
    for (const del of AVATAR_DELE) {
      for (let i = 0; i < AVATAR_GRAENSER[del]; i++) {
        const a: Avatar = { ...STANDARD_AVATAR, [del]: i };
        const doc = parser.parseFromString(avatarSvg(a), 'image/svg+xml');
        expect(doc.querySelector('parsererror'), `${del}=${i}`).toBeNull();
        expect(doc.documentElement.nodeName).toBe('svg');
      }
    }
  });

  it('har lige så mange navne og farver som valg', () => {
    for (const del of AVATAR_DELE) {
      const d = avatarDele[del];
      expect(d, del).toBeTruthy();
      if (d.valg) expect(d.valg.length, del).toBe(AVATAR_GRAENSER[del]);
      if (d.farver) expect(d.farver.length, del).toBe(AVATAR_GRAENSER[del]);
    }
  });

  it('tegner tørklædet uden hår ovenpå', () => {
    const med = avatarSvg({ ...STANDARD_AVATAR, hoved: 1, haar: 4 });
    const uden = avatarSvg({ ...STANDARD_AVATAR, hoved: 0, haar: 4 });
    expect(med).not.toContain('r="36"');
    expect(uden).toContain('r="36"');
  });
});
