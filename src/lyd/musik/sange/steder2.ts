/**
 * Sangene til stederne i den sidste del af historien: Viskeskoven, Rimbjerget, Arkivet, Blæksøen, De Halve Lande og Den Sidste Side.
 * Delt ud af sange.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { arpeggio, heleTakter, type Sang } from '../noder';

/**
 * Viskeskoven: hvid og stille. En spinkel melodi i D-dorisk, hvor nogle toner mangler,
 * som om de er blevet visket ud. Lange pauser og en blød bas.
 */
export const viskeskov: Sang = {
  bpm: 72,
  spor: [
    { lyd: 'trekant', styrke: 0.24, noder: heleTakter(['D2', 'C2', 'G2', 'A2', 'D2', 'C2', 'G2', 'D2']) },
    {
      lyd: 'firkant',
      styrke: 0.06,
      noder:
        'D5 - F5 - A5 - . . | G5 - - - E5 - . . | D5 - . . B4 - D5 - | E5 - - - . . . . | ' +
        'F5 - A5 - C6 - . . | B5 - - - G5 - . . | A5 - . . F5 - E5 - | D5 - - - - - . .',
    },
    {
      lyd: 'trekant',
      styrke: 0.08,
      noder: arpeggio([
        ['D3', 'F3', 'A3'], ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'],
        ['D3', 'F3', 'A3'], ['C3', 'E3', 'G3'], ['G3', 'B3', 'D4'], ['D3', 'F3', 'A3'],
      ]),
    },
  ],
};

/** Viskeskovens bane: samme sang som skoven, lidt hurtigere, fordi man løber og hopper. */
export const viskesti: Sang = { ...viskeskov, bpm: viskeskov.bpm + 14 };

/**
 * Rimbjerget (kapitel 4, 9. november 2026): koldt, blæsende og fjollet. G-dur i en vuggende rytme, en melodi,
 * der hopper som en trold, der prøver at lade være med at rime, og et ekko (samme motiv, svagere og senere).
 */
export const rimbjerg: Sang = {
  bpm: 96,
  spor: [
    { lyd: 'trekant', styrke: 0.22, noder: heleTakter(['G2', 'D2', 'E2', 'C2', 'G2', 'D2', 'C2', 'D2']) },
    {
      lyd: 'firkant',
      styrke: 0.07,
      noder:
        'G5 . B5 . D6 - B5 . | A5 . F#5 . D5 - - . | E5 . G5 . B5 - G5 . | E5 - C5 - . . . . | ' +
        'G5 . B5 . D6 - E6 . | D6 . B5 . G5 - - . | C6 . B5 . A5 - G5 . | A5 - - - D5 - - .',
    },
    {
      // Ekkoet: samme melodi en oktav lavere, en ottendedel senere og meget svagere.
      lyd: 'trekant',
      styrke: 0.04,
      noder:
        '. G4 . B4 . D5 - B4 | . A4 . F#4 . D4 - - | . E4 . G4 . B4 - G4 | . E4 - C4 - . . . | ' +
        '. G4 . B4 . D5 - E5 | . D5 . B4 . G4 - - | . C5 . B4 . A4 - G4 | . A4 - - - D4 - -',
    },
    { lyd: 'stoej', styrke: 0.018, noder: '. . C8 . . . C8 . | '.repeat(8).slice(0, -3) },
  ],
};

/**
 * Fodnoternes kælder (kapitel 5): nysgerrig og lidt hemmelighedsfuld, E-mol. En lille melodi, der går på listesko
 * mellem reolerne, en rolig bas og en tynd klokke, som når man vender en gammel side. Klokken er væk med "Mindre uhygge".
 */
export const arkiv: Sang = {
  bpm: 76,
  spor: [
    {
      lyd: 'trekant',
      styrke: 0.28,
      noder:
        'E2 - - - B2 - - - | C3 - - - G2 - - - | A2 - - - E2 - - - | B1 - - - B2 - - - | ' +
        'E2 - - - B2 - - - | C3 - - - A2 - - - | D2 - - - B1 - - - | E2 - - - - - - -',
    },
    {
      lyd: 'firkant',
      styrke: 0.12,
      noder:
        'B4 . E5 . G5 . F#5 E5 | E5 - . . G4 . . . | A4 . C5 . E5 . D5 C5 | B4 - - - D#5 - . . | ' +
        'B4 . E5 . G5 . A5 G5 | F#5 - . . E5 . . . | F#5 . D5 . B4 . A4 F#4 | E4 - - - - - . .',
    },
    {
      lyd: 'trekant',
      styrke: 0.08,
      noder: arpeggio([
        ['E3', 'G3', 'B3'], ['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'], ['B2', 'D#3', 'F#3'],
        ['E3', 'G3', 'B3'], ['C3', 'E3', 'A3'], ['D3', 'F#3', 'B3'], ['E3', 'G3', 'B3'],
      ]),
    },
    {
      lyd: 'firkant',
      styrke: 0.03,
      uhygge: true,
      noder:
        '. . . . . . . . | . . . . . . E6 . | . . . . . . . . | . . . . . . . . | ' +
        '. . . . . . . . | . . . . . . . . | . . . . . . D#6 . | . . . . . . . .',
    },
  ],
};

/**
 * Blæksøen (kapitel 6): en langsom vals i A-mol, lidt sørgmodig og lidt fjollet, som Klatten selv.
 * Bassen vugger som bølger på blæk, og en lille melodi går op og ned. Den dybe, skæve tone er væk med "Mindre uhygge".
 */
