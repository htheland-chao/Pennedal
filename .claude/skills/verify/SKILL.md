---
name: verify
description: Tjek Pennedal før en commit eller pull request - typetjek, enhedstests, stavetjek, build og de relevante gennemspil. Brug altid før commit.
---

# Tjek før commit

Kør i denne rækkefølge og stop ved første fejl. Ret fejlen, før du går videre.

1. `npm run tjek` (typetjek, enhedstests, stavetjek og build).
2. Gennemspil i Chrome for det, ændringen rører. Hele `npm run test:e2e` tager lang tid, så vælg filerne i `e2e/`:
   - Grafik, kort eller kamera: `e2e/grafik.spec.ts` og kapitlet, ændringen viser sig i.
   - Et kapitel eller en opgave: det kapitels `e2e/kapitelN.spec.ts`.
   - Gemning eller gemmekode: også de tests, der bruger gemmekoden.
   - I Claudes miljø: sæt `CHROMIUM_STI` til den installerede Chromium, hvis Playwright ikke finder sin egen.
3. Billedtest (`e2e/billeder.spec.ts`): kan ikke laves lokalt. Ændrer du grafikken med vilje, så kør jobbet Billeder på grenen bagefter (Actions > Billeder > Run workflow). Jobbet lægger nye billeder på grenen og starter Test. Skriv i pull requesten, hvilke billeder der er ændret, og se dem, før du merger.
4. Ny grafik: kør `npm run grafik:ark` og se billederne i `test-results/ark/` (se skill `ny-grafik`).
5. Opdatér `docs/status.md` (kort) og `docs/logbog.md` (detaljer, nyeste øverst).

Rapportér ærligt til Henrik: hvad er kørt og grønt, hvad er ikke testet (fx på Chromebook).
