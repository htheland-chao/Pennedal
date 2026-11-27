import { describe, expect, it } from 'vitest';
import { kapitler, type FilmTrin } from '../../content';
import { SANGE } from '../../lyd/musik/sange';
import { EFFEKTER } from '../../lyd/effekter';
import { tjekFilm } from './tjek';
import { skjultFoerFilm, vaekEfterFilm } from './sekvens';
import { filmReplikker } from '../../content/filmreplikker.mjs';

// Alle filmsekvenser i kapitlerne (20. november 2026): navne, regler og tider tjekkes, før de kommer i spillet.
const film = kapitler.flatMap((k) => k.trin.filter((t): t is FilmTrin => t.type === 'film').map((t) => ({ k, t })));

describe('filmsekvenserne i kapitlerne', () => {
  it('findes: ankomsten, mørket i kapitel 2-4, twistet i arkivet, Krusedullerne, fristelsen og slutningen', () => {
    expect(film.map(({ t }) => t.id)).toEqual(
      expect.arrayContaining(['k1-ankomst', 'k2-moerke', 'k3-moerke', 'k4-moerke', 'k5-twist', 'k6-krusedul', 'k7-fristelse', 'k8-oplaesning']),
    );
  });

  for (const { k, t } of film)
    it(`${t.id} består tjekket`, () => {
      const sted = k.steder[t.sted];
      const kendte = {
        // På en platformbane er Klatten tegnet i banen (K), ikke et objekt.
        figurer: new Set(['aeseloere', ...sted.objekter.map((o) => o.id), ...(sted.bane?.some((r) => r.includes('K')) ? ['klatten'] : [])]),
        temaer: new Set(Object.keys(SANGE)),
        effekter: new Set(Object.keys(EFFEKTER)),
      };
      expect(tjekFilm(t.handlinger, kendte)).toEqual([]);
      // En film starter af sig selv eller ved en figur på stedet, og den har replikker, eleven læser.
      if (t.objekt) expect(sted.objekter.map((o) => o.id)).toContain(t.objekt);
      expect(filmReplikker(t.handlinger).length).toBeGreaterThan(0);
      // På en platformbane følger kameraet hovedpersonen, og ingen går eller vender sig (src/game/bane/film.ts).
      if (sted.bane) expect(JSON.stringify(t.handlinger), t.id).not.toMatch(/"type":"kamera"|"gaaTil"|"vend"/);
      // En figur, der toner væk, bliver væk: stedet skal skjule den fra det næste trin (ikke hvis kapitlet slutter).
      if (!t.slutKapitel) {
        const naeste = k.trin[k.trin.indexOf(t) + 1]?.id;
        for (const id of vaekEfterFilm(t.handlinger)) {
          const o = sted.objekter.find((x) => x.id === id);
          expect(o?.skjulFra, `${t.id}: ${id} skal have skjulFra ${naeste}`).toBe(naeste);
        }
      }
      // Filmen slutter uden bjælker, så eleven har styringen igen.
      const bjaelker = JSON.stringify(t.handlinger).match(/"type":"bjaelker","til":(true|false)/g) ?? [];
      expect(bjaelker.at(-1), t.id).toBe('"type":"bjaelker","til":false');
    });

  it('skjuler Æseløre, indtil han toner frem i ankomsten', () => {
    const t = film.find(({ t }) => t.id === 'k1-ankomst')!.t;
    expect(skjultFoerFilm(t.handlinger)).toEqual(['aeseloere']);
  });

  it('skjuler kun figurer, hvis første toning er frem', () => {
    expect(
      skjultFoerFilm([
        { type: 'figur', id: 'klatten', toner: 'vaek' },
        { type: 'samtidig', handlinger: [{ type: 'figur', id: 'holm', toner: 'frem' }] },
        { type: 'figur', id: 'klatten', toner: 'frem' },
      ]),
    ).toEqual(['holm']);
  });

  it('afviser gang for andre end hovedpersonen og en stemning, der intet gør', () => {
    const kendte = { figurer: new Set(['aeseloere', 'holm']), temaer: new Set<string>(), effekter: new Set<string>() };
    expect(tjekFilm([{ type: 'figur', id: 'holm', gaaTil: [1, 1] }], kendte)).toEqual(['kun hovedpersonen kan gå, ikke holm']);
    expect(tjekFilm([{ type: 'figur', id: 'aeseloere', vend: 'venstre' }], kendte)).toHaveLength(1);
    expect(tjekFilm([{ type: 'stemning' }], kendte)).toEqual(['stemning gør ingenting']);
    expect(tjekFilm([{ type: 'musik', tema: 'stille' }], kendte)).toEqual([]);
  });
});
