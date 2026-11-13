# Spiltest og asset-generering (13. november 2026)

Henrik bad om to gennemgange ud fra to prompts: "Agér kritisk spiltester. Hvor vil spilleren miste tålmodigheden? Hvilken strategi vil hurtigt blive for dominerende og kedelig?" og en vurdering af AI-billedgenerering (Stable Diffusion eller Midjourney) til figurer og baggrunde.

Gennemgangen bygger på koden, gennemspil i testbrowseren og en simulering af Blækdybet. Den er ikke prøvet af elever. Det, der er rettet, står under "Rettet". Resten er anbefalinger, som Henrik skal tage stilling til, fordi de ændrer, hvordan spillet føles for de svage elever.

## 1. Spilloopene

| Loop | Hvad eleven gør |
| --- | --- |
| Kortet | Går hen til målet, taler med figurer, undersøger ting. Dialog med oplæsning. |
| Ordsten og opgaver | Vælger mellem 3-4 muligheder. Et forkert svar giver regel og eksempel, og den forkerte mulighed lukkes. |
| Kampe | Slå (en opgave), Lyt, Forsvar, Hjælpere, Taske. Væsnerne varsler deres angreb. Blødt nederlag: skaden huskes, holdet får fuldt liv. |
| Banerne | Løber og hopper. Ordsten lægger planker tilbage. |
| Blækdybet | Rum efter rum med blæk som liv, gaver og stigende sværhed. Rekord = dybde og rigtige svar. |

## 2. Hvor eleven mister tålmodigheden

1. **Mange klik på "Videre" i lange dialoger, når oplæsning er slået fra.** Med oplæsning går dialogen selv videre (standard). Uden oplæsning skal hver replik klikkes væk, og hurtige læsere klikker uden at læse. Ingen ændring foreslået, men hold øje med det.
2. **Kamp, hvor man ikke kan tabe.** Blødt nederlag betyder, at en stærk elev aldrig føler noget på spil. Ingen risiko giver ingen spænding. Det er bevidst for de svage elever, men de stærke keder sig. Blækdybet er nu svaret til de stærke.
3. **Lange kampe med tre væsner.** Hvert væsen tåler flere slag. Animationerne kan springes over, og det hjælper. Holdes øje med i klassen.
4. **Blækdybet før rettelsen:** en stærk elev fik en gave efter hvert rum og kom aldrig op igen. Simuleringen viste 200+ rum og 875 spørgsmål i én tur. Det er kedeligt, og rekorden bliver et spørgsmål om udholdenhed. **Rettet** (se nedenfor).
5. **At finde det næste mål.** Det er blevet meget bedre med titelkortet og boksen "Det næste, du skal gøre". Ikke et problem længere i testene.

## 3. Strategier, der bliver dominerende og kedelige

1. **Klik dig igennem mulighederne (ordsten og opgaver).** Den forkerte mulighed lukkes, og et forkert svar koster intet. Med tre muligheder er man altid igennem på højst tre klik uden at læse. Tilpasningen ser det (kun rigtigt i første forsøg løfter niveauet), men eleven kommer videre alligevel.
   - Kan gå galt: gør vi det dyrt at fejle, bliver de svage elever straffet, og det bryder idéen bag krav 6.
   - **Anbefaling:** når en elev har prøvet alle forkerte muligheder i samme opgave, kommer der ét nyt ord af samme slags, før stenen er klaret. Ingen straf, men ingen genvej. **Bygget 13. november 2026.**
2. **Slå med væsnets svaghed, hver gang.** Svaghederne er faste (Tomordet er svag over for synonymer osv.). Når eleven har lært dem, er "Lyt" overflødig, og "Forsvar" bruges aldrig, fordi nederlaget ikke koster noget.
   - **Anbefaling:** a) Lyt huskes på tværs af kampe (som et lille bestiarium i tasken), så Lyt er nyttig første gang og ikke spildt bagefter. b) Forsvar får en grund: et varslet "stort angreb" hver tredje runde, som Forsvar halverer. **Bygget 13. november 2026** (bestiariet gemmes kun i browseren, ikke i tasken).
3. **Blækdybet: Viskelæderskjoldet.** Før rettelsen gjorde et skjold den første fejl i hvert rum gratis, for altid. Med to skjolde var en stærk elev reelt udødelig. **Rettet.**
4. **Blækdybet: Vims og Klatten to gange.** En gave mere af dem gjorde ingenting, men blev stadig tilbudt. **Rettet.**

