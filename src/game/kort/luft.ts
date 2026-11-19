import type { KortScene } from '../KortScene';
import { VIS_B, VIS_H, SKALA } from './skala';
import { FELT } from '../kort';
import { hash, lavTaagebanker, lavVignet, partikelBilleder } from '../pixel/lerred';
import { type Partikel, indenfor, partikelTrin, partiklerFor, vignetStyrke } from '../stemning';
import { moerkere, papirtrae } from '../pixel/sprites';
import { LAANTE_TRAEER } from '../pixel/laant/traeer';
import { rundeTraeer } from './laant';

/**
 * Stemning i luften: partikler, tågebanker og grene i forgrunden, der glider med kameraet.
 * Delt ud af KortScene.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
/**
 * Stemning (Henrik, 9. november 2026): partikler i luften, en vignet på lyset og grene i forgrunden.
 * Med reduceret bevægelse er der ingen partikler, og grenene står stille.
 */
export function lavStemning(s: KortScene, tema: string, inde: boolean) {
  s.vignet = lavVignet(VIS_B * SKALA, VIS_H * SKALA, vignetStyrke(tema, s.data_.mindreUhygge), SKALA > 1);
  if (!s.roligt)
    for (const { art, antal } of partiklerFor(tema)) {
      const [a, b] = partikelBilleder(art);
      const n0 = s.tekstur(`px-partikel-${art}-0`, a);
      s.tekstur(`px-partikel-${art}-1`, b);
      // Ildfluer lyser i mørket, så de ligger over lyslaget. Resten bliver mørkere med lyset.
      const dybde = art === 'ildflue' ? 1_000_001 : 999_000;
      for (let i = 0; i < antal; i++) {
        const fase = hash(i * 17 + art.length, i * 5 + 3);
        const p: Partikel = { art, x: s.kam.x - VIS_B / 2 + hash(i, art.length * 7) * VIS_B, y: s.kam.y - VIS_H / 2 + hash(art.length, i * 7) * VIS_H, fase };
        s.partikler.push({ billede: s.add.image(p.x, p.y, n0).setDepth(dybde).setOrigin(0.5), p, noegle: `px-partikel-${art}` });
      }
    }
  if (tema === 'viskeskov') {
    const B = VIS_B * 2;
    for (const [i, lag] of [
      { fart: 4, faktor: 0.25, y: 0.15, alpha: 0.45 },
      { fart: 9, faktor: -0.15, y: 0.55, alpha: 0.32 },
    ].entries()) {
      const noegle = s.tekstur(`px-taagebanke-${i}`, lavTaagebanker(B, 70, i + 3));
      const a = s.data_.mindreUhygge ? lag.alpha * 0.6 : lag.alpha;
      const billeder = [0, 1].map(() =>
        s.add
          .image(0, 0, noegle)
          .setOrigin(0)
          .setDepth(999_100 + i)
          .setAlpha(a),
      );
      s.taage.push({ billeder, fart: s.roligt ? 0 : lag.fart, faktor: lag.faktor, y: lag.y });
    }
  }
  if (inde) return;
  // Grene i forgrunden: mørke trækroner langs kortets nederste kant, der glider lidt hurtigere end resten,
  // så verden får dybde, når kameraet flytter sig.
  const k = s.kort;
  // Samme slags træ som resten af stedet (runde træer i kapitel 3 og 6), aldrig blandet.
  const runde = rundeTraeer(tema);
  const form = runde ? LAANTE_TRAEER[0] : papirtrae(40);
  const gren = s.tekstur(runde ? 'px-forgrund-rund' : 'px-forgrund', {
    ...form,
    palet: Object.fromEntries(Object.entries(form.palet).map(([n, f]) => [n, moerkere(f, 0.42)])),
  });
  for (let tx = 1; tx < k.bredde; tx += 4) {
    if (k.tegn(tx, k.hoejde - 1) !== '#') continue;
    const x = tx * FELT + hash(tx, 5) * 16;
    const y = k.hoejde * FELT - 6 + hash(tx, 9) * 6;
    s.forgrund.push({ billede: s.add.image(x, y, gren).setOrigin(0.5, 1).setDepth(999_500), x, y });
  }
}

/** Partiklerne driver og holdes inden for det, kameraet ser. Grenene i forgrunden glider lidt hurtigere end verden. */
export function opdaterLuft(s: KortScene, dt: number, vx: number, vy: number, z: number) {
  const bw = VIS_B / z;
  const bh = VIS_H / z;
  for (const d of s.partikler) {
    const { dx, dy, alpha, ramme } = partikelTrin(d.p, dt, s.ur);
    d.p.x = indenfor(d.p.x + dx, vx, bw);
    d.p.y = indenfor(d.p.y + dy, vy, bh);
    d.billede.setPosition(Math.round(d.p.x), Math.round(d.p.y)).setAlpha(Math.round(alpha * 4) / 4);
    const n = `${d.noegle}-${ramme}`;
    if (d.billede.texture.key !== n) d.billede.setTexture(n);
  }
  // Tågebankerne driver langsomt og ligger fast på skærmen, men glider lidt med kameraet (parallakse).
  for (const l of s.taage) {
    // Billedet skaleres med zoomen, så det fylder det samme på skærmen. Bredden i verden er derfor width / z.
    const b = l.billeder[0].width / z;
    const forskud = (((s.ur * l.fart + vx * l.faktor) % b) + b) % b;
    l.billeder.forEach((img, i) => img.setPosition(Math.round(vx - forskud + i * b), Math.round(vy + bh * l.y)).setScale(1 / z));
  }
  const cx = vx + bw / 2;
  const cy = vy + bh / 2;
  for (const g of s.forgrund) g.billede.setPosition(Math.round(g.x + (g.x - cx) * 0.3), Math.round(g.y + (g.y - cy) * 0.3));
}
