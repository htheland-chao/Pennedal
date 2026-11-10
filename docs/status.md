# Status for Pennedal

Overdragelsesfil til hver ny session (Claude eller Henrik). Læs den først, og opdatér den i hver pull request, der ændrer noget af det, der står her. Sidst opdateret 9. november 2026.

Regler og stak står i `CLAUDE.md`. Historien står i `docs/historie.md`, grafikken i `docs/grafik.md`.

## Hvad der findes

- **Hele spillet, kapitel 1-8, kan spilles.** Kapitel 1 (Pennedal og kælderen), kapitel 2 (byen og trykkeriet med bane og escape room), kapitel 3 (Viskeskoven med turbaserede kampe, platformbanen med viskede planker, sidemissionen Halvsangen, den lange hvide sti og to skår), kapitel 4 (Rimbjerget med Rimfod, ekkostenene, kampen i Ekkokløften, digtet med rim og rytme, Rimfods sætning, den iskolde kam og to skår), kapitel 5 (Fodnoternes kælder med Fru Fodnote, bøgerne der sorteres efter fortæller, kartoteksskabet som escape room, kampen mod Den Tvivlende Sætning, tilbageblikket Skyggen bliver tegnet, twist 1, sidemissionen med fodnotetallene, De høje reoler og to skår) og kapitel 6 (Blæksøen med Klattens hytte, korrektur af Klattens tekster, twist 2 med Æseløre, kampen mod Krusedullerne med Klatten på holdet, Postsneglens breve, stenene over søen og to skår) og kapitel 7 (De halve lande med fire genrer, fristelsen, tilbageblikket Nogen ved skuffen, kampen, hvor holdet afhænger af elevens valg, Kommissær Lups spor, Den halve bro og to skår) og kapitel 8 (Den sidste side med Halvsætningerne, Skyggen, elevens slutning, tilbageblikket Skuffen, den sande slutning og epilogen hos Holm).
- **Intro, tilbageblik, taske, turbaserede kampe, Og-orm, avatardesigner med pixelgrafik** og baggrundsmusik pr. tema.
- **Layout** (9. november 2026): spillet fylder skærmen uden rammer. Opgaven står i et lille kort øverst til venstre, taske og menu i hjørnet, Undersøg-knappen nederst i midten. Dialogen er en tekstboks nederst over spillet, menuen glider ind fra højre.
- **Animationer** (9. november 2026): Æseløre folder sig ud af skuffen og flagrer frem. Portalen fra kælderen til Pennedal (hvirvel, fald, åbning med blade). Et blækstrøg ved alle andre stedskift. Kampen har animationer for hvert slag, angreb, ting og evne (`src/ui/kampEffekter.ts` og `.fx-*` i styles.css).
- **Kampmusik og skarp zoom** (9. november 2026): kampene har deres egen sang (`kamp` i `src/ui/musik/sange.ts`, 160 slag i minuttet, d-mol med trommer). Den spiller, så længe kampvinduet er åbent, og den forrige sang kommer tilbage bagefter. Kameraet zoomer kun i hele trin (1 eller 2) under dialog og klipper i stedet for at glide, så pixlerne ikke "flyder". Fortælleren zoomer ikke.
- **Stemning og liv** (9. november 2026): bløde kanter mellem græs, skov og sti, sten, tuer og svampe på jorden, skygger, partikler (ildfluer, blade, fnug, pollen, støv), figurer der blinker og trækker vejret, gang i fire trin, farvetone og vignet pr. sted, trækroner i forgrunden og pixelrammer om dialog, opgavekort, menu og kampens bokse. Taleboblen står over figuren, og træer foran figurer bliver halvt gennemsigtige. Se `docs/grafik.md`.
- **Oplæsningsknap og mellemrum** (9. november 2026): alle oplæsningsknapper er et lille, dæmpet højttalerikon (navnet står i aria-label og title). I dialogen går mellemrum videre, også når fokus står på ikonet. Står fokus på selve Videre-knappen, eller skal eleven vælge, gør browseren det sædvanlige.
- **Gemmekode version 3** (9. november 2026): nye færdigheder (fra `laes.rim`) står til sidst i koden. Versionen står i de første 3 bit, så koder fra version 1 og 2 stadig kan læses (en test bruger en rigtig kode fra version 2).
- **Frivilligt indhold efter kapitlets slutning:** når kapitlet er slut, skifter spillet til fyrtårnet, og sidemissionen og den svære udfordring kan ikke længere nås. De skal klares, mens man er på stedet.
- **Betingelser på replikker** (9. november 2026): en replik eller en valgmulighed kan have `hvis` (et valg, der er taget eller ikke taget, eller Klattens venlighed). Se `src/engine/betingelse.ts`. Replikkerne vælges, når dialogen starter. Klatten kommer med i en kamp med feltet `klatten` på kamptrinnet. Har eleven givet Klatten kappen tilbage, er den ikke længere i tasken.
- **Frivilligt indhold** (9. november 2026): sidemissioner (`missioner` i kapitlet) og udflugter (`udflugt` på et sted) er ikke trin, så gamle gemmekoder peger rigtigt. Belønningen er hukommelsesskår, som står i gemmekoden. Hvor langt man er i en mission, står kun i browseren. Skårenes minder ligger i tasken.
- **Animationer** (9. november 2026, fortsat): ord falder på plads, når et væsen bliver roligt. En ny ting flyver ned i tasken, og tasken hopper. Tågebanker og en tynd regn i Viskeskoven.
- **Kampe** (3. november 2026): turbaserede som i gamle rollespil, med hold, skade, svagheder, hjælpernes evner, ting fra tasken og blødt nederlag. Se `docs/historie.md` under Kampe.
- **Lyd:** Gemini-stemmer pr. figur i `src/content/stemmer.json`. Stemmerne kan få rumklang, mens de afspilles (`src/ui/rumklang.ts`, profiler under `rum` i `stemmer.json`): hviskestemmen, introen og tilbageblik. Klippene er uberørte, og rummet kan slås fra i indstillingerne. "Mindre uhygge" halverer det. Aldrig på opgaver, feedback og enkeltord, fordi det gør tale sværere at forstå.
- **Test og værktøj:** Hop direkte til et sted med `?hop` (se README). Med `&valg=aeseloere.tilgivet&venlighed=1&skaar=alle` kan man hoppe ind med valg, venlighed og alle skår (kun til test, gemmes aldrig). `?debug=1` viser billeder pr. sekund. `?lyd=1` er korrektursiden for lyd.
- **Grafikark:** `npm run grafik:ark` tegner alle pixelfigurer på én side, gemmer billeder i `test-results/ark/` og skriver advarsler om størrelse og farver. Nye pixelfigurer skal tilføjes i `src/ark/samling.ts`, så de kommer med.

