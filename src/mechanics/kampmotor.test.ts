import { describe, expect, it } from 'vitest';
import { lavTilfaeldig } from '../engine/tilfaeldig';
import type { VaesenId } from './kamp';
import {
  brugEvne,
  brugTing,
  fjendensTur,
  forsvar,
  kanBrugeEvne,
  KOMBI,
  levende,
  MAKS_LIV,
  medlem,
  SKADE,
  slaa,
  startKamp,
  stortSlagKlar,
  SVAGHED,
  type Kamp,
  type StartValg,
} from './kampmotor';

const valg = (x: Partial<StartValg> = {}): StartValg => ({
  vaesner: ['tomordet'],
  ture: 3,
  hjaelpere: ['aeseloere', 'vims'],
  taske: ['lanterne', 'krummer', 'punktum', 'logbog'],
  givet: 0,
  daempet: false,
  niveau: 3,
  rnd: lavTilfaeldig(1),
  ...x,
});

describe('kampmotoren', () => {
  it('fordeler væsnernes liv efter antallet af ture og varsler første runde', () => {
    const k = startKamp(valg({ vaesner: ['tomordet', 'stumming', 'tomordet'], ture: 4 }));
    expect(k.fjender.map((f) => f.maks)).toEqual([4, 2, 2]);
    expect(k.fjender.every((f) => f.varsel)).toBe(true);
    expect(k.hold.map((m) => m.id)).toEqual(['avatar', 'aeseloere', 'vims']);
    expect(k.ting).toEqual({ lanterne: true, krummer: true, punktum: true });
  });

  it('husker skaden fra en afbrudt kamp', () => {
    const k = startKamp(valg({ vaesner: ['tomordet', 'stumming'], ture: 4, givet: 5 }));
    expect(k.fjender.map((f) => f.liv)).toEqual([1, 2]);
    expect(k.givet).toBe(5);
  });

  it('rammer hårdere, når slaget passer til væsnets svaghed', () => {
    const k = startKamp(valg({ ture: 5 }));
    const svag = slaa(k, { slag: 'synonym', fjende: 0, rigtigt: true });
    const andet = slaa(k, { slag: 'stumt', fjende: 0, rigtigt: true });
    expect(k.fjender[0].maks - svag.kamp.fjender[0].liv).toBe(SKADE.svag);
    expect(k.fjender[0].maks - andet.kamp.fjender[0].liv).toBe(SKADE.slag);
    expect(SVAGHED.tomordet).toBe('synonym');
  });

  it('et forkert svar rammer ved siden af, men koster ikke liv', () => {
    const k = startKamp(valg());
    const r = slaa(k, { slag: 'synonym', fjende: 0, rigtigt: false });
    expect(r.haendelser).toEqual([{ type: 'forbi', fjende: 0 }]);
    expect(r.kamp.fjender[0].liv).toBe(k.fjender[0].liv);
    expect(r.kamp.hold).toEqual(k.hold);
  });

  it('giver et stort slag efter tre rigtige i træk, og det rammer alle', () => {
    let k = startKamp(valg({ vaesner: ['tomordet', 'stumming', 'stumming'], ture: 12 }));
    for (let i = 0; i < KOMBI; i++) k = slaa(k, { slag: 'stumt', fjende: 1, rigtigt: true }).kamp;
    expect(stortSlagKlar(k)).toBe(true);
    const foer = k.fjender.map((f) => f.liv);
    const r = slaa(k, { slag: 'stumt', fjende: 0, rigtigt: true, stort: true });
    expect(r.kamp.fjender.every((f, i) => f.liv < foer[i] || f.liv === 0)).toBe(true);
    expect(r.kamp.kombi).toBe(0);
  });

  it('et forkert svar nulstiller rækken af rigtige', () => {
    let k = startKamp(valg({ ture: 12 }));
    k = slaa(k, { slag: 'synonym', fjende: 0, rigtigt: true }).kamp;
    k = slaa(k, { slag: 'synonym', fjende: 0, rigtigt: false }).kamp;
    expect(k.kombi).toBe(0);
  });

  it('forsvar halverer skaden i runden', () => {
    const k = startKamp(valg({ ture: 12 }));
    k.fjender[0].varsel = { angreb: 'aed', skade: 3, alle: false, maal: 'avatar' };
    const uden = fjendensTur(k, lavTilfaeldig(2)).kamp;
    const med = fjendensTur(forsvar(k).kamp, lavTilfaeldig(2)).kamp;
    expect(MAKS_LIV.avatar - medlem(uden, 'avatar')!.liv).toBe(3);
    // Forsvar giver 1 liv (fuldt allerede), og skaden 3 bliver 1.
    expect(MAKS_LIV.avatar - medlem(med, 'avatar')!.liv).toBe(1);
  });

  it('hver tredje runde varsler et væsen et stort angreb mod hele holdet, og forsvar halverer det', () => {
    let k = startKamp(valg({ ture: 30 }));
    const rnd = lavTilfaeldig(3);
    for (let r = 1; r < 3; r++) {
      expect(k.fjender[0].varsel?.stort).toBeFalsy();
      k = fjendensTur(k, rnd).kamp;
    }
    expect(k.runde).toBe(3);
    const v = k.fjender[0].varsel!;
    expect(v).toMatchObject({ stort: true, alle: true });
    expect(v.skade).toBeGreaterThanOrEqual(3);
    const fuld = { ...k, hold: k.hold.map((m) => ({ ...m, liv: m.maks })) };
    const uden = fjendensTur(fuld, lavTilfaeldig(2)).kamp;
    const med = fjendensTur(forsvar(fuld).kamp, lavTilfaeldig(2)).kamp;
    for (const m of uden.hold) expect(m.maks - m.liv).toBe(v.skade);
    for (const m of med.hold.filter((x) => x.id !== 'avatar')) expect(m.maks - m.liv).toBe(Math.floor(v.skade / 2));
  });

  it('Mindre uhygge halverer væsnernes skade', () => {
    const k = startKamp(valg({ daempet: true, ture: 12 }));
    k.fjender[0].varsel = { angreb: 'aed', skade: 3, alle: false, maal: 'avatar' };
    expect(MAKS_LIV.avatar - medlem(fjendensTur(k, lavTilfaeldig(2)).kamp, 'avatar')!.liv).toBe(2);
  });

  it('elever på lavt niveau får mildere angreb', () => {
    // Find et frø, hvor væsnet varsler sit store angreb (skade 3), og sammenlign samme angreb.
    const frø = [...Array(50).keys()].find((s) => startKamp(valg({ niveau: 4, rnd: lavTilfaeldig(s) })).fjender[0].varsel!.angreb === 'aed')!;
    const lav = startKamp(valg({ niveau: 1, rnd: lavTilfaeldig(frø) }));
    const hoej = startKamp(valg({ niveau: 4, rnd: lavTilfaeldig(frø) }));
    expect(hoej.fjender[0].varsel!.skade).toBe(3);
    expect(lav.fjender[0].varsel!.skade).toBe(2);
  });

  it('hver hjælper kan bruge en evne én gang pr. runde, og ladningerne slipper op', () => {
    let k = startKamp(valg({ ture: 12 }));
    expect(kanBrugeEvne(k, 'forklar')).toBe(true);
    k = brugEvne(k, 'forklar').kamp;
    expect(kanBrugeEvne(k, 'lap')).toBe(false);
    expect(kanBrugeEvne(k, 'visk')).toBe(true);
    k = fjendensTur(k, lavTilfaeldig(3)).kamp;
    expect(kanBrugeEvne(k, 'forklar')).toBe(true);
    k = brugEvne(k, 'forklar').kamp;
    k = fjendensTur(k, lavTilfaeldig(3)).kamp;
    expect(kanBrugeEvne(k, 'forklar')).toBe(false);
  });

  it('Æseløre kan lappe en, der er faldet, og Vims kan slette et varslet angreb', () => {
    let k = startKamp(valg({ ture: 12 }));
    medlem(k, 'vims')!.liv = 0;
    k = brugEvne(k, 'lap', { hvem: 'vims' }).kamp;
    expect(medlem(k, 'vims')!.liv).toBe(4);
    k = brugEvne(k, 'slet', { fjende: 0 }).kamp;
    expect(k.fjender[0].varsel).toBeNull();
    const r = fjendensTur(k, lavTilfaeldig(3));
    expect(r.haendelser.filter((h) => h.type === 'angreb')).toHaveLength(0);
  });

  it('tingene virker én gang: lanternen blænder, krummerne helbreder, punktummet stopper et væsen', () => {
    let k = startKamp(valg({ vaesner: ['tomordet', 'stumming'], ture: 12 }));
    const lys = fjendensTur(brugTing(k, 'lanterne').kamp, lavTilfaeldig(3));
    expect(lys.haendelser.every((h) => h.type === 'misser')).toBe(true);
    expect(brugTing(lys.kamp, 'lanterne').haendelser).toEqual([]);
    const p = fjendensTur(brugTing(k, 'punktum', { fjende: 1 }).kamp, lavTilfaeldig(3));
    expect(p.haendelser.some((h) => h.type === 'lammet' && h.fjende === 1)).toBe(true);
    medlem(k, 'avatar')!.liv = 2;
    k = brugTing(k, 'krummer').kamp;
    expect(medlem(k, 'avatar')!.liv).toBe(5);
  });

  it('holdet er slået tilbage, når avataren falder, og skaden på væsnerne er husket', () => {
    let k = startKamp(valg({ ture: 12, hjaelpere: [] }));
    k = slaa(k, { slag: 'synonym', fjende: 0, rigtigt: true }).kamp;
    medlem(k, 'avatar')!.liv = 1;
    k.fjender[0].varsel = { angreb: 'aed', skade: 3, alle: false, maal: 'avatar' };
    const r = fjendensTur(k, lavTilfaeldig(4));
    expect(r.kamp.udfald).toBe('slaaet');
    expect(r.kamp.givet).toBe(SKADE.svag);
    const igen = startKamp(valg({ ture: 12, hjaelpere: [], givet: r.kamp.givet }));
    expect(igen.fjender[0].liv).toBe(igen.fjender[0].maks - SKADE.svag);
    expect(medlem(igen, 'avatar')!.liv).toBe(MAKS_LIV.avatar);
  });

  it('kampen er vundet, når alle væsner er rolige', () => {
    let k = startKamp(valg({ ture: 2 }));
    k = slaa(k, { slag: 'synonym', fjende: 0, rigtigt: true }).kamp;
    expect(k.udfald).toBe('vundet');
    expect(fjendensTur(k, lavTilfaeldig(1)).haendelser).toEqual([]);
  });
});

