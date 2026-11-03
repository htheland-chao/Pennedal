# Status for Pennedal

Overdragelsesfil til hver ny session (Claude eller Henrik). Læs den først, og opdatér den i hver pull request, der ændrer noget af det, der står her. Sidst opdateret 3. november 2026.

Regler og stak står i `CLAUDE.md`. Historien står i `docs/historie.md`, grafikken i `docs/grafik.md`.

## Hvad der findes

- **Kapitel 1-3 kan spilles.** Kapitel 1 (Pennedal og kælderen), kapitel 2 (byen og trykkeriet med bane og escape room) og kapitel 3 (Viskeskoven med de første rolige kampe).
- **Intro, tilbageblik, taske, rolige kampe, Og-orm, avatardesigner med pixelgrafik** og baggrundsmusik pr. tema.
- **Lyd:** Gemini-stemmer pr. figur i `src/content/stemmer.json`. Introen kan fortælles af to stemmer: den nuværende (`fortaeller`) og en dyb, gammel mand (`introfortaeller`). Henrik skal lytte og vælge. Valget ligger i indstillingerne og som knap i introen.
- **Test og værktøj:** Hop direkte til et sted med `?hop` (se README). `?debug=1` viser billeder pr. sekund. `?lyd=1` er korrektursiden for lyd.
- **Grafikark:** `npm run grafik:ark` tegner alle pixelfigurer på én side, gemmer billeder i `test-results/ark/` og skriver advarsler om størrelse og farver. Nye pixelfigurer skal tilføjes i `src/ark/samling.ts`, så de kommer med.

## Beslutninger (Henrik)

- 30. oktober 2026: 16-bit pixelgrafik set skråt oppefra.
- 31. oktober 2026: Claude merger sine egne pull requests, når testen er grøn og der ikke er konflikter. Gemini TTS er betalt, men har en dagskvote.
- 1. november 2026: Intro-fortælleren skal kunne vælges mellem den nuværende stemme og en ny, dyb gammel mandestemme. Den nuværende bevares.
- 3. november 2026: Grafikken tages videre med effekter som kode, flere udkast og valg (se `docs/grafik.md`). Vi bliver i Phaser.

## Åbent og mangler

- **Lyd:** Mange klip mangler stadig. Status: `npm run lyd:status` eller `public/lyd/manifest.json`. Googles dagskvote på 100 klip gør, at det tager flere dage. Introens 6 klip med den gamle mand laves først. Den gamle mand bruges først, når alle hans klip findes.
- **Kapitel 3 mangler:** platformbane med viskede planker, sidemission, valgfri svær udfordring, to hukommelsesskår og Fælles Mål-tekst for ordforråd i `src/content/maal.json`.
- **Kapitel 4-8** står i `docs/historie.md`. Hukommelsesskårene er ikke bygget.
- **Rester af første udkast:** `src/ui/avatarSvg.ts` og `src/game/VerdenScene.ts` bruges ikke længere af noget sted, eleven kan komme til (alle steder bruger `KortScene` eller `BaneScene`). `Verden.tsx` og `PhaserVerden.tsx` sender stadig SVG-avataren videre, og `avatar.test.ts` tester den. Kan fjernes sammen.
- **Hovedfarve i designeren** har kun virkning, når hovedet har hætte eller kasket.

## Ikke testet

- Chromebook (Lenovo 500e Gen 2): billeder pr. sekund og hukommelse.
- Touch på rigtige enheder.
- Den gamle mands stemme (klippene findes ikke endnu).
- At lydjobbet selv lægger spillet ud, når det har lavet klip, ved den planlagte kørsel.

## Kendte fejl og faldgruber

- **Lydjobbet fejlede 2.-3. november 2026**, fordi grenen `lyd/auto-main` stod tilbage med et manifest, der stred mod main. Rettet i PR #40: jobbet starter nu forfra fra main, hvis grenen strider.
- **Gennemspil kapitel 1 lokalt** fejler kun på en favicon-404 til sidst. Kør med `CHROMIUM_STI=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
- **Tip-knappen og sidepanelets knap hedder det samme** ("Undersøg ..."). Brug `.panel` i gennemspilningerne.
- **Et merge lavet af lydjobbet starter ikke Test-jobbet.** Jobbet starter det selv med `gh workflow run test.yml`.
- **GitHub GraphQL er blokeret** i Claudes miljø. Brug `gh api` med REST.
- **Google er blokeret** i Claudes miljø. Lydklip laves kun af GitHub-jobbet Lyd.

## Arbejdsgang

1. Ny gren, ændring, `npm test` (og `npm run typecheck`, `npm run build`).
2. Ved grafik: kør `npm run grafik:ark` og se billederne selv.
3. Pull request, vent på grøn `test`, merge hvis der ikke er konflikt.
4. Opdatér denne fil, hvis status, beslutninger eller åbne punkter ændrede sig.
