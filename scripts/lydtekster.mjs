// Alle tekster, der skal have et indtalt lydklip, og hvilken figur der siger dem.
// Kun spillets egne, faste tekster fra src/content. Elevtekster kommer aldrig med her.
import { readFileSync } from 'node:fs';
import { lydNoegle } from '../src/content/lydnoegle.mjs';
import { renTekst } from './tekster.mjs';

const laes = (sti) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8'));

export function hentStemmer() {
  return laes('stemmer.json');
}

/** @returns {{ noegle: string, figur: string, tekst: string, raa: string, kilde: string }[]} */
export function alleLydtekster(stemmer = hentStemmer()) {
  const ud = [];
  const set = new Set();
  const tilfoej = (figur, raa, kilde) => {
    const tekst = renTekst(raa).trim();
    if (!tekst) return;
    const noegle = lydNoegle(tekst, figur, stemmer);
    if (!noegle) throw new Error(`Figuren "${figur}" mangler i src/content/stemmer.json (${kilde})`);
    if (set.has(noegle)) return;
    set.add(noegle);
    ud.push({ noegle, figur, tekst, raa, kilde });
  };

  const k1 = laes('kapitler/kapitel1.json');
  for (const trin of k1.trin) {
    (trin.replikker ?? []).forEach((r, i) => tilfoej(r.taler, r.tekst, `Kapitel 1 / ${trin.id}.${i + 1}`));
    // Bevisjagten læser alle sætninger op i ét klip, ligesom knappen i spillet gør.
    if (trin.saetninger) tilfoej('fortaeller', trin.saetninger.map(renTekst).join(' '), `Kapitel 1 / ${trin.id}.saetninger`);
  }

  for (const o of laes('ord/stumme.json').ord) tilfoej('ord', o.ord, `Stumme bogstaver / ${o.ord}`);
  for (const [id, k] of Object.entries(laes('ordkort.json'))) tilfoej('ord', k.ord, `Ordkort / ${id}`);

  // Opgaver og beskeder (Henrik valgte "kun det vigtigste" 31. oktober 2026). Knapper og menuer har ikke klip.
  // Teksterne skal stå præcis, som spillet viser dem (se OpgaveRamme.beskedDele og opgavekomponenterne).
  const da = laes('tekster/da.json');
  const t = (id, v = {}) => {
    if (!(id in da)) throw new Error(`Mangler tekst: ${id}`);
    return da[id].replace(/\{(\w+)\}/g, (_, k) => (k in v ? String(v[k]) : `{${k}}`));
  };
  for (const trin of k1.trin) {
    if (trin.opgavetekst) tilfoej('fortaeller', trin.opgavetekst, `Kapitel 1 / ${trin.id}.opgavetekst`);
    for (const spg of trin.spoergsmaal ?? []) {
      tilfoej('fortaeller', spg.tekst, `Kapitel 1 / ${trin.id}.${spg.id}`);
      if (spg.standard) tilfoej('aeseloere', spg.standard, `Kapitel 1 / ${trin.id}.${spg.id}.standard`);
      for (const [nr, tekst] of Object.entries(spg.forkert ?? {})) tilfoej('aeseloere', tekst, `Kapitel 1 / ${trin.id}.${spg.id}.forkert.${nr}`);
    }
  }
  for (const id of [
    'hviske.instruks.vaelg', 'hviske.instruks.skriv', 'hviske.instruks.to', 'hviske.instruks.helt',
    'ogorm.instruks', 'bro.instruks', 'bro.instruks.fremmed', 'bevisjagt.foer', 'bevisjagt.instruks',
  ])
    tilfoej('fortaeller', t(id), `Opgaver / ${id}`);
  for (const id of [
    'opgave.ros.1', 'opgave.ros.2', 'opgave.ros.3', 'opgave.ros.4', 'opgave.ros.foersteforsoeg', 'opgave.proev.igen',
    'opgave.regel.rigtig', 'opgave.regel.forkert', 'opgave.niveau.op', 'opgave.niveau.ned', 'opgave.vaelg.regel',
    'ogorm.fejl.mangler', 'ogorm.fejl.bliv', 'ogorm.fejl.stort', 'ogorm.fejl.lille', 'ogorm.fejl.navn',
    'bro.fejl.fremmed', 'bro.fejl.fjernet',
  ])
    tilfoej('aeseloere', t(id), `Beskeder / ${id}`);
  const traek = ['problem', 'portal', 'verden', 'konflikt', 'loesning', 'hjemkomst'];
  for (let nr = 1; nr <= traek.length; nr++)
    for (const tr of traek) tilfoej('aeseloere', t('bro.fejl.placering', { nr, hint: t(`bro.hint.${tr}`) }), `Beskeder / bro.fejl.placering.${nr}.${tr}`);
  const stumme = laes('ord/stumme.json');
  const regler = [...Object.values(stumme.regler), t('ogorm.regel'), t('bro.regel'), t('bevisjagt.regel')];
  for (const r of regler) tilfoej('aeseloere', `${t('feedback.regel')}: ${r}`, 'Beskeder / regel');
  for (const id of ['ogorm.eksempel', 'bro.eksempel', 'bevisjagt.eksempel'])
    tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t(id)}`, `Beskeder / ${id}`);
  // Eksemplet i Hviskeskuffen: de tre første lette ord med samme regel (som HviskeVindue i OpgaveVindue.tsx).
  for (const o of stumme.ord) {
    const eksempler = stumme.ord
      .filter((x) => x.type === o.type && x.ord !== o.ord && x.svaerhed === 1)
      .slice(0, 3)
      .map((x) => x.ord)
      .join(', ');
    tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('hviske.eksempel', { ord: eksempler })}`, `Beskeder / hviske.eksempel.${o.ord}`);
  }

  for (const h of laes('ord/historiebro.json').historier) {
    for (const [traek, tekst] of Object.entries(h.planker)) tilfoej('fortaeller', tekst, `Historiebroen / ${h.id}.${traek}`);
    tilfoej('fortaeller', h.fremmed, `Historiebroen / ${h.id}.fremmed`);
  }
  return ud;
}
