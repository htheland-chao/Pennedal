import type { Avatar } from '../engine/gem';
import { lerred, tegnkortTilLerred } from '../game/pixel/lerred';
import { avatarPixel, LANTERNE } from '../game/pixel/sprites';

/**
 * Avataren i den samme pixelgrafik som i spillet, set forfra, som billede til menuerne og avatardesigneren.
 * Med tilbehøret lanterne holder figuren lanternen i hånden. Returnerer null uden canvas (fx i enhedstests).
 */
export function avatarPixelUri(a: Avatar): string | null {
  try {
    const c = lerred(22, 26);
    const g = c.getContext('2d')!;
    g.drawImage(tegnkortTilLerred(avatarPixel(a, 'ned', 0)), 3, 2);
    if (a.tilbehoer === 3) g.drawImage(tegnkortTilLerred(LANTERNE), 16, 15);
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}
