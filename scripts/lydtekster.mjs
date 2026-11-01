// Alle tekster, der skal have et indtalt lydklip, og hvilken figur der siger dem.
// Kun spillets egne, faste tekster fra src/content. Elevtekster kommer aldrig med her.
import { readdirSync, readFileSync } from 'node:fs';
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

  // Alle kapitler i src/content/kapitler, i rækkefølge.
  const kapitler = readdirSync(new URL('../src/content/kapitler/', import.meta.url))
    .filter((f) => /^kapitel\d+\.json$/.test(f))
    .map((f) => laes(`kapitler/${f}`))
    .sort((a, b) => a.kapitel - b.kapitel);
  for (const k of kapitler)
    for (const trin of k.trin) {
      const navn = `Kapitel ${k.kapitel}`;
      (trin.replikker ?? []).forEach((r, i) => tilfoej(r.taler, r.tekst, `${navn} / ${trin.id}.${i + 1}`));
      // Valg i en dialog: hver mulighed har sine egne replikker.
      (trin.valg?.muligheder ?? []).forEach((m, j) =>
        m.replikker.forEach((r, i) => tilfoej(r.taler, r.tekst, `${navn} / ${trin.id}.valg${j + 1}.${i + 1}`)),
      );
      // Bevisjagten læser alle sætninger op i ét klip, ligesom knappen i spillet gør.
      if (trin.saetninger) tilfoej('fortaeller', trin.saetninger.map(renTekst).join(' '), `${navn} / ${trin.id}.saetninger`);
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
  for (const k of kapitler)
  for (const trin of k.trin) {
    if (trin.opgavetekst) tilfoej('fortaeller', trin.opgavetekst, `Kapitel ${k.kapitel} / ${trin.id}.opgavetekst`);
    for (const spg of trin.spoergsmaal ?? []) {
      tilfoej('fortaeller', spg.tekst, `Kapitel ${k.kapitel} / ${trin.id}.${spg.id}`);
      if (spg.standard) tilfoej('aeseloere', spg.standard, `Kapitel ${k.kapitel} / ${trin.id}.${spg.id}.standard`);
      for (const [nr, tekst] of Object.entries(spg.forkert ?? {})) tilfoej('aeseloere', tekst, `Kapitel ${k.kapitel} / ${trin.id}.${spg.id}.forkert.${nr}`);
    }
  }
  // Escape room: det, fortælleren siger ved hvert fund, sedler og låsen. Æseløre siger reglen ved forkert kode.
  for (const k of kapitler)
    for (const trin of k.trin) {
      if (trin.type !== 'rum') continue;
      const navn = `Kapitel ${k.kapitel} / ${trin.id}`;
      for (const f of trin.fund) {
        tilfoej('fortaeller', f.tekst, `${navn}.${f.objekt}`);
        (f.laesning ?? []).forEach((l, i) => tilfoej('fortaeller', l, `${navn}.${f.objekt}.${i + 1}`));
      }
      for (const felt of ['mangler', 'gaade', 'aabnet']) tilfoej('fortaeller', trin.laas[felt], `${navn}.laas.${felt}`);
      tilfoej('aeseloere', `${t('feedback.regel')}: ${trin.laas.regel}`, `${navn}.laas.regel`);
      tilfoej('aeseloere', `${t('feedback.eksempel')}: ${trin.laas.eksempel}`, `${navn}.laas.eksempel`);
    }
  tilfoej('aeseloere', t('rum.forkert'), 'Beskeder / rum.forkert');
  tilfoej('aeseloere', t('bane.hjaelp.tekst'), 'Beskeder / bane.hjaelp.tekst');

  // Råberens tegn: hver sætning råbt op med det rigtige tegn, instruksen og beskederne.
  const raaber = laes('ord/raaber.json');
  for (const x of raaber.saetninger) tilfoej('raaber', `${x.tekst}${x.tegn}`, `Råberens tegn / ${x.id}`);
  tilfoej('fortaeller', t('raaber.instruks'), 'Opgaver / raaber.instruks');
  for (const id of ['raaber.fejl.punktum', 'raaber.fejl.indirekte', 'raaber.fejl.spoergsmaal', 'raaber.fejl.udraab'])
    tilfoej('aeseloere', t(id), `Beskeder / ${id}`);
  tilfoej('aeseloere', `${t('feedback.regel')}: ${t('raaber.regel')}`, 'Beskeder / raaber.regel');
  tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('raaber.eksempel')}`, 'Beskeder / raaber.eksempel');

  // Introen (src/ui/Intro.tsx).
  // Introen kan fortælles af to stemmer, så Henrik kan vælge: den nuværende og den dybe gamle mand.
  for (const id of ['intro.1', 'intro.2', 'intro.3', 'intro.4', 'intro.5', 'intro.5.slut']) {
    tilfoej('fortaeller', t(id), `Introen / ${id}`);
    tilfoej('introfortaeller', t(id), `Introen (gammel mand) / ${id}`);
  }
  tilfoej('ufaerdige', t('intro.4.hvisken'), 'Introen / intro.4.hvisken');

  // Minderne (src/ui/Tilbageblik.tsx, teksterne i src/content/minder.ts): hver del er et klip, også de milde udgaver.
  for (const id of Object.keys(da).filter((k) => /^minde\.\w+\.\d+(\.mild)?$/.test(k)))
    tilfoej('fortaeller', t(id), `Minder / ${id}`);

  // Kampe (src/ui/KampVindue.tsx): væsnernes egne ord, sætningerne til knappen Læs og beskederne.
  for (const v of ['tomordet', 'stumming']) {
    tilfoej(v, t(`kamp.${v}.lyt`), `Kampe / kamp.${v}.lyt`);
    tilfoej('fortaeller', t(`kamp.${v}.rolig`), `Kampe / kamp.${v}.rolig`);
  }
  tilfoej('vims', t('kamp.vims.visk'), 'Kampe / kamp.vims.visk');
  tilfoej('vims', t('kamp.vims.ingen'), 'Kampe / kamp.vims.ingen');
  tilfoej('aeseloere', `${t('feedback.regel')}: ${t('kamp.tomordet.regel')}`, 'Kampe / kamp.tomordet.regel');
  tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('kamp.tomordet.eksempel')}`, 'Kampe / kamp.tomordet.eksempel');
  for (const o of laes('ord/synonymer.json').ord) tilfoej('fortaeller', o.saetning, `Synonymer / ${o.id}`);
  for (const o of laes('ord/stumme.json').ord) tilfoej('fortaeller', o.saetning, `Stumme bogstaver / ${o.ord}.saetning`);

  // Tasken (src/ui/TaskeVindue.tsx): navn og tekst læses op sammen.
  for (const id of ['lanterne', 'kappe', 'logbog', 'punktum', 'krummer', 'rimsten', 'haefte'])
    tilfoej('fortaeller', `${t(`ting.${id}.navn`)}. ${t(`ting.${id}.tekst`)}`, `Tasken / ${id}`);

  for (const id of [
    'hviske.instruks.vaelg', 'hviske.instruks.skriv', 'hviske.instruks.to', 'hviske.instruks.helt',
    'ogorm.instruks', 'ogorm.trin.1', 'ogorm.trin.2', 'ogorm.trin.3', 'ogorm.pas.paa', 'bro.instruks', 'bro.instruks.fremmed', 'bevisjagt.foer', 'bevisjagt.instruks',
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
