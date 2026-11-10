# Grafik i Pennedal

Valgt 30. oktober 2026: **16-bit pixelgrafik set skråt oppefra, hvor man går frit** (A).
Førsteperson med trin og drej (B) blev fravalgt.

Prototypen, der viser stilen: "Pennedal set oppefra" (Claude-artefakt). Den er tegnet med kode og er en pladsholder, men palet, mål og lys herunder gælder.

## Det kan gå galt, og sådan undgår vi det

| Risiko | Regel |
| --- | --- |
| Tekst tegnet på canvas kan ikke læses op af AppWriter og IntoWords | Ingen bogstaver i grafikken. Skilte har kun streger. Al tekst står i HTML |
| Eleven farer vild eller går forbi en figur | Kort i panelet, og teksten nederst siger, når man er tæt på noget, man kan undersøge |
| For mørkt eller uhyggeligt | Nattelyset følger "Mindre uhygge": lysere grundtone og ingen forskrækkelser |
| For tungt på Chromebook Gen 2 | Intern opløsning 320 x 180, grund tegnet én gang, kun synlige ting tegnes, mål 60 og aldrig under 30 billeder pr. sekund |
| Grafikken ligner noget kendt | Kun egne figurer og egen palet. Licens for alt i `LICENSER.md` |
| Uens stil, når der kommer mere til | Paletten og målene herunder bruges til alt nyt |

## Mål

- Intern opløsning: **640 x 360** med fin grafik (standard fra 10. november 2026, Henrik: "gå med det pæneste") og **320 x 180** med hurtig grafik. Verden og figurer er stadig tegnet i 320 x 180-pixel, men lyset, gløden og vignetten tegnes i fuld opløsning og er bløde. Går fin grafik under 40 billeder pr. sekund de første sekunder, skifter spillet selv til hurtig og husker det (krav 8). Eleven kan også vælge under Indstillinger, Grafik. `?skala=1, 2, 3 eller 4` i adressen vinder altid (til måling).
- Tilt-shift (sløring i top og bund) er prøvet og fravalgt: det slører hele billedet og gør pixelgrafik grim.
- Felter: **16 x 16 px**.
- Hovedperson: 16 x 24 px, 4 retninger (venstre er spejlet højre), 3 gangbilleder.
- Klatten: 14 x 17 px. Æseløre: 16 x 10 px og flyver efter hovedpersonen.
- Papirtræer: 22-34 px høje.
- Kameraet følger hovedpersonen og kigger lidt frem i gåretningen.
- Ting sorteres efter fodpunkt (y), så det nærmeste står forrest.

## Palet

| Brug | Farver |
| --- | --- |
| Græs | `#3d7a57` `#468a60` `#356c4d` `#4f9467`, strå `#5aa572` |
| Skovbund | `#2f6448` `#24503a` `#2a5a40` |
| Sti | `#c4ab7c` `#a99068`, kant `#8a7656`, lys `#e0c995` |
| Vand | `#203a6b` `#28467c`, krusning `#4f6fa8`, bred `#3a2a20` |
| Papir | lys side `#f4efe0`, skygge `#b9bfcf`, linjer `#a7aab8`, blæk `#2a2f48` |
| Træ og jord | `#4a3426` `#6b4a2b` `#3a2a20` |
| Lys | `#ffe9a8` |
| Rød | `#c0503e` `#8e3428` `#7a2e1f` |
| Måner | `#f3ead2` `#f0c45a` `#c9dcf2` |
| Hovedperson | hud og hår efter avatarvalg, kontur `#1b1b24` |

## Lys

- Lyset kommer fra venstre: lys side til venstre, skygge til højre.
- Nat: hele billedet ganges med grundtonen `rgb(140, 148, 217)`.
- Lanternen og fyrtårnet lyser op med `rgb(255, 250, 219)`. Hurtig grafik: 4 trin med Bayer-dither. Fin grafik: blød overgang med en lysere kerne, og et varmt skær (glød, ADD på grafikkortet) om lanterner, lamper, trappelys og fyrtårnet.
- "Mindre uhygge": grundtonen bliver lysere, fx `rgb(200, 205, 235)`.
- Indendørs gælder tonen for stedet i stedet for nattens grundtone. Biblioteket: morgensol `rgb(236, 222, 200)` med lys skråt ind fra vinduerne og en lampe på disken. Kælderen: mørk `rgb(64, 62, 96)`, kun lygten og lyset fra trappen lyser. Med "Mindre uhygge" er kælderen `rgb(150, 148, 184)`.
- Lys lægges oven på hinanden med "lighten", så det stærkeste vinder, hvor to lys mødes.

## Indendørs

- Kortets tegn står i `src/game/kort.ts`. Møbler er figurer med fodpunkt, så man kan gå bag om reoler og borde.
- Væg i biblioteket: træpanel `#8a5a3a` `#7a4e33`, liste `#3a2a20`. Kældervæg: sten `#5b5663` `#4f4a57`. Kældergulv: fliser `#7a7468` `#716b60`, så gulv og væg ikke ligner hinanden.
- Bogrygge har farver, men aldrig bogstaver.

