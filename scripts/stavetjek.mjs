// Stavetjek af al dansk tekst i spillet. Køres med: npm run stavetjek
// Bruger den danske Hunspell-ordbog (Stavekontrolden) via nspell.
import { readFileSync } from 'node:fs';
import nspell from 'nspell';
import dictionary from 'dictionary-da';
import { alleTekster, renTekst } from './tekster.mjs';

const egne = readFileSync(new URL('./egne-ord.txt', import.meta.url), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

export function lavStavekontrol() {
  const s = nspell(dictionary);
  // Ordbogen fra Stavekontrolden gemmer uregelmæssige bøjninger (fx "er" og "har") i "al:"-felter,
  // som nspell ikke læser. Dem lægger vi ind her.
  const dic = new TextDecoder('utf-8').decode(dictionary.dic);
  for (const m of dic.matchAll(/\bal:([^\s/]+)/g)) s.add(m[1]);
  // Linjer med morfologifelter (fx "al:" og "ph:") læses heller ikke rigtigt af nspell,
  // så selve opslagsordet lægges også ind.
  for (const m of dic.matchAll(/^([^\s/]+)(?:\/\S*)?\s+[a-z]{2}:/gm)) s.add(m[1]);
  for (const o of egne) s.add(o);
  return s;
}

/** Finder stavefejl og andre tekstfejl. Returnerer en liste af fund. */
export function tjekTekster(tekster = alleTekster(), stave = lavStavekontrol()) {
  const fund = [];
  for (const t of tekster) {
    if (t.note === 'Tjekkes ikke') continue;
    const ren = renTekst(t.tekst);
    // Formfejl gælder også bevidste fejl.
    if (/[–—]/.test(ren)) fund.push({ ...t, problem: 'Tankestreg. Brug bindestreg (-).' });
    if (/ {2,}/.test(ren)) fund.push({ ...t, problem: 'Dobbelt mellemrum.' });
    if (/\s[,.!?]/.test(ren.replace(/\s\.\.\./g, ''))) fund.push({ ...t, problem: 'Mellemrum før tegn.' });
    const ord = ren
      .replace(/\{\w+\}/g, '')
      .split(/[^A-Za-zÆØÅæøåéü'-]+/)
      .map((o) => o.replace(/^[-']+|[-']+$/g, ''))
      .filter((o) => o.length > 1 && !/^\d+$/.test(o));
    for (const o of ord) {
      if (stave.correct(o)) continue;
      // Sammensatte ord med bindestreg tjekkes del for del.
      if (o.includes('-') && o.split('-').every((d) => !d || stave.correct(d))) continue;
      fund.push({ ...t, problem: `Ukendt ord: "${o}"`, forslag: stave.suggest(o).slice(0, 3) });
    }
  }
  return fund;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fund = tjekTekster();
  if (fund.length === 0) {
    console.log(`Stavetjek: ingen fejl i ${alleTekster().length} tekster.`);
  } else {
    for (const f of fund) {
      console.log(`${f.kilde} / ${f.id}: ${f.problem}${f.forslag?.length ? ` (forslag: ${f.forslag.join(', ')})` : ''}`);
      console.log(`   ${f.tekst}`);
    }
    console.log(`\nStavetjek: ${fund.length} fund.`);
    process.exitCode = 1;
  }
}