export const blaeksoe: Sang = {
  bpm: 72,
  spor: [
    {
      lyd: 'trekant',
      styrke: 0.3,
      noder:
        'A2 - - - E3 - - - | F2 - - - C3 - - - | D2 - - - A2 - - - | E2 - - - B2 - - - | ' +
        'A2 - - - E3 - - - | F2 - - - C3 - - - | D2 - - - E2 - - - | A2 - - - - - - -',
    },
    {
      lyd: 'firkant',
      styrke: 0.11,
      noder:
        'E5 - C5 - A4 - . . | F5 - E5 - C5 - . . | D5 - F5 - A5 - G5 F5 | E5 - - - G#4 - . . | ' +
        'E5 - C5 - A4 - B4 C5 | D5 - C5 - A4 - . . | F4 - A4 - D5 - C5 B4 | A4 - - - - - . .',
    },
    {
      lyd: 'trekant',
      styrke: 0.08,
      noder: arpeggio([
        ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['E3', 'G#3', 'B3'],
        ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['D3', 'F3', 'A3'], ['A3', 'C4', 'E4'],
      ]),
    },
    {
      lyd: 'firkant',
      styrke: 0.03,
      uhygge: true,
      noder:
        '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . Bb3 - | ' +
        '. . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . . .',
    },
  ],
};

/** Klattens hytte: varm og rodet, F-dur, en lille marchmelodi for en, der gerne vil være frygtelig. */
export const hytte: Sang = {
  bpm: 96,
  spor: [
    {
      lyd: 'trekant',
      styrke: 0.28,
      noder:
        'F2 - C3 - F2 - C3 - | Bb1 - F2 - Bb1 - F2 - | C2 - G2 - C2 - G2 - | F2 - C3 - F2 - C3 - | ' +
        'F2 - C3 - F2 - C3 - | Bb1 - F2 - Bb1 - F2 - | C2 - G2 - C2 - E2 - | F2 - - - - - - -',
    },
    {
      lyd: 'firkant',
      styrke: 0.12,
      noder:
        'A4 . C5 . F5 - E5 . | D5 - Bb4 - . . . . | G4 . Bb4 . E5 - D5 . | C5 - A4 - . . . . | ' +
        'A4 . C5 . F5 - G5 . | A5 - F5 - D5 . . . | G4 . C5 . E5 - D5 C5 | F5 - - - - - . .',
    },
    { lyd: 'stoej', styrke: 0.03, noder: '. . C4 . . . C4 . | '.repeat(8).slice(0, -3) },
  ],
};

/**
 * De halve lande (kapitel 7): en vandrende melodi i D-dorisk, der stopper midt i frasen, som om den ikke er skrevet færdig.
 * Hvert andet sted mangler en tone. Den lave, skæve tone er væk med "Mindre uhygge".
 */
export const halve: Sang = {
  bpm: 88,
  spor: [
    {
      lyd: 'trekant',
      styrke: 0.28,
      noder:
        'D2 - - - A2 - - - | C2 - - - G2 - - - | D2 - - - A2 - - - | E2 - - - B2 - - - | ' +
        'D2 - - - A2 - - - | C2 - - - G2 - - - | Bb1 - - - F2 - - - | A1 - - - - - - -',
    },
    {
      lyd: 'firkant',
      styrke: 0.11,
      noder:
        'D5 . E5 . F5 . G5 . | A5 - - - . . . . | G5 . F5 . E5 . D5 . | B4 - - - . . . . | ' +
        'D5 . E5 . F5 . A5 . | C6 - B5 - . . . . | A5 . G5 . F5 . E5 . | . . . . . . . .',
    },
    {
      lyd: 'trekant',
      styrke: 0.07,
      noder: arpeggio([
        ['D3', 'F3', 'A3'], ['C3', 'E3', 'G3'], ['D3', 'F3', 'A3'], ['E3', 'G3', 'B3'],
        ['D3', 'F3', 'A3'], ['C3', 'E3', 'G3'], ['Bb2', 'D3', 'F3'], ['A2', 'C#3', 'E3'],
      ]),
    },
    {
      lyd: 'firkant',
      styrke: 0.03,
      uhygge: true,
      noder:
        '. . . . . . . . | . . . . . . Ab3 - | . . . . . . . . | . . . . . . . . | ' +
        '. . . . . . . . | . . . . . . . . | . . . . . . Ab3 - | . . . . . . . .',
    },
  ],
};

/**
 * Den sidste side (kapitel 8): rolig og lys, C-dur. En enkel melodi, der går hjem til grundtonen, som en historie,
 * der endelig bliver færdig. Ingen uhygge her.
 */
export const siden: Sang = {
  bpm: 70,
  spor: [
    {
      lyd: 'trekant',
      styrke: 0.28,
      noder:
        'C3 - - - G2 - - - | A2 - - - E2 - - - | F2 - - - C3 - - - | G2 - - - - - - - | ' +
        'C3 - - - G2 - - - | A2 - - - E2 - - - | F2 - - - G2 - - - | C3 - - - - - - -',
    },
    {
      lyd: 'firkant',
      styrke: 0.1,
      noder:
        'E5 - - - D5 - C5 - | C5 - - - B4 - . . | A4 - C5 - F5 - E5 - | D5 - - - - - . . | ' +
        'E5 - - - G5 - E5 - | C5 - - - E5 - . . | F5 - E5 - D5 - B4 - | C5 - - - - - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.07,
      noder: arpeggio([
        ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
        ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'],
      ]),
    },
  ],
};
