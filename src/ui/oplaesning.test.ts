// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { kapitler, renTekst, t } from '../content';
import stumme from '../content/ord/stumme.json';
import { alleLydtekster } from '../../scripts/lydtekster.mjs';
import { beskedDele } from './OpgaveRamme';

// Det, spillet læser op, skal stå præcis sådan i lydteksterne, ellers bliver der aldrig lavet et klip.
const poster = alleLydtekster();
const findes = (figur: string, tekst: string) => poster.some((p) => p.figur === figur && p.tekst === renTekst(tekst).trim());

describe('indtaling af opgaver og beskeder', () => {
  it('har klip til opgaveteksterne i panelet og spørgsmålene i bevisjagten', () => {
    for (const k of kapitler)
      for (const trin of k.trin) {
        if (trin.opgavetekst) expect(findes('fortaeller', trin.opgavetekst), trin.id).toBe(true);
        for (const spg of (trin as { spoergsmaal?: { tekst: string }[] }).spoergsmaal ?? [])
          expect(findes('fortaeller', spg.tekst), spg.tekst).toBe(true);
      }
  });

  it('har klip til beskeder med regel og eksempel', () => {
    const regel = Object.values(stumme.regler)[0];
    const ord = stumme.ord[0];
    const eksempler = stumme.ord
      .filter((o) => o.type === ord.type && o.ord !== ord.ord && o.svaerhed === 1)
      .slice(0, 3)
      .map((o) => o.ord)
      .join(', ');
    const dele = beskedDele(t('opgave.proev.igen'), { regel, eksempel: t('hviske.eksempel', { ord: eksempler }) }, t('opgave.niveau.ned'), true);
    expect(dele).toHaveLength(5);
    for (const d of dele) expect(findes(d.figur!, d.tekst), d.tekst).toBe(true);
    for (const id of ['ogorm', 'bro', 'bevisjagt'] as const) {
      const d = beskedDele(t('opgave.proev.igen'), { regel: t(`${id}.regel`), eksempel: t(`${id}.eksempel`) }, null, false);
      for (const x of d) expect(findes('aeseloere', x.tekst), x.tekst).toBe(true);
    }
    expect(findes('aeseloere', t('bro.fejl.placering', { nr: 3, hint: t('bro.hint.konflikt') }))).toBe(true);
  });

  it('har klip til instrukserne i opgaverne', () => {
    for (const id of ['hviske.instruks.vaelg', 'hviske.instruks.helt', 'ogorm.instruks', 'bro.instruks', 'bevisjagt.instruks'] as const)
      expect(findes('fortaeller', t(id)), id).toBe(true);
  });
});
