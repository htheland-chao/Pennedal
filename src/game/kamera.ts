/**
 * Glidning, der regnes efter tid, ikke efter billeder (10. november 2026). Så glider kameraet lige blødt på en skærm
 * med 60 og med 240 billeder pr. sekund. fart er hvor hurtigt: efter 1 / fart sekund er cirka 63 % af vejen gået.
 * dt = Infinity giver målet med det samme.
 */
export function glid(nu: number, maal: number, dt: number, fart: number): number {
  return nu + (maal - nu) * (1 - Math.exp(-dt * fart));
}
