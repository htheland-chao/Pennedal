# Pennedal - regler for Claude

Danskfagligt fantasy-læringsspil til en 5. klasse. Ejer: Henrik (klasselærer og dansklærer). Spillet kører i Chrome på skolens Chromebooks (Lenovo 500e Gen 2-4) og hjemme.

## Kommunikation med Henrik

- Skriv på dansk, kort og konkret. Brug bindestreg (-), aldrig tankestreg.
- Spørg hellere end at gætte.
- Ved vigtige valg: beskriv først, hvordan det kan gå galt, og giv derefter en konkret anbefaling.
- Påstå aldrig, at noget virker, uden at have kørt og tjekket det. Sig tydeligt, hvad der ikke er testet.

## Stak (versioner er låst i package.json)

TypeScript, Vite, React (kun HTML-laget: menuer, dialog, opgaver, al tekst), Phaser 4 (kun grafik på canvas). Vitest til enhedstests, Playwright til gennemspil i Chrome. Node 22.

Opdatér kun en version efter at have slået den op i npm og kørt alle tests.

## Kommandoer

- `npm test` - enhedstests og stavetjek af al dansk tekst. Skal være grøn før hver pull request.
- `npm run test:e2e` - spiller kapitel 1 igennem i Chrome.
- `npm run typecheck`, `npm run build`, `npm run korrektur`.
- `npm run lyd:status` - opdaterer `public/lyd/manifest.json`. Selve lydklippene laves kun af GitHub-jobbet Lyd (`.github/workflows/lyd.yml`), fordi Googles API er blokeret i Claudes miljø.

## Ufravigelige krav

1. **Al tekst, eleven skal læse, er rigtig HTML** i React-laget. Aldrig tekst tegnet på canvas, ellers kan AppWriter og IntoWords ikke læse den op.
2. **Al dansk tekst ligger i `src/content/`** (`tekster/da.json`, kapitler, ordlister), aldrig direkte i koden. En test fejler, hvis der står tekst i JSX.
3. **Dansk tekst skal være fejlfri.** Kør stavetjekket. Bevidste fejl (Klattens fejl, Og-ormens tekster) markeres `bevidstFejl`. Nye rigtige ord, som ordbogen ikke kender, skrives i `scripts/egne-ord.txt` efter tjek i Retskrivningsordbogen.
4. **Ingen elevdata på en server.** Version 1 gemmer kun i elevens browser. Login, lobby og lærerpanel på en server kræver skriftlig godkendelse fra kommunens databeskyttelsesrådgiver. Gem aldrig navne, e-mail, diagnoser eller elevtekster. Send aldrig elevtekster til eksterne tjenester.
5. **Belønn aldrig fart.** Ingen tidsgrænser i læse- og staveopgaver.
6. **Feedback forklarer altid** med en regel og et eksempel. Skriv aldrig bare "forkert".
7. **Alt kan styres med tastatur og touch.** Synligt fokus. Indstillingen "Mindre uhygge" respekteres.
8. **Chromebook-budget:** højst 1366 x 768, mål 60 og aldrig under 30 billeder pr. sekund på Gen 2 med 4 GB RAM, første indlæsning under 10 MB.
9. **Originalt univers.** Ingen lånte figurer, navne eller grafik. Al grafik og lyd har en licens, der står i `LICENSER.md`.
10. **Ingen fritekst mellem elever**, heller ikke senere i en lobby.

## Indhold og opbygning

- `src/engine/` - ren logik (færdigheder, tilpasning, gemning, gemmekode). Ingen React eller Phaser her.
- `src/mechanics/` - logikken i læringsmekanikkerne. `src/ui/` og `src/app/` - React. `src/game/` - Phaser.
- Færdigheder har faste id'er i `src/engine/faerdigheder.ts`. Rækkefølgen bruges i gemmekoden: tilføj kun til sidst.
- Koblingen til Fælles Mål ligger kun i `src/content/maal.json`, så den kan skiftes, når fagplanerne træder i kraft 1. august 2027.

## Lyd

- Stemmer og stil pr. figur står i `src/content/stemmer.json` (Gemini TTS). Nøglen til et klip afhænger af tekst, stemme, stil og model, så et ændret ord giver et nyt klip.
- Kun tekster fra `scripts/lydtekster.mjs` sendes til Google. Tilføj aldrig elevtekster eller noget, eleven skriver.
- Nye steder med oplæsning: giv `LaesOpKnap` en `figur` og tilføj teksten i `scripts/lydtekster.mjs`.
- Al tale vises også som tekst.

## Grafik

Pixelgrafik i 16-bit-stil (se `grafikstil` i designlærredet). Pixelskrift må kun bruges til navne og overskrifter. Brødtekst står altid i Atkinson Hyperlegible eller den skrift, eleven har valgt.

## Arbejdsform

- Arbejd på en gren og lav en pull request. Henrik merger.
- Hver leverance: tests skrevet og kørt, resultatet rapporteret ærligt, pladsholdere og manglende grafik eller lyd tydeligt markeret, korrekturliste opdateret.