## 4. Rettet (Blækdybet i PR #85; ordsten og kampe 13. november om aftenen)

- Ordsten: et nyt ord, når eleven har prøvet alle de forkerte muligheder (Henrik sagde ja).
- Kampe: Lyt huskes i bestiariet, og et varslet stort angreb hver tredje runde giver Forsvar en grund (Henrik sagde ja).

- Gave efter rum 1 og derefter hvert tredje rum (før: efter hvert rum).
- Viskelæderskjoldet giver to skjolde. Et skjold betaler én dråbe af en fejl. Bruges op.
- Vims, Klatten og Fejlfri fjerpen tilbydes ikke igen, når man har dem.
- Trykket i dybet: fra rum 25 koster en fejl to dråber, fra rum 40 tre. Hvert rum kan stadig klares, og der er stadig ingen tid (krav 5).

Simulering af 400 ture pr. elevtype (sandsynlighed for rigtigt svar falder med sværheden):

| Elev | Median dybde | 90 % når højst | Spørgsmål (median) |
| --- | --- | --- | --- |
| Meget stærk | 29-34 | 42-46 | 107-126 |
| Stærk | 24-26 | 29-33 | 86-93 |
| Middel | 11-13 | 17-19 | 40-45 |
| Svag | 5-6 | 8-10 | 17-23 |

Spændet dækker de fire gaver som førstevalg. Ingen gave er klart bedst (højst ca. 15 % forskel). En meget stærk elev bruger en til to lektioner på en tur.

## 5. Asset-generering med AI (Stable Diffusion, Midjourney)

**Kort svar: brug AI til idéer og stemning, ikke til de færdige figurer i spillet.**

Hvorfor:

- **Krav 9 og licenser.** Al grafik skal have en licens i `LICENSER.md`. Ophavsretten til AI-billeder er uafklaret i EU og Danmark, og vilkårene er forskellige (Midjourney giver betalende brugere ejerskab, Stable Diffusion afhænger af modellen og dens licens). Modellerne kan også ramme for tæt på kendte figurer og spil.
- **Stilen passer ikke.** AI-"pixelart" er sjældent rigtig pixelart: pixelene er ikke lige store, der er bløde kanter og mange farver. Det skal skaleres ned og farvelægges om til paletten i `docs/grafik.md`, og så er meget af arbejdet alligevel gjort i hånden.
- **Animation.** AI tegner ikke den samme figur ens i flere billeder (gå, blinke, tale). Pennedals figurer er bygget som tegnkort, der kan animeres med kode (levende portrætter, fin hovedperson). Det kan AI-billeder ikke.
- **Bogstaver.** AI sætter ofte bogstaver og tegn ind, og det må grafikken ikke have.
- **Avataren.** Elevens avatar bygges af valg (hud, hår, tøj). Det kræver tegnkort, ikke billeder.

Hvor AI kan hjælpe:

- **Stemningsbilleder** til nye steder, før de tegnes som tegnkort (farver, lys, komposition).
- **Baggrunde langt væk** (himmel, bjerge i parallax), efter de er skaleret ned og farvelagt med paletten, og kun hvis licensen er klar.

Promptene, tilpasset Pennedal (til idébilleder):

- Figur: `Pixel art character concept, 16-bit style, top-down three-quarter view, small fantasy creature made of ink and paper, limited palette #1b1b24 #f4efe0 #2a2f48 #c0503e #f0c45a #3d7a57, clean 1px dark outline, light from the left, plain dark background --no text, letters, blurry, 3d render, anti-aliasing`
- Sted: `Pixel art environment concept, 16-bit top-down three-quarter view, enchanted library forest where trees are made of paper pages, soft lantern light #ffe9a8 from the left, night tone, limited palette, flat 2D game art --no text, letters, signs with writing, 3d render`
- Bane (fra siden): `Pixel art side view platformer background layer, ink lake under a pale moon, floating paper stones, limited palette, seamless horizontal tile --no text, letters, 3d render`

**Lyd:** Stemmerne laves allerede med Gemini TTS, og musikken er noder i koden. Ingen grund til at skifte.

## 6. Det, der mangler afprøvning

- Alt ovenfor er uden elever. Den vigtigste test er 20 minutter i klassen: hvem klikker sig igennem, hvem keder sig i kampene, og hvor langt kommer de stærke i Blækdybet.
- Intet er prøvet på en Chromebook i nat.