/** En elev, der spiller fornuftigt: slår svagheden, forsvarer og lapper, når livet er lavt. */
function spil(start: Kamp, rigtigt: (runde: number) => boolean, rnd: () => number, klog = true): Kamp {
  let k = start;
  for (let r = 0; r < 60 && !k.udfald; r++) {
    const a = medlem(k, 'avatar')!;
    if (klog && a.liv <= 5 && kanBrugeEvne(k, 'lap')) k = brugEvne(k, 'lap', { hvem: 'avatar' }).kamp;
    const nu = medlem(k, 'avatar')!;
    if (klog && nu.liv <= 4 && k.ting.krummer) k = brugTing(k, 'krummer').kamp;
    else if (klog && nu.liv <= 3) k = forsvar(k).kamp;
    else {
      const f = levende(k.fjender)[0];
      k = slaa(k, { slag: SVAGHED[f.vaesen], fjende: f.nr, rigtigt: rigtigt(r), stort: stortSlagKlar(k) }).kamp;
    }
    if (!k.udfald) k = fjendensTur(k, rnd).kamp;
  }
  return k;
}

describe('balance', () => {
  const kampe: VaesenId[][] = [['tomordet'], ['stumming', 'tomordet'], ['stumming', 'tomordet', 'stumming']];

  it('en elev, der svarer rigtigt hver gang, vinder altid', () => {
    for (const vaesner of kampe)
      for (let seed = 1; seed <= 40; seed++)
        for (const ture of [3, 4, 5]) {
          const rnd = lavTilfaeldig(seed);
          expect(spil(startKamp(valg({ vaesner, ture, rnd, taske: [] })), () => true, rnd, false).udfald, `${vaesner} ${seed}`).toBe('vundet');
        }
  });

  it('en elev, der svarer rigtigt hver anden gang og bruger hjælpen, vinder næsten altid', () => {
    let vundet = 0;
    let i_alt = 0;
    for (const vaesner of kampe)
      for (let seed = 1; seed <= 40; seed++)
        for (const ture of [3, 4, 5]) {
          const rnd = lavTilfaeldig(seed * 7);
          const k = spil(startKamp(valg({ vaesner, ture, rnd, hjaelpere: ['aeseloere'], taske: ['krummer'] })), (r) => r % 2 === 0, rnd);
          i_alt++;
          if (k.udfald === 'vundet') vundet++;
        }
    expect(vundet / i_alt).toBeGreaterThanOrEqual(0.9);
  });

  it('en kamp, hvor intet svar er rigtigt, ender altid med et blødt nederlag, aldrig i det uendelige', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rnd = lavTilfaeldig(seed);
      expect(spil(startKamp(valg({ rnd })), () => false, rnd, false).udfald).toBe('slaaet');
    }
  });
});