## Beslutninger (Henrik)

- 10. november 2026: Kapitel 8: slutningen bygges med tre valg (hvor Skyggen hører til, hvem der er der, og sætningen efter Og så ...). Den sande slutning kræver alle 10 hukommelsesskår og venlighed mod Klatten mindst én gang. Skyggen kan få et af fire navne.

- 9. november 2026: Kapitel 7 har fire genrer (eventyr, krimi, gyser, science fiction) og bruger `laes.forstaaelse` (ingen ny gemmekode). Hjælperne går kun midlertidigt: Æseløre går med Den Ufærdige, hvis eleven ikke tilgav ham, og Klatten er kun med, hvis eleven var venlig. Ingen straffes i opgaverne. Hviskningen "Og så ..." er fjernet fra introen.

- 9. november 2026: Kapitel 6 får korrektur som "find og vælg" (tryk på fejlen, vælg blandt tre stavemåder). Klattens fejl er stumme bogstaver, dobbeltkonsonant, udsagnsord i datid og navneord i bestemt flertal. Kapitlet har en kort kamp, hvor Klatten er med, hvis eleven har været venlig.

- 30. oktober 2026: 16-bit pixelgrafik set skråt oppefra.
- 31. oktober 2026: Claude merger sine egne pull requests, når testen er grøn og der ikke er konflikter. Gemini TTS er betalt, men har en dagskvote.
- 3. november 2026: Henrik foretrækker den originale fortællerstemme. Den gamle mands stemme er fjernet. Rumklang lægges på i afspilleren (ikke bagt ind i klippene), kun på hviskestemmen, introen og tilbageblik.
- 3. november 2026: Kampene skal være turbaserede med skade og uhygge og mere end spørgsmål. Blødt nederlag. Holdet er avataren og hjælperne.
- 3. november 2026: Chromebook testet af Henrik og fungerer (tal for billeder pr. sekund er ikke noteret).
- 8. november 2026: Gem ligger i menuen (Gem spillet), ingen pop op med QR efter en del, kun en kort besked. Dialogen lukker selv efter sidste replik, når den er læst op. Og-ormen er nu "klip ormen i stykker". Tilbageblik er frivillige minder: de afbryder ikke dialogen, man får en besked og kan se dem i tasken. Henrik vil have langt flere og mere kreative animationer, kampen i fuld skærm med mindre tekst og et layout uden rammer.
- 3. november 2026: Grafikken tages videre med effekter som kode, flere udkast og valg (se `docs/grafik.md`). Vi bliver i Phaser.

## Åbent og mangler

