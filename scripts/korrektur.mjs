// Laver en samlet korrekturliste med al dansk tekst i spillet: korrektur/korrekturliste.md
// Køres med: npm run korrektur
import { mkdirSync, writeFileSync } from 'node:fs';
import { alleTekster, renTekst } from './tekster.mjs';

/** Facit til Og-ormens tekster: og{s} bliver til punktum, og næste ord får stort begyndelsesbogstav. */
function ogFacit(tekst) {
  const ord = tekst.split(/\s+/);
  const ud = [];
  let stort = false;
  for (const raa of ord) {
    if (/^og\{s\}$/i.test(raa)) {
      ud[ud.length - 1] += '.';
      stort = true;
      continue;
    }
    let o = raa.replace(/\{[bn]\}/g, '');
    if (stort) o = o.charAt(0).toLocaleUpperCase('da-DK') + o.slice(1);
    stort = false;
    ud.push(o);
  }
  return ud.join(' ');
}

const tekster = alleTekster();
const grupper = new Map();
for (const t of tekster) {
  if (!grupper.has(t.kilde)) grupper.set(t.kilde, []);
  grupper.get(t.kilde).push(t);
}

const linjer = [
  '# Korrekturliste - Pennedal',
  '',
  `Lavet ${new Date().toISOString().slice(0, 10)}. ${tekster.length} tekster.`,
  '',
  'Sæt kryds, når en tekst er læst. Bevidste fejl står under "Bevidste fejl" og skal ikke rettes.',
  'Stavetjekket fanger ikke rigtige ord brugt forkert (fx "landet" for "landede"), så læs hele teksten.',
  '',
];
const bevidste = [];
for (const [kilde, liste] of grupper) {
  linjer.push(`## ${kilde}`, '');
  for (const t of liste) {
    if (t.bevidstFejl) {
      bevidste.push(t);
      continue;
    }
    linjer.push(`- [ ] \`${t.id}\`: ${renTekst(t.tekst)}${t.note ? ` _(${t.note})_` : ''}`);
  }
  linjer.push('');
}
linjer.push('## Bevidste fejl', '');
for (const t of bevidste) {
  linjer.push(`- [ ] \`${t.id}\` (${t.kilde}): ${renTekst(t.tekst)}`);
  if (t.kilde === 'Og-ormen') linjer.push(`  - Facit: ${ogFacit(t.tekst)}`);
}

mkdirSync(new URL('../korrektur/', import.meta.url), { recursive: true });
writeFileSync(new URL('../korrektur/korrekturliste.md', import.meta.url), linjer.join('\n') + '\n');
console.log(`Korrekturliste skrevet: korrektur/korrekturliste.md (${tekster.length} tekster)`);
