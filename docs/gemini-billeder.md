# Billeder fra Gemini

Henrik, 26. november 2026: Pennedal må bruge billeder, som Gemini har lavet, men det må ikke koste ekstra.
Derfor laves billederne i den gratis Gemini-app (gemini.google.com), ikke med API'et, der betales pr. billede.
Der er et dagligt loft for gratis billeder, så det kan tage et par dage at nå dem alle.

Kun vores egne beskrivelser af scenerne sendes til Google. Aldrig noget om eleverne (krav 4).

## Sådan

1. **Stilark først.** Lav stilarket herunder én gang og gem det som `stilark.png`. Det sendes med som forbillede til
   alle andre billeder, så Skyggen, hæftet og ærmerne ligner hinanden.
2. **Ét minde ad gangen.** Åbn en ny chat i Gemini, vælg "Create image", vedhæft `stilark.png`, og indsæt
   STIL-teksten plus mindets tekst. Lav 2-3 udgaver, hvis loftet rækker.
3. **Gem som PNG** med mindets id som navn (fx `blaek.png`) i en mappe på computeren, som Claude har adgang til
   (i Claude-appen: + og "Add folder").
4. **Claude gør dem klar:** `node scripts/billede-til-palet.mjs ind.png public/minder/<id>.png` skærer til 16:9,
   skalerer ned til 320 x 180 og farver om til masterpaletten. Så skrives id'et i `src/game/pixel/minder/gemini.ts`.
   Testen `gemini.test.ts` tjekker størrelsen og farverne.
5. Claude vælger den bedste udgave og afviser billeder med forkerte hænder, bogstaver, ansigter på voksne eller
   en anden stil. Minder uden et godkendt billede bruger stadig de tegnede fra koden.

## STIL (sættes foran hvert minde)

```
16-bit pixel art illustration in the style of a SNES-era JRPG cutscene, wide 16:9 frame.
Low resolution with clearly visible square pixels, as if drawn at 320x180 and scaled up. Deliberate pixel clusters, clean dark outlines, no blur, no gradients except dithering.
Warm, faded colours like an old photograph: warm browns, cream paper, muted greens, dusty blues, soft lamplight from the left.
A quiet, gentle childhood memory seen from a child's point of view. Calm and a little melancholic, never scary.
Absolutely no text, letters, numbers or symbols anywhere. Writing on paper is shown only as short unreadable grey strokes.
No faces of adults: adults are only hands, sleeves or a dark silhouette. No logos, no watermark.
Keep the green notebook, the small shadow creature and the child's blue sleeves exactly as in the attached reference sheet.
```

## Stilark (laves først, uden STIL foran)

```
16-bit pixel art character and prop reference sheet on a plain cream background, SNES style, clearly visible pixels, no text.
Show, spread out and not overlapping:
1. A small green school notebook, closed: soft green cover with a darker spine, cream page edges, and a small square cream label on the cover with a tiny hand-drawn picture of the shadow creature.
2. The same notebook lying open: two cream pages with short unreadable grey pencil strokes as writing.
3. The shadow creature: a small round, soft black blob like a little ghost with a wavy bottom edge, two big round white eyes with black pupils, no mouth, no arms. Friendly and shy.
4. A child's right hand holding a yellow pencil, with a blue knitted sweater sleeve.
5. A child's open left hand with the same blue sleeve.
6. An adult's hand with a grey-lilac cardigan sleeve.
```

## Minderne

**blaek** - Blæk og regn
```
Evening. Rain on a dark window on the left. A hanging lamp hums over a wooden table. On the table a sheet of paper with grey pencil strokes, a small ink bottle and a fresh ink blot. A child's hand grips the pencil so hard the knuckles are white. Seen from slightly above, close to the table.
```

**streger** - Røde streger
```
Top-down view of the open green notebook on a wooden table. The pages are full of unreadable grey pencil writing, and wavy red pen lines are drawn across the writing. In the bottom right corner a small child's hand lifts the corner of the page to turn it.
```

**koekkenbord** - Køkkenbordet
```
A kitchen table with a red and cream checked oilcloth, warm yellow light from a lamp above. The green notebook lies open: on the left page a pencil drawing of the shadow creature, on the right page a few lines of grey writing. A happy child's hand writes with a pencil. Cosy and warm.
```