- **Flere animationer (idéliste, 9. november 2026):** Klatten der flygter med en blækstribe, broen der samler sig planke for planke, fyrtårnets lys der tænder, Og-ormen der kryber væk efter sidste klip, Den Ufærdige der toner frem i mørket. Bygget: ting i tasken, ord på plads, regn og tåge.
- **Lyd:** Halvsangen er en ny figur med stemmen Leda. Hendes replikker, banens intro og udflugtens replikker mangler klip, til lydjobbet har kørt.
- **Grafik i Viskeskovens bane** er en første udgave: bleg skovbund, hvidt tomrum og tåge. Henrik bør se den.
- **Lyd:** Den nye Og-orm-instruks (`ogorm.klip.instruks`) mangler sit klip. Tilføj den til testen i `src/ui/oplaesning.test.ts`, når lydjobbet har lavet den.

- **Lyd:** Mange klip mangler stadig. Status: `npm run lyd:status` eller `public/lyd/manifest.json`. Googles dagskvote på 100 klip gør, at det tager flere dage.
- **Kapitel 8, nyt og ikke set af Henrik:** Den sidste side (linjeret papir), Halvsætningen og den lille Skygge, sangen `siden` og de fire navneforslag (Skumring, Pip, Lille Mørk, Fnug). Klippene mangler, til lydjobbet har kørt.
- **Slutningens valg gemmes kun i browseren** (`slut.*` og `skygge.navn.*`), ikke i gemmekoden. Skifter en elev computer midt i kapitel 8, mangler de valgte linjer i oplæsningen. Resten af kapitlet virker.
- **Kapitel 7, nyt og ikke set af Henrik:** De halve lande (pletter, der kun er tegnet med blyant), fire nye figurer (Prinsesse Hilde, Kommissær Lup, Grumsen og Bip) med nye stemmer, sangen `halve` og banen Den halve bro. Genreteksterne står i `src/content/ord/genre.json`. Klippene mangler, til lydjobbet har kørt.
- **Kapitel 6, nyt og ikke set af Henrik:** grafikken til Blæksøen (sort sø, Klattens hytte, Krusedullerne, Postsneglen), banen Stenene over Blæksøen, kampens baggrund og sangene `blaeksoe` og `hytte`. Postsneglen (stemmen Gacrux) og Krusedullerne (Sadachbia) er nye stemmer, og kapitel 6-klippene mangler, til lydjobbet har kørt. Korrekturopgavens fejl (16 tekster) bør ses igennem af Henrik: står i `src/content/ord/korrektur.json` og i korrekturlisten.
- **Kapitel 5, nyt og ikke set af Henrik:** grafikken til arkivet (reoler, Fru Fodnote, Den Tvivlende Sætning, Den Ufærdiges blege øjne i mørket), banen De høje reoler, kampens baggrund og sangen `arkiv`. Fru Fodnote (stemmen Pulcherrima) og Den Tvivlende Sætning (Puck) er nye stemmer, og alle kapitel 5-klip mangler, til lydjobbet har kørt.
- **Fru Fodnote kommenterer gemmekoden** (fra `docs/historie.md`) er ikke bygget.
- **Hovedfarve i designeren** har kun virkning, når hovedet har hætte eller kasket.

## Ikke testet

- Chromebook (Lenovo 500e Gen 2): Henrik har testet, og det fungerer. Kampscenen i fuld skærm og animationerne er ikke testet på Chromebook.
- Kampenes balance med rigtige elever (simuleret i `kampmotor.test.ts`).
- Touch på rigtige enheder.
- Hvordan rumklangen lyder (Henrik skal lytte og vurdere mængden) og dens processorforbrug på Chromebook Gen 2. Målt i Chrome: lyden går gennem rummet og klinger ud efter klippet.
- Kapitel 5 er gennemspillet i Chrome (`e2e/kapitel5.spec.ts`, med sidemission og udflugt), men ikke på Chromebook. Banen De høje reoler er kun tjekket med `kanKlares`, ikke spillet med tastatur.
- Kapitel 6 er gennemspillet i Chrome (`e2e/kapitel6.spec.ts`): venlig vej med Klatten på holdet og vejen, hvor man sniger sig ind. Ikke på Chromebook. Banen Stenene over Blæksøen er kun tjekket med `kanKlares`.
- Kapitel 7 er gennemspillet i Chrome (`e2e/kapitel7.spec.ts`) ad begge veje. Ikke på Chromebook. Den halve bro er kun tjekket med `kanKlares`.
- Kapitel 8 er gennemspillet i Chrome (`e2e/kapitel8.spec.ts`): den sande slutning og vejen uden alle skår. Ikke på Chromebook.
- At lydjobbet selv lægger spillet ud, når det har lavet klip, ved den planlagte kørsel.

## Kendte fejl og faldgruber

- **Rettet 9. november 2026:** i et escape room kunne de frivillige ting (sidemission, blade og udflugt) ikke undersøges. Og et klik på en ting kunne undersøge en anden ting, der stod lige så tæt på. Nu vinder den ting, man klikkede på.

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
