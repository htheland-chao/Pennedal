import { useEffect, useRef, useState } from 'react';
import { t, type TekstId } from '../../content';
import type { Haendelse, Kamp, MedlemId } from '../../mechanics/kampmotor';
import { spilEffekt } from '../../lyd/effekter';
import { lydForTrin, trinFor, type Effekt, type Trin } from '../kampEffekter';
import { roligBevaegelse } from './tilgaengelighed';
import type { Visning } from './visning';

type Args = {
  kamp: Kamp;
  setKamp: (k: Kamp) => void;
  setVisning: (v: Visning) => void;
  setNotat: (n: string | null) => void;
  setLinje: (l: string | null) => void;
  navne: string[];
  medlemNavn: (id: MedlemId) => string;
  /** Midten af en figur i procent af scenen, til effekterne. */
  midtFjende: (nr: number) => [number, number];
  midtMedlem: (id: MedlemId) => [number, number];
  daempet: boolean;
};

/**
 * Animationerne i kampen: trin, der spilles ét ad gangen. Livet på skærmen følger trinnene og passer med kampen til sidst.
 * Her er også overgangen ind i kampen, kameraet og rystelsen.
 * Delt ud af KampVindue.tsx 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
export function useAfspilning({ kamp, setKamp, setVisning, setNotat, setLinje, navne, medlemNavn, midtFjende, midtMedlem, daempet }: Args) {
  const [effekter, setEffekter] = useState<(Effekt & { id: number })[]>([]);
  const [visLiv, setVisLiv] = useState<{ fjender: number[]; hold: Record<string, number> } | null>(null);
  const [ryst, setRyst] = useState<{ fjender: number[]; hold: MedlemId[]; skaerm: boolean; nr: number }>({ fjender: [], hold: [], skaerm: false, nr: 0 });
  const [oploest, setOploest] = useState<number[]>(() => kamp.fjender.filter((f) => f.liv <= 0).map((f) => f.nr));
  const oploestRef = useRef(oploest);
  oploestRef.current = oploest;
  // Kun de væsner, der falder til ro i denne afspilning, smelter. De, der allerede er væk, bliver væk (Henrik, 10. november 2026).
  const [smelter, setSmelter] = useState<number[]>([]);
  const [faldet, setFaldet] = useState<MedlemId[]>([]);
  const afspilning = useRef<{ ur: number | null; trin: Trin[]; i: number; slut: (() => void) | null }>({ ur: null, trin: [], i: 0, slut: null });
  const effektNr = useRef(0);
  const felt = useRef<HTMLDivElement>(null);

  // Skærmen ryster ved hårde slag. Det sker med en animation på elementet, så scenen ikke tegnes forfra
  // (ellers ville et væsen, der allerede er faldet, dukke op igen).
  useEffect(() => {
    if (!ryst.skaerm || !felt.current?.animate) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    felt.current.animate(
      [{ transform: 'translate(-1cqw, 0.6cqh)' }, { transform: 'translate(1cqw, -0.6cqh)' }, { transform: 'translate(-0.5cqw, 0.3cqh)' }, { transform: 'none' }],
      { duration: 350, easing: 'steps(4)' },
    );
  }, [ryst]);

  useEffect(() => () => {
    if (afspilning.current.ur !== null) window.clearTimeout(afspilning.current.ur);
  }, []);

  // Overgangen ind i kampen (Henrik, 10. november 2026): bjælker af blæk lukker og åbner skærmen som i gamle rollespil.
  const [overgang, setOvergang] = useState(() => !roligBevaegelse());
  useEffect(() => {
    if (!overgang) return;
    felt.current?.animate?.([{ scale: '1.25' }, { scale: '1.25', offset: 0.4 }, { scale: '1' }], { duration: 1000, easing: 'ease-out' });
    const ur = window.setTimeout(() => setOvergang(false), 1000);
    return () => window.clearTimeout(ur);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Kameraet (Henrik, 10. november 2026): zoomer kort ind på den, der bliver ramt. Bruger CSS-egenskaben scale,
   * så det ikke støder sammen med rystelsen, der bruger transform.
   */
  function kamera(x: number, y: number, zoom: number, varighed: number) {
    if (!felt.current?.animate || roligBevaegelse()) return;
    felt.current.animate(
      [
        { scale: '1', transformOrigin: `${x}% ${y}%` },
        { scale: String(zoom), transformOrigin: `${x}% ${y}%`, offset: 0.35 },
        { scale: String(zoom), transformOrigin: `${x}% ${y}%`, offset: 0.7 },
        { scale: '1', transformOrigin: `${x}% ${y}%` },
      ],
      { duration: varighed, easing: 'ease-in-out' },
    );
  }

  /** Spiller trinnene. Til sidst sættes kampen til sin rigtige tilstand, og man kommer tilbage til menuen eller slutningen. */
  function afspil(hs: Haendelse[], ny: Kamp) {
    const trinListe = trinFor(hs, { fjende: midtFjende, medlem: midtMedlem }, { fjende: (nr) => navne[nr], medlem: medlemNavn }, ny.hold.map((m) => m.id));
    setVisLiv({ fjender: kamp.fjender.map((f) => f.liv), hold: Object.fromEntries(kamp.hold.map((m) => [m.id, m.liv])) });
    setVisning({ type: 'afspil' });
    setNotat(null);
    const a = afspilning.current;
    a.trin = trinListe;
    a.i = 0;
    a.slut = () => {
      a.ur = null;
      a.slut = null;
      setEffekter([]);
      setVisLiv(null);
      setKamp(ny);
      setOploest(ny.fjender.filter((f) => f.liv <= 0).map((f) => f.nr));
      setSmelter([]);
      setFaldet(ny.hold.filter((m) => m.liv <= 0).map((m) => m.id));
      setVisning(ny.udfald ? { type: 'slut' } : { type: 'menu' });
      if (!ny.udfald) setLinje(null);
    };
    naesteTrin();
  }

  function naesteTrin() {
    const a = afspilning.current;
    if (a.i >= a.trin.length) {
      a.slut?.();
      return;
    }
    const tr = a.trin[a.i++];
    const lyd = lydForTrin(tr);
    if (lyd) spilEffekt(lyd);
    // Det sidste væsen, der opløses, vises langsomt (som en filmisk slowmotion).
    const sidste = !!tr.oploest?.length && kamp.fjender.every((f) => oploestRef.current.includes(f.nr) || tr.oploest!.includes(f.nr));
    const fart = sidste && !roligBevaegelse() ? 0.5 : 1;
    const ramt = tr.effekter.find((e) => e.type === 'nedslag' || e.type === 'oploes');
    const angreb = tr.effekter.find((e) => e.type.startsWith('angreb-'));
    // Varigheden er uden slowmotion: playbackRate herunder gør også kameraet langsommere.
    if (ramt) kamera(ramt.x, ramt.y, sidste ? 1.3 : tr.effekter.some((e) => e.type === 'stort') ? 1.18 : 1.1, tr.varighed);
    else if (angreb) kamera(angreb.tx ?? angreb.x, angreb.ty ?? angreb.y, 1.06, tr.varighed);
    if (fart !== 1) requestAnimationFrame(() => felt.current?.getAnimations?.({ subtree: true }).forEach((x) => (x.playbackRate = fart)));
    setEffekter(tr.effekter.map((e) => ({ ...e, id: ++effektNr.current })));
    if (tr.linje) setLinje(t(tr.linje.noegle as TekstId, tr.linje.vaerdier));
    if (tr.fjendeLiv || tr.holdLiv)
      setVisLiv((v) => {
        if (!v) return v;
        const fjender = [...v.fjender];
        for (const d of tr.fjendeLiv ?? []) fjender[d.nr] = Math.max(0, fjender[d.nr] + d.delta);
        const hold = { ...v.hold };
        for (const d of tr.holdLiv ?? []) {
          const m = kamp.hold.find((x) => x.id === d.id);
          hold[d.id] = Math.max(0, Math.min(m?.maks ?? 99, (hold[d.id] ?? 0) + d.delta));
        }
        return { fjender, hold };
      });
    if (tr.ryst) setRyst((r) => ({ fjender: tr.ryst?.fjender ?? [], hold: tr.ryst?.hold ?? [], skaerm: !!tr.ryst?.skaerm && !daempet, nr: r.nr + 1 }));
    if (tr.oploest) {
      setOploest((o) => [...new Set([...o, ...tr.oploest!])]);
      setSmelter((x) => [...x, ...tr.oploest!]);
    }
    if (tr.faldet) setFaldet((f) => [...new Set([...f, ...tr.faldet!])]);
    a.ur = window.setTimeout(naesteTrin, tr.varighed / fart);
  }

  /** Spring animationerne over: alt sker med det samme. */
  function springOver() {
    const a = afspilning.current;
    if (a.ur !== null) window.clearTimeout(a.ur);
    a.i = a.trin.length;
    a.slut?.();
  }

  return { effekter, visLiv, ryst, oploest, smelter, faldet, felt, overgang, afspil, springOver };
}
