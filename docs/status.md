# Status for Pennedal

Overdragelsesfil til hver ny session (Claude eller Henrik). Læs den først, og opdatér den i hver pull request, der ændrer noget af det, der står her. Sidst opdateret 26. november 2026.

Regler og stak står i `CLAUDE.md`. Historien står i `docs/historie.md`, grafikken i `docs/grafik.md`, og hvad der er lavet hvornår i `docs/logbog.md`.

## Hvad der findes

Kort overblik. Hvornår og hvordan hver ting blev lavet, står i `docs/logbog.md` (nyeste øverst). Læs kun det afsnit i logbogen, opgaven handler om.

- **Hele spillet, kapitel 1-8, kan spilles**, og **Blækdybet** (uendelig prøvetur) åbner, når det sidste kapitel er klaret.
- **Fortælling:** intro som en film med trailer og overgange, titelskærm som pixelscene, kapitelkort, tilbageblik, betingelser på replikker, valg der følger med til slutningen. Historien står i `docs/historie.md`.
- **Læring:** Hviskeformularer, Og-ormen, Historiebroen, bevisjagt, ordsten på banerne og rim. Sværhedsgraden tilpasser sig (niveau 1-5). Feedback med regel og eksempel, læst op med Æseløres stemme.
- **Kampe:** turbaserede med hold, svagheder, Lyt, Forsvar, varslede storangreb, ting fra tasken, bestiarium og blødt nederlag. Levende figurer og egen kampmusik.
- **Frivilligt indhold:** sidemissioner, udflugter og fyrtårnet efter kapitlets slutning.
- **Gemning:** kun i elevens browser. Gemmekode version 4, QR-kode og gemmefil. Fru Fodnote kommenterer koden fra kapitel 5.
- **Grafik:** 16-bit pixelgrafik skråt oppefra. Fin grafik (640 x 360, standard) og hurtig grafik (320 x 180), der skifter af sig selv, hvis det går for langsomt. Én pixelstørrelse overalt (ingen fine figurer, kampens figurer i hele trin), én masterpalet på 64 farver for figurerne (`src/game/pixel/palet.ts`, testet), fem slags papirgraner, lys, skygger, partikler, vejr og parallakse. Pergament-og-blæk-udseende i menuer og vinduer.
- **Lyd:** Gemini-stemmer pr. figur (to modeller), rumklang, 19 lydeffekter lavet i kode og én original sang pr. tema.
- **Tilgængelighed:** oplæsning, skriftvalg og -størrelser, "Mindre uhygge", "reducer bevægelse", tastatur og touch.
- **Lærerkig** på elevens egen computer med lærerkode (`VITE_LAERERKODE`, se README).
- **Test og værktøj:** enhedstests, stavetjek, gennemspil af alle kapitler, billedtest (jobbet Billeder), grafikark, `?hop` og `?debug=1`.
- **Kodeopbygning** efter Henriks regler: `pages/`, `components/`, `data/`, `lyd/`, én opgave pr. fil, ingen fil over 500 linjer.

## Beslutninger (Henrik)

- 20. november 2026: Natten beholder sin nuværende farve. Lånt grafik kommer fra Ninja Adventure (CC0). Den nye skovbund gælder alle udendørs steder undtagen Rimbjerget, Halvelande og Sidste side.

- 19. november 2026: Ingen fine figurer. Kampens og introens figurer forstørres kun i hele trin (2 gange).

- 19. november 2026: Masterpaletten er forslag B (grafik.md-farverne udvidet), 64 farver efter at hud, blond, mørk lilla og varm lys grå kom med. Ny grafik bruger kun den.

- **Chromebook-test (16. november 2026):** Claude skal ikke tænke på eller nævne, om noget er testet på Chromebook. Henrik melder selv tilbage, hvis han oplever fejl.

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

- **Tilbageblik fra Gemini:** Henrik laver billederne gratis i Gemini-appen ud fra `docs/gemini-billeder.md` (stilark først). Ingen er lavet endnu, så alle 18 bruger de tegnede fra koden (merget 26. november 2026). Et billede kommer i brug, når dets id står i `src/game/pixel/minder/gemini.ts`.
- **Lyd:** alle 2164 klip findes (26. november 2026). Nye eller ændrede tekster får klip, næste gang lydjobbet kører (`npm run lyd:status`).
- **Grafik i Viskeskovens bane** er en første udgave: bleg skovbund, hvidt tomrum og tåge. Henrik bør se den.
- **Kapitel 8, nyt og ikke set af Henrik:** Den sidste side (linjeret papir), Halvsætningen og den lille Skygge, sangen `siden` og de fire navneforslag (Skumring, Pip, Lille Mørk, Fnug).
- **Kapitel 7, nyt og ikke set af Henrik:** De halve lande (pletter, der kun er tegnet med blyant), fire nye figurer (Prinsesse Hilde, Kommissær Lup, Grumsen og Bip) med nye stemmer, sangen `halve` og banen Den halve bro. Genreteksterne står i `src/content/ord/genre.json`.
- **Kapitel 6, nyt og ikke set af Henrik:** grafikken til Blæksøen (sort sø, Klattens hytte, Krusedullerne, Postsneglen), banen Stenene over Blæksøen, kampens baggrund og sangene `blaeksoe` og `hytte`. Postsneglen (stemmen Gacrux) og Krusedullerne (Sadachbia) er nye stemmer. Korrekturopgavens fejl (16 tekster) bør ses igennem af Henrik: står i `src/content/ord/korrektur.json` og i korrekturlisten.
- **Kapitel 5, nyt og ikke set af Henrik:** grafikken til arkivet (reoler, Fru Fodnote, Den Tvivlende Sætning, Den Ufærdiges blege øjne i mørket), banen De høje reoler, kampens baggrund og sangen `arkiv`. Fru Fodnote (stemmen Pulcherrima) og Den Tvivlende Sætning (Puck) er nye stemmer.

