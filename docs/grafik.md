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

- Intern opløsning: **320 x 180** (16:9). Spillet er 960 x 540, så pixelgrafikken forstørres præcis 3 gange.
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
- Lanternen og fyrtårnet lyser op med `rgb(255, 250, 219)` i 4 trin med Bayer-dither, ingen bløde overgange.
- "Mindre uhygge": grundtonen bliver lysere, fx `rgb(200, 205, 235)`.
- Indendørs gælder tonen for stedet i stedet for nattens grundtone. Biblioteket: morgensol `rgb(236, 222, 200)` med lys skråt ind fra vinduerne og en lampe på disken. Kælderen: mørk `rgb(64, 62, 96)`, kun lygten og lyset fra trappen lyser. Med "Mindre uhygge" er kælderen `rgb(150, 148, 184)`.
- Lys lægges oven på hinanden med "lighten", så det stærkeste vinder, hvor to lys mødes.

## Indendørs

- Kortets tegn står i `src/game/kort.ts`. Møbler er figurer med fodpunkt, så man kan gå bag om reoler og borde.
- Væg i biblioteket: træpanel `#8a5a3a` `#7a4e33`, liste `#3a2a20`. Kældervæg: sten `#5b5663` `#4f4a57`. Kældergulv: fliser `#7a7468` `#716b60`, så gulv og væg ikke ligner hinanden.
- Bogrygge har farver, men aldrig bogstaver.

## Skrift

Pixelskrift (Pixelify Sans) må kun bruges til navne og overskrifter. Brødtekst står altid i Atkinson Hyperlegible eller den skrift, eleven har valgt.
