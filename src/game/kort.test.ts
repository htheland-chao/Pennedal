import { describe, expect, it } from 'vitest';
import { kapitler } from '../content';
import { STANDARD_AVATAR } from '../engine/gem';
import { erFastTegn, felterVed, findVej, laesKort, type Felt } from './kort';
import { HOLM, KARTOTEK, KASSE, LOGBOG, PLANTE } from './pixel/inde';
import { avatarPixel, BLADE, FUGL, fyrtaarn, KLATTEN, LANTERNE, papirtrae, PIL, PLANKE, SKILT, STOLPE, voksen, type Tegnkort } from './pixel/sprites';

const FASTE_FORMER = new Set(['gnom', 'skilt', 'person', 'skab']);

describe('kort', () => {
  it('finder den korteste vej uden om skov', () => {
    const k = laesKort(['#####', '#..##', '##.##', '##..#', '#####']);
    const vej = findVej(k, [1, 1], [3, 3], (x, y) => erFastTegn(k.tegn(x, y)));
    expect(vej).toEqual([[2, 1], [2, 2], [2, 3], [3, 3]]);
    expect(findVej(k, [1, 1], [0, 0], (x, y) => erFastTegn(k.tegn(x, y)))).toBeNull();
  });

  it('kan gå fra start til alle objekter på alle steder med kort', () => {
    for (const kapitel of kapitler)
      for (const [id, sted] of Object.entries(kapitel.steder)) {
        if (!sted.kort) continue;
        const k = laesKort(sted.kort);
        expect(new Set(sted.kort.map((r) => r.length)).size, `${id}: lige lange rækker`).toBe(1);
        expect(sted.kort.join('').replace(/[#,.L~Mpq FKVvWRrDBPkSUdt]/g, ''), `${id}: ukendte tegn`).toBe('');
        const faste = new Set(sted.objekter.filter((o) => o.felt && FASTE_FORMER.has(o.form)).map((o) => `${o.felt![0]},${o.felt![1]}`));
        const fast = (x: number, y: number) => erFastTegn(k.tegn(x, y)) || faste.has(`${x},${y}`);
        const start = sted.startFelt as Felt;
        expect(start, `${id}: startFelt`).toHaveLength(2);
        expect(fast(start[0], start[1]), `${id}: start kan gås på`).toBe(false);
        for (const o of sted.objekter) {
          expect(o.felt, `${id}/${o.id}: felt`).toHaveLength(2);
          const felt = o.felt as Felt;
          expect(felt[0] >= 0 && felt[1] >= 0 && felt[0] < k.bredde && felt[1] < k.hoejde, `${id}/${o.id}: inde på kortet`).toBe(true);
          // Klatten står i vejen, indtil han løber. Derfor må vejen gerne gå igennem objekter, der kan forsvinde.
          const fastUdenSkjulte = (x: number, y: number) => erFastTegn(k.tegn(x, y)) || (faste.has(`${x},${y}`) && !sted.objekter.some((p) => p.skjulFra && p.felt?.[0] === x && p.felt?.[1] === y));
          const mulige = [...(fast(felt[0], felt[1]) ? [] : [felt]), ...felterVed(k, felt, fast)];
          const kanNaas = mulige.some((m) => (m[0] === start[0] && m[1] === start[1]) || findVej(k, start, m, fastUdenSkjulte));
          expect(kanNaas, `${id}/${o.id}: kan nås fra start`).toBe(true);
        }
      }
  });
});

describe('pixelfigurer', () => {
  const tjek = (navn: string, t: Tegnkort) => {
    const b = t.raekker[0].length;
    for (const r of t.raekker) expect(r.length, `${navn}: ${r}`).toBe(b);
    for (const tegn of new Set(t.raekker.join('').replace(/\./g, ''))) expect(t.palet[tegn], `${navn}: farve til ${tegn}`).toMatch(/^#[0-9a-f]{6}$/);
  };

  it('har lige lange rækker og en farve til hvert tegn', () => {
    const alle: [string, Tegnkort][] = [
      ['fugl', FUGL], ['klatten', KLATTEN], ['skilt', SKILT], ['lanterne', LANTERNE], ['blade', BLADE], ['stolpe', STOLPE],
      ['planke', PLANKE], ['pil', PIL], ['fyrtårn', fyrtaarn()], ['voksen', voksen('#b0413e')], ['træ', papirtrae(30)],
      ['hr. Holm', HOLM], ['kartotek', KARTOTEK], ['kasse', KASSE], ['logbog', LOGBOG], ['plante', PLANTE],
    ];
    for (const [n, t] of alle) tjek(n, t);
  });

  it('tegner hovedpersonen i alle retninger, gangbilleder og avatarvalg', () => {
    for (const hoved of [0, 1, 2, 3])
      for (const tilbehoer of [0, 1, 3])
        for (const toej of [0, 2])
          for (const r of ['ned', 'op', 'hoejre', 'venstre'] as const)
            for (const f of [0, 1, 2] as const) {
              const t = avatarPixel({ ...STANDARD_AVATAR, hoved, tilbehoer, toej }, r, f);
              expect(t.raekker).toHaveLength(24);
              tjek(`avatar ${hoved}/${tilbehoer}/${toej}/${r}/${f}`, t);
            }
  });

  it('bruger elevens hudfarve og tøjfarve', () => {
    const a = avatarPixel({ ...STANDARD_AVATAR, hud: 7, toejfarve: 4 }, 'ned', 0);
    expect(a.palet.S).toBe('#4a2b1b');
    expect(a.palet.T).toBe('#2c6fbb');
  });
});