## Ikke testet
- **Portrætter:** alle figurer, der taler, har en 24 x 24-buste, der fylder rammen.
- **Filmsekvenser:** trintypen `film` findes. Sekvenser: ankomsten til Pennedal (`k1-ankomst`, Henrik synes tempoet er fint), mørket over tagene (`k2-moerke`, også på platformbaner), mørket i Viskeskoven (`k3-moerke`) og på Rimbjerget (`k4-moerke`), twistet i arkivet (`k5-twist`), Krusedullerne (`k6-krusedul`, ikke set af Henrik), fristelsen (`k7-fristelse`, starter ved Den Ufærdige) og slutningen (`k8-oplaesning`). Kerne i `src/engine/film/`, Phaser i `src/game/kort/film.ts` og `src/game/bane/film.ts`, React i `src/components/film/`. En figur, der toner væk, bliver væk (test). Ton til sort, stemning og en figur, der går, er skrevet, men ikke brugt i en sekvens. "Mindre uhygge" er testet (lagene i `filmlag.test.ts` og fristelsen i `e2e/film.spec.ts`). Et klik på "Videre" blev én gang ikke til noget i en test af fristelsen (ikke genskabt, se logbogen). Med 8 sekvenser er næste skridt fase 6 (en udviklerside til sekvenserne).
- **Slag i kampen:** kort stop, hvidt glimt på det ramte væsen og farvede tal (guld, rød, grøn, grå).
- **Udtryk** (glad, bange, vred) findes for Æseløre, Klatten, Vims, Fru Fodnote, Rimfod og Den Ufærdige. Andre figurer viser altid det faste portræt.
- **Masterpaletten** gælder al pixelgrafik: figurerne (`src/ark/tjek.test.ts`), verdenen, banerne, introen, titelskærmen, minderne, kampene og himlene (`verdenspalet.test.ts`). Himlene tegnes med dither (`ditherHimmel`). Undtaget: lys, nat og toning, gennemsigtige farver og effekter, der regner farver om mens spillet kører (`blegt`, `halvtTegnet`, `sne`). Menuer og vinduer (CSS) er ikke pixelgrafik og ikke tjekket.
- **Udseende-editoren:** set i Chrome i 1366 x 768 og 390 x 844, ikke på en Chromebook. De nye valg er kun set på arket `avatar-nye` og i editoren, ikke i alle kapitlernes scener.
- **Introens trailer:** kun set i Chrome på en server, ikke på en Chromebook. Med "reducer bevægelse" står klippene stille.
- **Pergament og blæk:** kun set på forsiden, i dialogen, menuen, tasken og Blækdybet i Chrome. Ikke prøvet på en Chromebook eller med høj kontrast (Windows). Knapperne er 6 pixel højere end før.
- **Animationerne fra 14. november:** kun set i Chrome på en server, ikke på en Chromebook. Broen bygges uden for skærmen, hvis man ikke står ved den (sker kun i testen). Fyrtårnets blafren er svær at se på stillbilleder.
- **Blækdybet:** ikke spillet dybere end rum 3 i en test. Balancen i de dybe rum (rum 10-30) er kun regnet på, ikke prøvet af elever.

- Titelskærmen og den spejlede kamp er ikke set på Chromebook. Titelskærmen er kun set i 1366 x 768 og 390 x 800.

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
- **Rettet 17. november 2026: gennemspil kapitel 6 fejlede en gang imellem i en lang kørsel.** Efter "Jeg tilgiver dig" starter krusedullernes dialog af sig selv. Imellem de to dialoger er der et kort øjeblik uden dialog, og testens `laesDialog` stoppede netop der på en langsom maskine. Nu venter den 0,6 sekund på en ny dialog. Årsagen er fundet ved at læse koden, ikke ved at få fejlen frem igen. De andre kapitlers `laesDialog` har samme mønster og er ikke ændret.
- **GitHub GraphQL er blokeret** i Claudes miljø. Brug `gh api` med REST.
- **Google er blokeret** i Claudes miljø. Lydklip laves kun af GitHub-jobbet Lyd.

## Arbejdsgang

1. Ny gren, ændring, `npm test` (og `npm run typecheck`, `npm run build`).
2. Ved grafik: kør `npm run grafik:ark` og se billederne selv.
3. Pull request, vent på grøn `test`, merge hvis der ikke er konflikt.
4. Opdatér denne fil, hvis status, beslutninger eller åbne punkter ændrede sig.
