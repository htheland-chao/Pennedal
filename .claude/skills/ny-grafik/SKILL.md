---
name: ny-grafik
description: Lav eller ændr pixelgrafik i Pennedal (figurer, træer, ting, fliser, effekter). Brug før al ny grafik.
---

# Ny pixelgrafik

Læs først `docs/grafik.md` (mål, palet, lys). Reglerne her er de vigtigste.

## Regler

- **Én pixelstørrelse.** Figurer og verden har samme pixelstørrelse. Ingen opskalerede eller nedskalerede figurer på kortet og i banerne. Lys, glød og vignet må være bløde.
- **Mål:** felter 16 x 16, mennesker 16 x 24, portrætter 24 x 24.
- **Palet:** brug farverne fra `docs/grafik.md` eller den palet, tingen hører til (fx papirpaletten for træerne i `src/game/pixel/papirgraner.ts`).
- **Lys fra venstre.** Mørkt omrids `#2a2f48` eller `#1b1b24` på figurer. Intet omrids på jord og fliser.
- **Ingen tilfældig enkeltpixel-støj** som tekstur. Brug klynger.
- **Ingen bogstaver** i grafikken (krav 1).
- **Variation:** gentagne ting får flere varianter, men aldrig blandede stilarter på samme sted (Henrik, 19. november 2026: runde, lånte træer mellem papirgraner var rodet).
- **Lånt grafik** kun under CC0 og farvet om til paletten (krav 9). Skriv den i `LICENSER.md`.

## Fremgangsmåde

1. Find ud af, om noget lignende findes i `src/game/pixel/` (fx `sprites.ts`, `papirgraner.ts`). Genbrug.
2. Tegn som `Tegnkort` (rækker af tegn + palet). Skriv en lille test, der tjekker, at rækkerne er lige lange og kun bruger farver fra paletten (se `papirgraner.test.ts`).
3. Tilføj den til grafikarket (`src/ark/samling.ts`), kør `npm run grafik:ark`, og se billederne selv.
4. Se den i spillet med `?hop=<sted>` med både `skala=1` og `skala=2`. Tag før/efter-billeder til Henrik.
5. Kør skill `verify`. Ændrer det billedtesten, så kør jobbet Billeder på grenen.
6. Store ændringer i udseendet: vis Henrik billeder, før der merges.
