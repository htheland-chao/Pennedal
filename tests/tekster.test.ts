// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import da from '../src/content/tekster/da.json';
import { tjekTekster } from '../scripts/stavetjek.mjs';

function filer(mappe: string): string[] {
  return readdirSync(mappe).flatMap((n) => {
    const sti = join(mappe, n);
    return statSync(sti).isDirectory() ? filer(sti) : /\.tsx?$/.test(n) && !n.includes('.test.') ? [sti] : [];
  });
}

describe('dansk tekst', () => {
  it('har ingen stavefejl, tankestreger eller dobbelte mellemrum', { timeout: 60_000 }, () => {
    const fund = tjekTekster();
    expect(fund.map((f) => `${f.kilde} / ${f.id}: ${f.problem}`)).toEqual([]);
  });

  it('bruger kun tekst-id\'er, der findes i da.json', () => {
    const mangler: string[] = [];
    for (const fil of filer('src')) {
      const kilde = readFileSync(fil, 'utf8');
      for (const m of kilde.matchAll(/\bt\(\s*'([^'`$]+)'/g)) if (!(m[1] in da)) mangler.push(`${fil}: ${m[1]}`);
    }
    expect(mangler).toEqual([]);
  });

  it('har ingen tekst i koden, der burde ligge i da.json', () => {
    // Danske ord direkte i JSX-tekst er et tegn på, at teksten ikke kommer med i korrekturlisten.
    const fund: string[] = [];
    for (const fil of filer('src/ui').concat(filer('src/app'))) {
      const kilde = readFileSync(fil, 'utf8');
      for (const m of kilde.matchAll(/<\/?[A-Za-z][^<>]*>\s*([^<>{}=;()\n]*[A-Za-zÆØÅæøå]{3,}[^<>{}=;()\n]*)\s*</g))
        fund.push(`${fil}: ${m[1].trim()}`);
    }
    expect(fund).toEqual([]);
  });
});
