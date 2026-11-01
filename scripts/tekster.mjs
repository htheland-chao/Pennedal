// Samler al dansk tekst i spillet ét sted, så den kan stavetjekkes og læses korrektur på.
import { readdirSync, readFileSync } from 'node:fs';

const laes = (sti) => JSON.parse(readFileSync(new URL(`../src/content/${sti}`, import.meta.url), 'utf8'));

/** Fjerner ordkort-markering og markeringer i Og-ormens tekster. */
export function renTekst(tekst) {
  return tekst
    .replace(/\{\{([^}|]+)(?:\|[^}]+)?\}\}/g, '$1')
    .replace(/\{[sbn]\}/g, '');
}

/** @returns {{ kilde: string, id: string, tekst: string, bevidstFejl?: boolean, note?: string }[]} */
export function alleTekster() {
  const ud = [];
  const da = laes('tekster/da.json');
  for (const [id, tekst] of Object.entries(da)) ud.push({ kilde: 'Brugerflade', id, tekst });

  // Alle kapitler i src/content/kapitler, i rækkefølge.
  const kapitler = readdirSync(new URL('../src/content/kapitler/', import.meta.url))
    .filter((f) => /^kapitel\d+\.json$/.test(f))
    .map((f) => laes(`kapitler/${f}`))
    .sort((a, b) => a.kapitel - b.kapitel);
  for (const k of kapitler) {
    const kilde = `Kapitel ${k.kapitel}`;
    const replik = (id, r) => ud.push({ kilde, id: `${id} (${r.taler})`, tekst: r.tekst, bevidstFejl: r.bevidstFejl });
    ud.push({ kilde, id: 'titel', tekst: k.titel });
    for (const [stedId, sted] of Object.entries(k.steder)) {
      ud.push({ kilde, id: `sted.${stedId}`, tekst: sted.navn });
      for (const o of sted.objekter) ud.push({ kilde, id: `objekt.${o.id}`, tekst: o.navn });
    }
    for (const trin of k.trin) {
      if (trin.opgavetekst) ud.push({ kilde, id: `${trin.id}.opgavetekst`, tekst: trin.opgavetekst });
      (trin.replikker ?? []).forEach((r, i) => replik(`${trin.id}.${i + 1}`, r));
      if (trin.valg) {
        ud.push({ kilde, id: `${trin.id}.valg`, tekst: trin.valg.spoergsmaal });
        trin.valg.muligheder.forEach((m, j) => {
          ud.push({ kilde, id: `${trin.id}.valg.${j + 1}`, tekst: m.tekst });
          m.replikker.forEach((r, i) => replik(`${trin.id}.valg.${j + 1}.${i + 1}`, r));
        });
      }
      if (trin.titel) ud.push({ kilde, id: `${trin.id}.titel`, tekst: trin.titel });
      (trin.saetninger ?? []).forEach((s, i) => ud.push({ kilde, id: `${trin.id}.saetning.${i}`, tekst: s }));
      for (const spg of trin.spoergsmaal ?? []) {
        ud.push({ kilde, id: spg.id, tekst: spg.tekst });
        ud.push({ kilde, id: `${spg.id}.standard`, tekst: spg.standard });
        for (const [nr, f] of Object.entries(spg.forkert)) ud.push({ kilde, id: `${spg.id}.forkert.${nr}`, tekst: f });
      }
      for (const f of trin.fund ?? []) {
        ud.push({ kilde, id: `${trin.id}.${f.objekt}`, tekst: f.tekst });
        if (f.tingNavn) ud.push({ kilde, id: `${trin.id}.${f.objekt}.ting`, tekst: f.tingNavn });
        (f.laesning ?? []).forEach((l, i) => ud.push({ kilde, id: `${trin.id}.${f.objekt}.${i + 1}`, tekst: l }));
      }
      if (trin.laas) {
        for (const felt of ['mangler', 'gaade', 'aabnet', 'regel', 'eksempel'])
          if (trin.laas[felt]) ud.push({ kilde, id: `${trin.id}.laas.${felt}`, tekst: trin.laas[felt] });
      }
    }
  }

  const stumme = laes('ord/stumme.json');
  for (const [type, regel] of Object.entries(stumme.regler)) ud.push({ kilde: 'Stumme bogstaver', id: `regel.${type}`, tekst: regel });
  for (const o of stumme.ord) {
    ud.push({ kilde: 'Stumme bogstaver', id: `${o.ord}.ord`, tekst: o.ord });
    ud.push({ kilde: 'Stumme bogstaver', id: `${o.ord}.saetning`, tekst: o.saetning });
    ud.push({ kilde: 'Stumme bogstaver', id: `${o.ord}.forklaring`, tekst: o.forklaring });
  }

  const og = laes('ord/ogorm.json');
  for (const t of og.tekster) {
    ud.push({
      kilde: 'Og-ormen',
      id: t.id,
      tekst: t.tekst,
      bevidstFejl: true,
      note: 'Bevidst uden punktummer. Facit står i korrekturlisten.',
    });
  }

  const bro = laes('ord/historiebro.json');
  for (const h of bro.historier) {
    ud.push({ kilde: 'Historiebroen', id: `${h.id}.titel`, tekst: h.titel });
    for (const [traek, tekst] of Object.entries(h.planker)) ud.push({ kilde: 'Historiebroen', id: `${h.id}.${traek}`, tekst });
    ud.push({ kilde: 'Historiebroen', id: `${h.id}.fremmed`, tekst: h.fremmed, note: 'Bevidst forkert planke: Her løser en anden problemet.' });
  }

  for (const x of laes('ord/raaber.json').saetninger)
    ud.push({ kilde: 'Råberens tegn', id: x.id, tekst: `${x.tekst}${x.tegn}` });

  for (const o of laes('ord/synonymer.json').ord) {
    ud.push({ kilde: 'Synonymer (Tomordet)', id: `${o.id}.saetning`, tekst: o.saetning });
    ud.push({ kilde: 'Synonymer (Tomordet)', id: `${o.id}.svar`, tekst: [o.ord, o.svar, ...o.forkerte].join(', '), note: `Synonym til ${o.ord}: ${o.svar}` });
  }

  for (const [id, k] of Object.entries(laes('ordkort.json'))) {
    ud.push({ kilde: 'Ordkort', id: `${id}.ord`, tekst: k.ord });
    ud.push({ kilde: 'Ordkort', id: `${id}.forklaring`, tekst: k.forklaring });
    ud.push({ kilde: 'Ordkort', id: `${id}.eksempel`, tekst: k.eksempel });
  }

  const navne = laes('avatar/navne.json');
  ud.push({ kilde: 'Avatar', id: 'adjektiver', tekst: navne.adjektiver.join(', ') });
  ud.push({ kilde: 'Avatar', id: 'dyr', tekst: navne.dyr.join(', ') });
  for (const [del, d] of Object.entries(laes('avatar/dele.json'))) {
    if (d.valg) ud.push({ kilde: 'Avatar', id: `${del}.valg`, tekst: d.valg.join(', ') });
  }
  ud.push({ kilde: 'Fælles Mål', id: 'maal.json', tekst: 'Citeret ordret fra ministeriet. Ikke rettet.', note: 'Tjekkes ikke' });
  return ud;
}
