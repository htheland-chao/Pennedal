# Pennedal

Et danskfagligt fantasy-læringsspil til 5. klasse. Spillet kører i Chrome, også på skolens Chromebooks.

**Version 0.1 - kapitel 1, "Den glemte skuffe" (ca. 20 minutter).** Testudgave: Grafikken er pladsholdere, og der er ingen lyd endnu.

## Hvad er med i version 0.1

- Avatar-designer med navn fra ordlister (eleven kan ikke skrive et frit navn), mange hudfarver, frisurer og tørklæde.
- Kapitel 1 i tre dele: skolebiblioteket, kælderen og Pennedal.
- Tre læringsmekanikker: **Hviskeformularer** (stumme bogstaver), **Og-ormen** (punktum og stort bogstav) og **Historiebroen** (fortællingens opbygning). Desuden en **bevisjagt** i læsning.
- Sværhedsgraden tilpasser sig eleven (niveau 1-5). Fart giver aldrig point.
- Feedback med regel og eksempel. Efter to forkerte gæt skal eleven vælge den rigtige regel, før der kan gættes igen.
- Gemmer automatisk i browseren efter hver opgave. Gemmekode, QR-kode og gemmefil til at fortsætte på en anden computer.
- **Lærerkig** på elevens egen computer (lærerkode: `2026`) med niveau pr. færdighed og CSV-eksport.
- Oplæsning med Chromes danske stemme, tre skriftstørrelser, OpenDyslexic, "Mindre uhygge", fuld tastaturstyring og touch.

## Hvad er ikke med endnu

- Login, lobby og et samlet lærerpanel. De kræver, at elevdata gemmes på en server, og det venter, til kommunens databeskyttelsesrådgiver har godkendt det.
- Rigtig grafik, musik og lydeffekter. De indtalte stemmer bliver lavet løbende (se Lyd og stemmer).
- Kapitel 2 og frem.

## Databeskyttelse i version 0.1

Spillet sender ingen data om eleverne nogen steder hen. Alt gemmes kun i elevens egen browser:
avatarnavn fra ordlisterne, udseende, fremskridt og antal rigtige og forkerte svar pr. færdighed.
Der gemmes ingen navne, ingen e-mail og ingen elevtekster. Hostingudbyderen (Firebase Hosting) kan som alle websider se IP-adresser, når spillet hentes.

## For Henrik: sådan prøver du spillet

**Testlink:** Den nyeste udgave af `main` ligger altid på https://htheland-chao.github.io/Pennedal/ (bliver opdateret, når testene er grønne). Linket er offentligt, så del det ikke med eleverne, før spillet er klar.

Til eleverne skal spillet senere ligge på Firebase (se herunder). Du kan også køre det på din egen computer:

