/**
 * Hvilket objekt et tryk på kortet rammer (8. november 2026). Før blev det første objekt i listen valgt, så et tryk
 * på Klattens skilt ramte Klatten, der står skråt under. Nu vælges det nærmeste, og opgavens objekt vinder ved lige afstand.
 * Høje figurer rager op over deres felt, så et tryk op til to felter over feltet tæller også.
 */
export type Trykbart = { id: string; felt?: [number, number] };

export function objektVedTryk<T extends Trykbart>(objekter: T[], tx: number, ty: number, aktiv?: string | null): T | undefined {
  const afstand = (o: T) => {
    const [fx, fy] = o.felt!;
    const dx = Math.abs(fx - tx);
    // Over feltet: figurens krop. Under feltet: kun et enkelt felt.
    const dy = ty < fy ? Math.max(0, fy - ty - 1) : ty - fy;
    return dx + dy - (o.id === aktiv ? 0.5 : 0);
  };
  return objekter
    .filter((o) => o.felt && Math.abs(o.felt[0] - tx) <= 1 && ty >= o.felt[1] - 2 && ty <= o.felt[1] + 1)
    .sort((a, b) => afstand(a) - afstand(b))[0];
}