## Dialog

- Når en figur taler, går hovedpersonen hen til den, og kameraet zoomer ind i hele trin (1 eller 2) og klipper i stedet for at glide, så pixlerne ikke flyder. Begge skal kunne ses over dialogboksen.
- De vender sig mod hinanden. Den, der taler, vipper lidt og har en lille taleboble med tre prikker (ingen bogstaver) over billedets øverste kant. Træer foran en figur bliver halvt gennemsigtige.
- Fortælleren og figurer, der ikke er på stedet, zoomer ikke.
- Med "Reducer bevægelse" i styresystemet skifter zoomen uden glidning og uden vippen.
- Portrætter i dialogen: 24 x 24 pixel i `src/game/pixel/portraetter.ts`.

## Stemning og liv (9. november 2026)

- **Jorden** (`tegnGrund` i `src/game/pixel/lerred.ts`): græs og skov flyder i hinanden (feltet aflæses forskudt med glat støj), stien har runde hjørner og en bølgende kant, græsset har lyse og mørke pletter. Sten, tuer, svampe og kviste står på græsset, mos i brostenenes fuger. Træer har en ditheret skygge mod højre, huse og mure kaster skygge mod højre. Alt tegnes én gang pr. sted.
- **Partikler** (`src/game/stemning.ts`): ildfluer om natten, papirblade i Pennedal, fnug i Viskeskoven, pollen i byen, støv indendørs. Højst 30 på skærmen. Ildfluer gløder langsomt og ligger over lyslaget. Ingen partikler med reduceret bevægelse.
- **Levende figurer** (`src/game/pixel/liv.ts`): figurer blinker kort med flere sekunders mellemrum og trækker vejret (overkroppen synker én pixel). Gangen har fire trin. Billederne laves ud fra figurens eget tegnkort.
- **Farvetone pr. sted:** Viskeskoven kølig blågrøn, torvet gyldent, engen varm, smøgerne kølige. En vignet i fire trin med dither gør kanterne lidt mørkere, mest i kælderen og om natten, halvt så meget med "Mindre uhygge".
- **Dybde:** mørke trækroner langs kortets nederste kant glider lidt hurtigere end verden (parallakse).
- **Rammer:** dialogen, opgavekortet, menuen og kampens bokse har en pixelramme (et SVG på 12 x 12 pixel som `border-image`). Teksten er stadig HTML.

## Skrift

Pixelskrift (Pixelify Sans) må kun bruges til navne og overskrifter. Brødtekst står altid i Atkinson Hyperlegible eller den skrift, eleven har valgt.

## Inspiration og arbejdsform for effekter (3. november 2026)

Henrik vil gerne tage grafikken videre med inspiration fra spritefusion.com (artiklen "How to make good pixel art effects with Claude"). Hav det i baghovedet, når der skabes ny grafik:

- Effekter laves som kode med få parametre (hastighed, farve, tæthed), ikke som faste billeder. Det gør dem lette at variere.
- Lav flere udkast (5-10) af en ny effekt, vis dem som kort video eller billedrække, vælg den bedste retning og finpuds bevægelse og timing. Første acceptable udgave er ikke nok.
- Mulige steder: blækket der visker ord ud (Viskeskoven), lyset fra skuffen, regn og tåge, ord der falder på plads, når et væsen bliver roligt, lanternens lys.
- Hver effekt måles mod Chromebook-budgettet (aldrig under 30 billeder pr. sekund). Mange partikler laves som få, genbrugte billeder.
- Hver effekt kan dæmpes af "Mindre uhygge" og "Reducer bevægelse", og den må ikke blinke hurtigt.
- Gratis tilesets, Pixel Art Generator og lignende kan bruges som inspiration. Hentes noget derfra, kræver det en tjekket licens i `LICENSER.md`, og det må ikke bryde kravet om et originalt univers. Vi tegner selv i kode, som vi plejer.
- Godot (godotengine.org) er kigget igennem. Vi bliver i Phaser. Se `docs/historie.md` og CLAUDE.md for stakken.

## Animationer (9. november 2026)

Henrik vil have langt flere og mere kreative animationer. Regler:
- Tekst, eleven skal læse, må ikke bevæge sig hele tiden (fx står Og-ormens krop stille, kun hoved og hale bevæger sig).
- Animationer, der blokerer, kan springes over (kampens "Spring over"). Ingen tid at nå noget på.
- Reduceret bevægelse (styresystemets indstilling) slår bevægelse fra eller gør den til en kort fade. "Mindre uhygge" fjerner skærmryst og rødt blink.
- Effekter laves i CSS (`.fx-*`, cqw/cqh i kampen) eller som Phaser-tweens i KortScene. Ingen bogstaver i grafikken.
- Se `docs/status.md` for idélisten over steder, der kan få animationer.
