#!/usr/bin/env node
// Lydprøve (Henrik, 13. november 2026): de samme seks replikker indtalt med andre Gemini-stemmemodeller,
// så Henrik kan høre forskellen, før lydjobbet evt. bruger flere modeller (hver model har sin egen dagskvote).
// Kun faste tekster fra spillet (manifestet). Aldrig elevtekster. Bruger 6 klip af hver models dagskvote.
// Resultatet lægges i lydproeve/ og hentes som artefakt fra GitHub-jobbet Lydprøve.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hentLyd, tilOgg } from './lav-lyd.mjs';
import { hentStemmer } from './lydtekster.mjs';

const ROD = fileURLToPath(new URL('..', import.meta.url));
const UD = join(ROD, 'lydproeve');
const NOEGLER = ['000dcc90069351', '002afb9c4f9454', '01157fe9e967df', '092483afabd966', '07e8c290c513c7', '0b4a123c8cb416'];
const MODELLER = (process.env.LYD_PROEVE_MODELLER || 'gemini-3.8-flash-lite-tts,gemini-2.5-flash-tts,gemini-2.5-flash-preview-tts')
  .split(/[\s,]+/)
  .filter(Boolean);

const stemmer = hentStemmer();
const manifest = JSON.parse(readFileSync(join(ROD, 'public/lyd/manifest.json'), 'utf8'));
const resultat = { hovedmodel: stemmer.model, replikker: [], modeller: {} };
mkdirSync(UD, { recursive: true });

for (const n of NOEGLER) {
  const f = manifest.filer[n];
  if (f) resultat.replikker.push({ noegle: n, figur: f.figur, tekst: f.tekst, fil: f.fil });
}

for (const model of MODELLER) {
  const r = (resultat.modeller[model] = { klip: {}, fejl: null });
  mkdirSync(join(UD, model), { recursive: true });
  for (const rep of resultat.replikker) {
    try {
      const lyd = await hentLyd(rep.tekst, stemmer.figurer[rep.figur], model, stemmer.udtale);
      const fil = join(model, `${rep.noegle}.ogg`);
      await tilOgg(lyd, join(UD, fil));
      r.klip[rep.noegle] = fil;
      console.log(`${model}: ${rep.figur} lavet`);
    } catch (e) {
      r.fejl = String(e.message).slice(0, 400);
      console.log(`${model}: ${r.fejl}`);
      break;
    }
    await new Promise((ok) => setTimeout(ok, 4000));
  }
}
writeFileSync(join(UD, 'resultat.json'), JSON.stringify(resultat, null, 2));
console.log(JSON.stringify(resultat, null, 2));