**skaar3a** - Viskelæderet
```
Close-up of the open green notebook on a checked oilcloth. One spot on the right page is grey and thin because a word has been rubbed out many times; little eraser crumbs around it. A child's hand holds a pink and blue eraser. Next to the grey spot a new short word stroke.
```

**skaar3b** - Hæftet på gulvet
```
An empty classroom after school, afternoon light through a big window. Chairs are turned upside down on the desks. On the wooden floor under a desk lies the green notebook. An adult's hand with a grey-lilac sleeve reaches down from the right to pick it up. Quiet and dusty.
```

**godnat** - Godnathistorien
```
A dark child's bedroom at night. A small lamp glows on the bedside table on the left. In the warm light an open book is held by two adult hands with grey-lilac sleeves, reading aloud. A blue duvet in front. In a small dream bubble in the dark corner, the shadow creature peeks out.
```

**skaar4a** - Skyggen i margenen
```
Top-down view of a squared maths notebook page on a wooden desk. Columns of small grey pencil marks like sums (not real numbers). Out in the margin a small pencil drawing of the shadow creature, and next to it a faint grey smudge where another drawing was rubbed out. A yellow pencil lies diagonally.
```

**skaar4b** - Døren på klem
```
A dark child's room in the evening. A door on the left stands ajar, warm light from the hallway falls in a long stripe across the wooden floor. In the gap of the door stands a dark adult silhouette, only an outline. The light stripe reaches a small desk with a closed drawer on the right.
```

**skyggen** - Skyggen bliver tegnet
```
Late evening at a wooden desk lit by a small desk lamp on the left. The closed green notebook lies in the lamplight. A child's hand carefully draws the shadow creature on the cream label on the cover with a pencil.
```

**skaar5a** - Fodnoten
```
Close-up of a cream notebook page full of unreadable grey writing. At the very bottom, under a thin line, a row of tiny writing like a footnote, and next to it a small yellow star drawn with pencil. A child's hand with a pencil has just finished the star.
```

**skaar5b** - Vindueskarmen
```
A child sits in a deep window seat on a rainy grey day, seen from the child's own point of view. Big window with rain streaks, grey sky. On the child's knees in blue trousers lies the closed green notebook, held shut by two small hands with blue sleeves.
```

**foldet** - Hjørnet bliver foldet
```
Night, top-down view of the open green notebook on a wooden desk in lamplight. The left page is full of grey writing, the right page has only a few lines. The top right corner of the right page is folded down, and a child's hand presses the fold flat.
```

**skaar6a** - Klatten på siden
```
Close-up of a lined cream page with a large black ink blot in the middle. Someone has drawn two thin legs and two small round white eyes on the blot, so it looks like a funny little creature. A few small ink splashes around it. A dark fountain pen lies next to it.
```

**skaar6b** - Kassen ved døren
```
A tidied-up child's room, afternoon light. A closed wooden door on the left. On the floor by the door stands an open cardboard box with old books to give away, and on top of the books lies the green notebook. On the right an empty desk drawer is pulled out.
```

**soeskendet** - Nogen ved skuffen
```
Afternoon. A wooden desk seen from the front with its drawer pulled all the way out. The drawer is full of loose papers and old drawings. Two hands with red sleeves, from someone older than a child, rummage through the papers, searching.
```

**skaar7a** - Kassen på biblioteket
```
A quiet library: tall bookshelves full of colourful books behind a wooden counter. On the counter stands a cardboard box of old donated books. A large, calm adult hand with a brown sleeve lifts the green notebook out of the box.
```

**skaar7b** - Skyggen på vejen
```
Many years later. View through a rainy bus window on a grey day. Outside a wet road with a row of dark green trees. On the road a small dark shadow glides along, the shadow creature, almost unnoticed. The bus window frame and the top of a blue seat in the foreground.
```

**skuffen** - Skuffen
```
Afternoon. A wooden desk seen from the front. A child's hand with a blue sleeve shoves the green notebook into the desk drawer so hard that the drawer slams; small motion lines show the bang.
```
