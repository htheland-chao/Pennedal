import { describe, expect, it } from 'vitest';
import { AVATAR_DELE, AVATAR_GRAENSER } from '../engine/gem';
import { avatarDele } from '../content';

describe('avatar', () => {
  it('har lige så mange navne og farver som valg', () => {
    for (const del of AVATAR_DELE) {
      const d = avatarDele[del];
      expect(d, del).toBeTruthy();
      if (d.valg) expect(d.valg.length, del).toBe(AVATAR_GRAENSER[del]);
      if (d.farver) expect(d.farver.length, del).toBe(AVATAR_GRAENSER[del]);
    }
  });
});
