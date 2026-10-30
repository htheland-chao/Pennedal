// Samler al dansk tekst i spillet ét sted, så den kan stavetjekkes og læses korrektur på.
import { readFileSync } from 'node:fs';

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

  const k1 = laes('kapitler/kapitel1.json');
  ud.push({ kilde: 'Kapitel 1', id: 'titel', tekst: k1.titel });
  for (const [stedId, sted] of Object.entries(k1.steder)) {
    ud.push({ kilde: 'Kapitel 1', id: `sted.${stedId}`, tekst: sted.navn });
    for (const o of sted.objekter) ud.push({ kilde: 'Kapitel 1', id: `objekt.${o.id}`, tekst: o.navn });
  }
  for (const trin of k1.trin) {
    if (trin.opgavetekst) ud.push({ kilde: 'Kapitel 1', id: `${trin.id}.opgavetekst`, tekst: trin.opgavetekst });
    (trin.replikker ?? []).forEach((r, i) =>
      ud.push({ kilde: 'Kapitel 1', id: `${trin.id}.${i + 1} (${r.taler})`, tekst: r.tekst, bevidstFejl: r.bevidstFejl }),
    );
    if (trin.titel) ud.push({ kilde: 'Kapitel 1', id: `${trin.id}.titel`, tekst: trin.titel });
    (trin.saetninger ?? []).forEach((s, i) => ud.push({ kilde: 'Kapitel 1', id: `${trin.id}.saetning.${i}`, tekst: s }));
    for (const spg of trin.spoergsmaal ?? []) {
      ud.push({ kilde: 'Kapitel 1', id: spg.id, tekst: spg.tekst });
      ud.push({ kilde: 'Kapitel 1', id: `${spg.id}.standard`, tekst: spg.standard });
      for (const [nr, f] of Object.entries(spg.forkert)) ud.push({ kilde: 'Kapitel 1', id: `${spg.id}.forkert.${nr}`, tekst: f });
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
