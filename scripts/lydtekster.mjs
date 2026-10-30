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

  for (const h of laes('ord/historiebro.json').historier) {
    for (const [traek, tekst] of Object.entries(h.planker)) tilfoej('fortaeller', tekst, `Historiebroen / ${h.id}.${traek}`);
    tilfoej('fortaeller', h.fremmed, `Historiebroen / ${h.id}.fremmed`);
  }
  return ud;
}