1. Installér Node.js (LTS-udgaven) fra [nodejs.org](https://nodejs.org).
2. Hent koden: Tryk på den grønne knap **Code** på GitHub og vælg **Download ZIP**. Pak den ud.
3. Åbn mappen, tryk på adresselinjen i Stifinder, skriv `powershell` og tryk Enter.
4. Skriv `npm install` og vent. Skriv derefter `npm run dev`.
5. Åbn adressen, der vises (fx `http://localhost:5173`), i Chrome.

Tilføj `?debug=1` til adressen for at se ydelsesmåleren (billeder pr. sekund og hukommelse). Prøv det på en Lenovo 500e Gen 2.

## Sådan arbejder vi

- Alle ændringer kommer som en **pull request** på GitHub. Du ser ændringerne igennem og trykker **Merge**.
- Ved hver pull request kører alle tests automatisk (fanen **Actions**). Skærmbilleder og korrekturliste kan hentes under testkørslen.
- Slå **branch protection** til på `main`, så en pull request kun kan merges, når testene er grønne: Settings → Branches → Add rule → `main` → "Require status checks to pass".

## Kommandoer

| Kommando | Hvad den gør |
| --- | --- |
| `npm run dev` | Starter spillet på din computer |
| `npm test` | Kører enhedstests og stavetjek |
| `npm run test:e2e` | Spiller kapitel 1 igennem automatisk i Chrome |
| `npm run stavetjek` | Stavetjekker al dansk tekst |
| `npm run korrektur` | Laver `korrektur/korrekturliste.md` med al tekst til gennemlæsning |
| `npm run build` | Bygger spillet til `dist/` |
| `npm run lyd:status` | Tæller, hvor mange lydklip der mangler, og fjerner forældede klip |

## Lægge spillet online med Firebase Hosting (engangsopsætning)

Firebase Hosting er gratis på Spark-planen og kræver intet kreditkort. Du får en vejledning trin for trin, når du er klar. Kort fortalt:

1. Opret et projekt på [console.firebase.google.com](https://console.firebase.google.com) med din private konto. Slå Google Analytics fra.
2. Installér Firebase-værktøjet: `npm install -g firebase-tools` og log ind med `firebase login`.
3. I projektmappen: `firebase init hosting:github`. Vælg dit projekt og repoet `htheland-chao/pennedal`. Brug den eksisterende `firebase.json`. Byggekommandoen er `npm ci && npm run build`.
4. Værktøjet opretter selv en hemmelig nøgle på GitHub og to workflows, der lægger spillet online, når en pull request bliver merget.

## Lyd og stemmer

Figurerne har hver sin stemme, lavet med Google Gemini TTS. Stemmer og stilinstruktioner står i `src/content/stemmer.json`.

**Det kan gå galt, og sådan er det forebygget:**

- Elevtekster må aldrig sendes til Google. Kun tekster fra `src/content` bliver lavet til lyd, og en test tjekker det.
- Nøglen må ikke komme i koden eller i chatten. Den ligger kun som hemmelighed på GitHub.
- Dansk er en prøveversion hos Google, så udtalen kan være forkert. Lyt alle nye klip igennem, før du merger.
- Mangler et klip, læser spillet op med computerens egen stemme. Al tale står også som tekst.

**Engangsopsætning:**

1. Lav en API-nøgle i [Google AI Studio](https://aistudio.google.com) med din private konto.
2. På GitHub: Settings > Secrets and variables > Actions > New repository secret. Navn: `GEMINI_API_KEY`.
3. På GitHub: Settings > Actions > General > Workflow permissions. Slå "Allow GitHub Actions to create and approve pull requests" til.

**Sådan laves klippene:** Jobbet Lyd kører hver nat og laver op til 40 nye klip, indtil alle findes. Du kan også starte det selv under Actions > Lyd > Run workflow. Klippene kommer som en pull request.

**Sådan lytter du:** Skriv `?lyd=1` efter spillets adresse. Lyder et klip forkert, så kopiér nøglen og kør jobbet Lyd med nøglen i feltet til klip, der skal laves om. Bliver et navn udtalt forkert, kan der skrives en udtalehjælp i `udtale` i `stemmer.json`.

## Indhold og tekst

Al dansk tekst ligger i `src/content/`:

| Fil | Indhold |
| --- | --- |
| `tekster/da.json` | Knapper, beskeder og feedback |
| `kapitler/kapitel1.json` | Steder, replikker og opgaver i kapitel 1 |
| `ord/stumme.json` | Ord med stumme bogstaver |
| `ord/ogorm.json` | Tekster til Og-ormen |
| `ord/historiebro.json` | Historier til Historiebroen |
| `ordkort.json` | Ordkort med forklaring og eksempel |
| `stemmer.json` | Stemme og stilinstruktion til hver figur |
| `maal.json` | Koblingen til Fælles Mål. Skiftes ud, når fagplanerne kommer i 2027 |

Ord, som stavetjekket ikke kender, men som er rigtige, skrives i `scripts/egne-ord.txt`.
