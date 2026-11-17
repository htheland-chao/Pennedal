// Flytter filer og retter alle relative imports i src, e2e, tests og scripts (Henriks mappestruktur, 17. november 2026).
// Brug: node scripts/flyt.mjs gammel/sti.ts=ny/sti.ts [flere ...]
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const rod = process.cwd();
const flyt = new Map(process.argv.slice(2).map((a) => a.split('=').map((s) => resolve(rod, s))));
const ENDELSER = ['.ts', '.tsx', '.mjs', '.js', '.json', '.css'];

function alleFiler(mappe) {
  const ud = [];
  for (const navn of readdirSync(mappe)) {
    if (navn === 'node_modules' || navn.startsWith('.')) continue;
    const sti = join(mappe, navn);
    if (statSync(sti).isDirectory()) ud.push(...alleFiler(sti));
    else if (/\.(ts|tsx|mjs)$/.test(navn)) ud.push(sti);
  }
  return ud;
}
function find(fra, spec) {
  const base = resolve(dirname(fra), spec);
  for (const e of ['', ...ENDELSER]) if (existsSync(base + e) && statSync(base + e).isFile()) return { fil: base + e, endelse: e };
  for (const e of ENDELSER) if (existsSync(join(base, 'index' + e))) return { fil: join(base, 'index' + e), endelse: '/index' };
  return null;
}
function nySpec(fraNy, tilNy, endelse) {
  let r = relative(dirname(fraNy), tilNy);
  if (endelse === '/index') r = dirname(r);
  else if (endelse) r = r.slice(0, -endelse.length);
  if (!r.startsWith('.')) r = './' + r;
  return r;
}
const filer = ['src', 'e2e', 'tests', 'scripts'].filter((m) => existsSync(m)).flatMap((m) => alleFiler(resolve(rod, m)));
let rettet = 0;
for (const fil of filer) {
  const tekst = readFileSync(fil, 'utf8');
  const filNy = flyt.get(fil) ?? fil;
  const ny = tekst.replace(/(from\s+|import\s*\(\s*|import\s+)(['"])(\.{1,2}\/[^'"]+)\2/g, (hel, foer, q, spec) => {
    const m = find(fil, spec);
    if (!m) return hel;
    const til = flyt.get(m.fil) ?? m.fil;
    if (til === m.fil && filNy === fil) return hel;
    // Står endelsen (fx .json) i importen, beholdes den. Ellers fjernes den igen.
    const s = nySpec(filNy, til, m.endelse && spec.endsWith(m.endelse) ? '' : m.endelse);
    return `${foer}${q}${s}${q}`;
  });
  if (ny !== tekst) {
    writeFileSync(fil, ny);
    rettet++;
  }
}
for (const [fra, til] of flyt) execSync(`mkdir -p "${dirname(til)}" && git mv "${fra}" "${til}"`);
console.log(`Flyttet ${flyt.size} filer, rettet imports i ${rettet} filer.`);
