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

  it('har klip med Æseløres stemme til alle regler og eksempler, også i kampene (Henrik, 10. november 2026)', () => {
    const par: { regel: string; eksempel: string }[] = [
      { regel: t('rim.regel'), eksempel: t('rim.eksempel') },
      { regel: t('rytme.regel'), eksempel: t('rytme.eksempel') },
      { regel: t('kamp.tomordet.regel'), eksempel: t('kamp.tomordet.eksempel') },
      { regel: t('fortaeller.regel'), eksempel: t('fortaeller.eksempel') },
      { regel: t('genre.regel'), eksempel: t('genre.eksempel') },
      { regel: t('korrektur.find.regel'), eksempel: t('korrektur.find.eksempel') },
    ];
    // Stummingen: reglen for ordets type og tre andre lette ord med samme regel (som regelFor i KampVindue.tsx).
    for (const o of stumme.ord) {
      const andre = stumme.ord.filter((x) => x.type === o.type && x.ord !== o.ord && x.svaerhed === 1).slice(0, 3).map((x) => x.ord).join(', ');
      par.push({ regel: stumme.regler[o.type as keyof typeof stumme.regler], eksempel: t('kamp.stumming.eksempel', { ord: andre }) });
    }
    for (const p of par) for (const d of beskedDele('', p, null, false).slice(1)) expect(findes('aeseloere', d.tekst), d.tekst).toBe(true);
  });

  it('har klip til titelkortene (kapitlets navn og mål)', async () => {
    const { kapitelkortDele } = await import('./Kapitelkort');
    for (const k of kapitler) for (const d of kapitelkortDele(k)) expect(findes('fortaeller', d.tekst), d.tekst).toBe(true);
    for (const id of ['intro.6', 'intro.6.slut'] as const) expect(findes('fortaeller', t(id)), id).toBe(true);
  });

  it('har klip til instrukserne i opgaverne', () => {
    // ogorm.klip.instruks (den nye Og-orm, 8. november 2026) kommer med her, når lydjobbet har lavet klippet.
    for (const id of ['hviske.instruks.vaelg', 'hviske.instruks.helt', 'bro.instruks', 'bevisjagt.instruks'] as const)
      expect(findes('fortaeller', t(id)), id).toBe(true);
  });
});
