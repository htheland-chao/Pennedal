# Licenser for grafik, skrifttyper og pakker

- **Pixelify Sans** (overskrifter og navne): SIL Open Font License 1.1, via `@fontsource/pixelify-sans`.
- **Grafik:** Al grafik er stadig pladsholdere tegnet med kode i projektet. Pixelgrafikken tegnes i `src/game/pixel/` ud fra tegnkort i `sprites.ts` (udendørs) og `inde.ts` (biblioteket og kælderen). Avataren i menuerne tegnes i `src/ui/avatarSvg.ts`. `src/game/tegn.ts` bruges kun til steder uden kort. Billeder i ordkort og opgaver er emoji, som computerens egen skrifttype tegner. De er også pladsholdere.
- **Stemmer:** Lydklippene i `public/lyd` er lavet med Google Gemini TTS (model og stemmer står i `src/content/stemmer.json`). Google gør ikke krav på det genererede indhold, jf. Gemini API Additional Terms of Service. Klippene laves kun ud fra spillets egne tekster.
- **Atkinson Hyperlegible** (standardskrift): SIL Open Font License 1.1, via @fontsource.
- **OpenDyslexic** (ordblindevenlig skrift): SIL Open Font License 1.1, via @fontsource.
- **Phaser, React, Vite, qrcode:** MIT-licens.
- **Dansk ordbog til stavetjekket** (dictionary-da, Stavekontrolden): GPL-2.0, LGPL-2.1 eller MPL-1.1. Bruges kun under udvikling og kommer ikke med i spillet.

Når der kommer rigtig grafik (fx fra Blender eller Kenney.nl), skrives kilde og licens her.
