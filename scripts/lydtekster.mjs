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

  // Frivilligt indhold (9. november 2026): intro på et sted, udflugter og sidemissioner.
  for (const k of kapitler) {
    const navn = `Kapitel ${k.kapitel}`;
    for (const [stedId, sted] of Object.entries(k.steder)) {
      (sted.intro ?? []).forEach((r, i) => tilfoej(r.taler, r.tekst, `${navn} / ${stedId}.intro.${i + 1}`));
      const u = sted.udflugt;
      if (u) for (const felt of ['ind', 'faerdig', 'igen']) u[felt].forEach((r, i) => tilfoej(r.taler, r.tekst, `${navn} / ${stedId}.${felt}.${i + 1}`));
    }
    for (const [id, m] of Object.entries(k.missioner ?? {}))
      for (const felt of ['start', 'mangler', 'klar', 'faerdig', 'efter']) m[felt].forEach((r, i) => tilfoej(r.taler, r.tekst, `${navn} / ${id}.${felt}.${i + 1}`));
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
  for (const id of ['intro.1', 'intro.2', 'intro.3', 'intro.4', 'intro.5', 'intro.5.slut'])
    tilfoej('fortaeller', t(id), `Introen / ${id}`);

  // Minderne (src/ui/Tilbageblik.tsx, teksterne i src/content/minder.ts): hver del er et klip, også de milde udgaver.
  for (const id of Object.keys(da).filter((k) => /^minde\.\w+\.\d+(\.mild)?$/.test(k)))
    tilfoej('fortaeller', t(id), `Minder / ${id}`);

  // Kampe (src/ui/KampVindue.tsx): væsnernes egne ord, sætningerne til knappen Læs og beskederne.
  for (const v of ['tomordet', 'stumming', 'tvivl', 'krusedulle', 'halvsaetning']) {
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
    'ogorm.klip.instruks', 'ogorm.pas.paa', 'bro.instruks', 'bro.instruks.fremmed', 'bevisjagt.foer', 'bevisjagt.instruks',
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
  // Rim og rytme (kapitel 4, Ekkoet i kampen) har også Æseløres stemme (Henrik, 10. november 2026).
  for (const id of ['rim', 'rytme']) {
    tilfoej('aeseloere', `${t('feedback.regel')}: ${t(`${id}.regel`)}`, `Beskeder / ${id}.regel`);
    tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t(`${id}.eksempel`)}`, `Beskeder / ${id}.eksempel`);
  }
  // Eksemplet i Hviskeskuffen: de tre første lette ord med samme regel (som HviskeVindue i OpgaveVindue.tsx).
  for (const o of stumme.ord) {
    const eksempler = stumme.ord
      .filter((x) => x.type === o.type && x.ord !== o.ord && x.svaerhed === 1)
      .slice(0, 3)
      .map((x) => x.ord)
      .join(', ');
    tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('hviske.eksempel', { ord: eksempler })}`, `Beskeder / hviske.eksempel.${o.ord}`);
    // Stummingen i kampen bruger samme ord, men sin egen sætning (regelFor i src/ui/KampVindue.tsx).
    tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('kamp.stumming.eksempel', { ord: eksempler })}`, `Beskeder / kamp.stumming.eksempel.${o.ord}`);
  }

  // Fru Fodnotes bøger og Den Tvivlende Sætning (kapitel 5): sætningerne, spørgsmålene, reglen og eksemplet.
  const fort = laes('ord/fortaeller.json');
  for (const o of fort.klassificer) tilfoej('fortaeller', o.tekst, `Fortæller / ${o.id}`);
  for (const o of fort.fortsaet) tilfoej('fortaeller', `${o.foer} ... ${o.efter}`, `Fortæller / ${o.id}`);
  for (const id of ['fortaeller.spoergsmaal', 'fortaeller.fortsaet.spoergsmaal']) tilfoej('fortaeller', t(id), `Opgaver / ${id}`);
  for (const id of ['fortaeller.rigtig.jeg', 'fortaeller.rigtig.hanhun', 'fortaeller.fejl.jeg', 'fortaeller.fejl.hanhun'])
    tilfoej('aeseloere', t(id), `Beskeder / ${id}`);
  tilfoej('aeseloere', `${t('feedback.regel')}: ${t('fortaeller.regel')}`, 'Beskeder / fortaeller.regel');
  tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('fortaeller.eksempel')}`, 'Beskeder / fortaeller.eksempel');

  // Klattens tekster (kapitel 6): teksten læses op, som Klatten skrev den. Sætningerne i kampen og på stenene læses rettet.
  const kor = laes('ord/korrektur.json');
  for (const k of kor.tekster) {
    tilfoej('klatten', k.tekst.replace(/\{(\d+)\}/g, (_, n) => k.fejl[Number(n)].skrevet), `Klattens tekster / ${k.id}`);
    // Hver fejls sætning (som saetningMed i src/mechanics/korrektur.ts).
    k.fejl.forEach((f, nr) => {
      const plads = k.tekst.indexOf(`{${nr}}`);
      const start = Math.max(...['. ', '? ', '! '].map((x) => k.tekst.lastIndexOf(x, plads)).map((i) => (i < 0 ? 0 : i + 2)));
      const ender = ['.', '?', '!'].map((x) => k.tekst.indexOf(x, plads)).filter((i) => i >= 0);
      const slut = ender.length ? Math.min(...ender) + 1 : k.tekst.length;
      const ret = (x) => x.replace(/\{(\d+)\}/g, (_, n) => k.fejl[Number(n)].rigtig);
      tilfoej('fortaeller', ret(k.tekst.slice(start, slut)), `Klattens tekster / ${k.id}.${nr}`);
    });
  }
  for (const id of ['korrektur.instruks.en', 'korrektur.faerdig']) tilfoej('fortaeller', t(id), `Opgaver / ${id}`);
  for (const antal of [2, 3]) tilfoej('fortaeller', t('korrektur.instruks', { antal }), `Opgaver / korrektur.instruks.${antal}`);
  for (const [type, regel] of Object.entries(kor.regler)) tilfoej('aeseloere', `${t('feedback.regel')}: ${regel}`, `Beskeder / korrektur.regel.${type}`);
  for (const [type, eks] of Object.entries(kor.eksempler)) tilfoej('aeseloere', `${t('feedback.eksempel')}: ${eks}`, `Beskeder / korrektur.eksempel.${type}`);
  tilfoej('aeseloere', `${t('feedback.regel')}: ${t('korrektur.find.regel')}`, 'Beskeder / korrektur.find.regel');
  tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('korrektur.find.eksempel')}`, 'Beskeder / korrektur.find.eksempel');
  for (const id of ['kamp.klatten.ingen', 'korrektur.klatten.1', 'korrektur.klatten.2', 'korrektur.klatten.3', 'korrektur.klatten.4'])
    tilfoej('klatten', t(id), `Kampe og opgaver / ${id}`);

  // Halvsætningerne (kapitel 8): sætningerne læses op færdige.
  const halv = laes('ord/halvsaetning.json');
  for (const x of halv.slut) tilfoej('fortaeller', `${x.foer} ${x.svar}`, `Halvsætninger / ${x.id}`);
  for (const x of halv.tegn) tilfoej('fortaeller', `${x.saetning}${x.tegn}`, `Halvsætninger / ${x.id}`);
  for (const k of ['slut', 'tegn']) {
    tilfoej('aeseloere', `${t('feedback.regel')}: ${halv.regler[k]}`, `Beskeder / halvsaetning.regel.${k}`);
    tilfoej('aeseloere', `${t('feedback.eksempel')}: ${halv.eksempler[k]}`, `Beskeder / halvsaetning.eksempel.${k}`);
  }

  // Genrerne (kapitel 7): tekststykkerne, spørgsmålene, reglerne og eksemplerne.
  const gen = laes('ord/genre.json');
  for (const x of gen.tekster) tilfoej('fortaeller', x.tekst, `Genrer / ${x.id}`);
  tilfoej('fortaeller', t('genre.klassificer'), 'Opgaver / genre.klassificer');
  for (const [g, navn] of Object.entries(gen.navne)) {
    tilfoej('fortaeller', t('genre.kendetegn', { genre: navn.toLowerCase() }), `Opgaver / genre.kendetegn.${g}`);
    tilfoej('aeseloere', `${t('feedback.regel')}: ${gen.regler[g]}`, `Beskeder / genre.regel.${g}`);
    tilfoej('aeseloere', `${t('feedback.eksempel')}: ${gen.eksempler[g]}`, `Beskeder / genre.eksempel.${g}`);
  }
  tilfoej('aeseloere', `${t('feedback.regel')}: ${t('genre.regel')}`, 'Beskeder / genre.regel');
  tilfoej('aeseloere', `${t('feedback.eksempel')}: ${t('genre.eksempel')}`, 'Beskeder / genre.eksempel');

  for (const h of laes('ord/historiebro.json').historier) {
    for (const [traek, tekst] of Object.entries(h.planker)) tilfoej('fortaeller', tekst, `Historiebroen / ${h.id}.${traek}`);
    tilfoej('fortaeller', h.fremmed, `Historiebroen / ${h.id}.fremmed`);
  }
  return ud;
}
