/**
 * Baggrundsmusik til Pennedal. Komponeret til spillet (31. oktober 2026), så den er original og har ingen fremmed licens.
 * Hver sang er 8 takter med 8 ottendedele og spiller i loop. Alle spor i en sang er lige lange.
 */
import { arpeggio, heleTakter, type Sang } from './noder';

/** Skolebiblioteket om morgenen: rolig og varm, C-dur. */
const bibliotek: Sang = {
  bpm: 84,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.16,
      noder:
        'E5 - G5 - C6 - B5 A5 | G5 - - - E5 - D5 - | F5 - A5 - D6 - C6 B5 | A5 - - - G5 - - - | ' +
        'E5 - G5 - C6 - B5 A5 | G5 - - - E5 - C5 - | D5 - F5 - E5 - D5 - | C5 - - - - - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.28,
      noder:
        'C3 - - - G2 - - - | A2 - - - E2 - - - | F2 - - - D2 - - - | G2 - - - G2 - - - | ' +
        'C3 - - - G2 - - - | A2 - - - E2 - - - | F2 - - - G2 - - - | C3 - - - - - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.1,
      noder: arpeggio([
        ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'],
        ['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'],
      ]),
    },
  ],
};

/** Kælderen: mørk, langsom og med lange pauser. Dryppet og den skarpe tone er væk med "Mindre uhygge". */
const kaelder: Sang = {
  bpm: 60,
  spor: [
    { lyd: 'trekant', styrke: 0.3, noder: heleTakter(['A1', 'A1', 'F1', 'E1', 'A1', 'A1', 'F1', 'E1']) },
    {
      lyd: 'trekant',
      styrke: 0.2,
      noder:
        'E4 - - - . . . . | . . F4 - E4 - . . | . . . . C4 - - - | B3 - - - - - . . | ' +
        'E4 - - - . . . . | . . G4 - F4 - . . | . . . . E4 - D4 - | E4 - - - - - - -',
    },
    {
      lyd: 'firkant',
      styrke: 0.05,
      uhygge: true,
      noder:
        '. . . . . . . . | . . . . . . Bb4 - | . . . . . . . . | . . . . . . . . | ' +
        '. . . . . . . . | . . . . . . Bb4 - | . . . . . . . . | . . . . . . . .',
    },
    {
      lyd: 'stoej',
      styrke: 0.05,
      uhygge: true,
      noder:
        '. . . . . . A6 . | . . . . . . . . | . . . A6 . . . . | . . . . . . . . | ' +
        '. . . . . A6 . . | . . . . . . . . | . . . . . . . A6 | . . . . . . . .',
    },
  ],
};

/** Pennedal om natten: undrende og lidt eventyrlig, D-dur med en hævet kvart. */
const pennedal: Sang = {
  bpm: 92,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.14,
      noder:
        'D5 - F#5 - A5 - G#5 - | A5 - - - F#5 - E5 - | D5 - F#5 - B5 - A5 - | F#5 - - - - - - - | ' +
        'G5 - B5 - D6 - C#6 - | B5 - A5 - F#5 - E5 - | D5 - E5 - F#5 - A5 - | D5 - - - - - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.28,
      noder:
        'D3 - - - A2 - - - | D3 - - - A2 - - - | B2 - - - F#2 - - - | B2 - - - A2 - - - | ' +
        'G2 - - - D3 - - - | G2 - - - A2 - - - | D3 - - - A2 - - - | D3 - - - - - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.09,
      noder: arpeggio([
        ['D4', 'F#4', 'A4'], ['D4', 'G#4', 'A4'], ['B3', 'D4', 'F#4'], ['B3', 'D4', 'F#4'],
        ['G3', 'B3', 'D4'], ['E4', 'G4', 'B4'], ['D4', 'F#4', 'A4'], ['A3', 'C#4', 'E4'],
      ]),
    },
  ],
};

/** Floden: strømmende brudte akkorder, G-dur. Slutter på D, så loopet glider tilbage. */
const floden: Sang = {
  bpm: 104,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.13,
      noder:
        'B4 - D5 - G5 - - - | E5 - - - D5 - B4 - | C5 - E5 - G5 - E5 - | D5 - - - - - - - | ' +
        'B4 - D5 - G5 - A5 - | B5 - - - A5 - G5 - | E5 - G5 - C6 - B5 - | A5 - - - D5 - - -',
    },
    { lyd: 'trekant', styrke: 0.28, noder: heleTakter(['G2', 'E2', 'C3', 'D3', 'G2', 'E2', 'C3', 'D3']) },
    {
      lyd: 'trekant',
      styrke: 0.13,
      noder: arpeggio([
        ['G3', 'B3', 'D4'], ['E3', 'G3', 'B3'], ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'],
        ['G3', 'B3', 'D4'], ['E3', 'G3', 'B3'], ['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'],
      ]),
    },
  ],
};

/** Mor Lanternes fyrtårn: varm og håbefuld, F-dur. */
const fyrtaarn: Sang = {
  bpm: 80,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.15,
      noder:
        'C5 - F5 - A5 - - - | G5 - F5 - E5 - - - | D5 - F5 - Bb5 - A5 - | G5 - - - - - - - | ' +
        'A5 - C6 - A5 - F5 - | G5 - A5 - Bb5 - G5 - | F5 - E5 - G5 - E5 - | F5 - - - - - - -',
    },
    { lyd: 'trekant', styrke: 0.28, noder: heleTakter(['F2', 'C3', 'Bb2', 'C3', 'F2', 'C3', 'C3', 'F2']) },
    {
      lyd: 'trekant',
      styrke: 0.1,
      noder: arpeggio([
        ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['Bb3', 'D4', 'F4'], ['C4', 'E4', 'G4'],
        ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['C4', 'E4', 'Bb4'], ['F3', 'A3', 'C4'],
      ]),
    },
  ],
};

/**
 * Den Ufærdige: ingen melodi, kun lave toner, der gnider mod hinanden (halvtoner), og hvisken.
 * Den skal give et sug i maven, men aldrig larme. Med "Mindre uhygge" er hvisken og den skarpe tone væk.
 */
const ufaerdige: Sang = {
  bpm: 48,
  spor: [
    { lyd: 'trekant', styrke: 0.32, noder: heleTakter(['D2', 'D2', 'Eb2', 'D2', 'D2', 'C#2', 'D2', 'D2']) },
    { lyd: 'trekant', styrke: 0.16, noder: heleTakter(['A2', 'Bb2', 'A2', 'Ab2', 'A2', 'Bb2', 'G#2', 'A2']) },
    {
      lyd: 'savtak',
      styrke: 0.035,
      uhygge: true,
      noder:
        '. . . . . . . . | Eb5 - - - - - - - | . . . . . . . . | . . . . D5 - - - | ' +
        '. . . . . . . . | . . F5 - - - - - | . . . . . . . . | E5 - - - - - . .',
    },
    {
      lyd: 'stoej',
      styrke: 0.08,
      uhygge: true,
      noder:
        '. . . C5 . . . . | . . . . . . C5 . | . C5 . . . . . . | . . . . . C5 . . | ' +
        '. . . . C5 . . . | . . . . . . . . | . . C5 . . . C5 . | . . . . . . . .',
    },
  ],
};

/** Engen foran Sætningsbyen: lys og varm morgen, G-dur, vuggende. */
const eng: Sang = {
  bpm: 88,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.13,
      noder:
        'D5 - B4 - G4 - B4 - | C5 - A4 - - - - - | D5 - B4 - G4 - B4 - | A4 - - - - - - - | ' +
        'E5 - C5 - A4 - C5 - | D5 - B4 - G4 - - - | A4 - B4 - C5 - A4 - | G4 - - - - - - -',
    },
    { lyd: 'trekant', styrke: 0.26, noder: heleTakter(['G2', 'C3', 'G2', 'D3', 'C3', 'G2', 'D3', 'G2']) },
    {
      lyd: 'trekant',
      styrke: 0.1,
      noder: arpeggio([
        ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['D4', 'F#4', 'A4'],
        ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4'],
      ]),
    },
  ],
};

/** Torvet: travlt og glad, alle snakker. C-dur med hurtige toner, der hopper. */
const torv: Sang = {
  bpm: 116,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.12,
      noder:
        'C5 E5 G5 E5 C5 - D5 - | E5 - F5 E5 D5 - - - | D5 F5 A5 F5 D5 - E5 - | F5 - E5 D5 C5 - - - | ' +
        'G5 - E5 - C5 - E5 - | F5 - D5 - B4 - D5 - | E5 C5 D5 B4 C5 A4 B4 G4 | C5 - - - - - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.26,
      noder:
        'C3 . G2 . C3 . G2 . | C3 . G2 . C3 . G2 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . D3 . | ' +
        'C3 . G2 . C3 . G2 . | F2 . C3 . G2 . D3 . | C3 . G2 . F2 . G2 . | C3 . G2 . C3 - - -',
    },
    {
      lyd: 'stoej',
      styrke: 0.03,
      noder:
        '. . C6 . . . C6 . | . . C6 . . . C6 . | . . C6 . . . C6 . | . . C6 . . . C6 . | ' +
        '. . C6 . . . C6 . | . . C6 . . . C6 . | . . C6 . . . C6 . | . . C6 . . . . .',
    },
  ],
};

/** Smøgerne: smalle og nysgerrige, a-mol, men stadig varm. */
const smoeger: Sang = {
  bpm: 96,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.11,
      noder:
        'A4 . C5 . E5 . D5 C5 | B4 - - - . . . . | A4 . C5 . F5 . E5 D5 | E5 - - - . . . . | ' +
        'C5 . E5 . A5 . G5 F5 | E5 - - - D5 - C5 - | B4 . D5 . C5 . B4 . | A4 - - - . . . .',
    },
    { lyd: 'trekant', styrke: 0.26, noder: heleTakter(['A2', 'E2', 'F2', 'E2', 'A2', 'C3', 'G2', 'A2']) },
  ],
};

/** Det gamle trykkeri: mørkt, og en tung maskine dunker i takt. d-mol. */
const trykkeri: Sang = {
  bpm: 70,
  spor: [
    { lyd: 'trekant', styrke: 0.3, noder: heleTakter(['D2', 'D2', 'Bb1', 'A1', 'D2', 'D2', 'G1', 'A1']) },
    {
      lyd: 'trekant',
      styrke: 0.16,
      noder:
        'D4 - - - . . . . | F4 - E4 - . . . . | D4 - - - . . . . | C#4 - - - - - . . | ' +
        'D4 - - - . . . . | F4 - G4 - . . . . | A4 - G4 - F4 - E4 - | D4 - - - - - - -',
    },
    {
      lyd: 'stoej',
      styrke: 0.06,
      noder:
        'A3 . . . A3 . . . | A3 . . . A3 . . . | A3 . . . A3 . . . | A3 . . . A3 . . . | ' +
        'A3 . . . A3 . . . | A3 . . . A3 . . . | A3 . . . A3 . . . | A3 . . . A3 . . .',
    },
  ],
};

/** Jagten over tagene: hurtig og spændende, e-mol med en bas, der driver frem. */
const tage: Sang = {
  bpm: 138,
  spor: [
    {
      lyd: 'firkant',
      styrke: 0.12,
      noder:
        'E5 - G5 - B5 - A5 G5 | F#5 - D5 - - - . . | E5 - G5 - B5 - D6 C6 | B5 - - - - - . . | ' +
        'C6 - B5 - A5 - G5 - | A5 - G5 - F#5 - E5 - | D5 - E5 - F#5 - G5 - | F#5 - - - B4 - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.28,
      noder:
        'E2 E3 E2 E3 E2 E3 E2 E3 | D2 D3 D2 D3 D2 D3 D2 D3 | C2 C3 C2 C3 C2 C3 C2 C3 | B1 B2 B1 B2 B1 B2 B1 B2 | ' +
        'A1 A2 A1 A2 A1 A2 A1 A2 | C2 C3 C2 C3 C2 C3 C2 C3 | D2 D3 D2 D3 D2 D3 D2 D3 | B1 B2 B1 B2 B1 B2 B1 B2',
    },
    {
      lyd: 'stoej',
      styrke: 0.04,
      noder:
        'C5 . C6 . C5 . C6 . | C5 . C6 . C5 . C6 . | C5 . C6 . C5 . C6 . | C5 . C6 . C5 . C6 . | ' +
        'C5 . C6 . C5 . C6 . | C5 . C6 . C5 . C6 . | C5 . C6 . C5 . C6 . | C5 . C6 . C5 C5 C5 C5',
    },
  ],
};

/**
 * Introen: en spilledåse i a-mol, langsom og lidt sørgmodig, med regn i baggrunden.
 * De sidste takter løfter sig mod C-dur, så det slutter med en lille forventning.
 */
const intro: Sang = {
  bpm: 66,
  spor: [
    { lyd: 'trekant', styrke: 0.26, noder: heleTakter(['A2', 'F2', 'C3', 'E2', 'A2', 'F2', 'G2', 'C3']) },
    {
      lyd: 'firkant',
      styrke: 0.07,
      noder:
        'E6 - C6 - A5 - B5 C6 | A5 - - - . . . . | G5 - C6 - E6 - D6 C6 | B5 - - - G#5 - . . | ' +
        'E6 - C6 - A5 - B5 C6 | A5 - - - . . F5 - | G5 - B5 - D6 - F6 - | E6 - - - - - - -',
    },
    {
      lyd: 'trekant',
      styrke: 0.09,
      noder: arpeggio([
        ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['E3', 'G#3', 'B3'],
        ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4'],
      ]),
    },
    {
      lyd: 'stoej',
      styrke: 0.025,
      noder:
        'C6 . C6 C6 . C6 . C6 | . C6 . C6 C6 . C6 . | C6 . C6 . C6 C6 . C6 | . C6 C6 . C6 . C6 . | ' +
        'C6 . C6 C6 . C6 . C6 | . C6 . C6 C6 . C6 . | C6 . C6 . C6 C6 . C6 | . C6 C6 . C6 . C6 .',
    },
  ],
};

/** Et minde: Pennedals musik stopper, og der høres kun en enkelt, svag tone, der kommer og går. */
const minde: Sang = {
  bpm: 50,
  spor: [
    {
      lyd: 'trekant',
      styrke: 0.07,
      noder:
        'E5 - - - - - - - | . . . . . . . . | E5 - - - - - - - | . . . . . . . . | ' +
        'E5 - - - - - - - | . . . . . . . . | D5 - - - - - - - | . . . . . . . .',
    },
  ],
};

/**
 * Viskeskoven: hvid og stille. En spinkel melodi i D-dorisk, hvor nogle toner mangler,
 * som om de er blevet visket ud. Lange pauser og en blød bas.
 */
const viskeskov: Sang = {
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

/**
 * Rimbjerget (kapitel 4, 9. november 2026): koldt, blæsende og fjollet. G-dur i en vuggende rytme, en melodi,
 * der hopper som en trold, der prøver at lade være med at rime, og et ekko (samme motiv, svagere og senere).
 */
const rimbjerg: Sang = {
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

/** Forsiden og menuerne: Pennedals tema, roligere. */
const forside: Sang = { ...pennedal, bpm: 76 };

/** Sang pr. tema. Et tema uden sang får forsidens. */
/**
 * Kamp (9. november 2026): energisk, hurtig og ildevarslende, så man mærker, at der er fare på færde.
 * D-mol med en lille sekund (Eb) i sjette takt. Pumpende bas i ottendedele, et kort, truende motiv,
 * skarpe akkordstød på bagslagene og trommer af støj. Det skarpe og stødene er væk med "Mindre uhygge".
 */
const kamp: Sang = {
  bpm: 160,
  spor: [
    {
      lyd: 'trekant',
      styrke: 0.34,
      noder:
        'D2 D3 D2 D3 D2 D3 D2 D3 | D2 D3 D2 D3 D2 D3 D2 D3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | C2 C3 C2 C3 C2 C3 C2 C3 | ' +
        'D2 D3 D2 D3 D2 D3 D2 D3 | Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 Eb2 Eb3 | Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 | A1 A2 A1 A2 A1 A2 C#3 E3',
    },
    {
      lyd: 'firkant',
      styrke: 0.12,
      noder:
        'D5 . F5 . A5 - G5 F5 | E5 . F5 . D5 - - . | D5 . F5 . Bb5 - A5 G5 | A5 - - . G5 - E5 . | ' +
        'D5 . F5 . A5 - D6 C6 | Bb5 - A5 - G5 - Eb5 - | F5 . D5 . Bb4 - D5 F5 | E5 - C#5 - A4 - - .',
    },
    {
      lyd: 'savtak',
      styrke: 0.045,
      uhygge: true,
      noder:
        '. D4 . D4 . D4 . D4 | . F4 . F4 . F4 . F4 | . Bb3 . Bb3 . Bb3 . Bb3 | . C4 . C4 . E4 . E4 | ' +
        '. D4 . D4 . F4 . F4 | . Eb4 . Eb4 . G4 . G4 | . Bb3 . Bb3 . D4 . D4 | . A3 . A3 . C#4 . E4',
    },
    {
      lyd: 'stoej',
      styrke: 0.035,
      noder:
        'C8 . C8 C8 C8 . C8 C8 | C8 . C8 C8 C8 . C8 C8 | C8 . C8 C8 C8 . C8 C8 | C8 . C8 C8 C8 . C8 C8 | ' +
        'C8 . C8 C8 C8 . C8 C8 | C8 . C8 C8 C8 . C8 C8 | C8 . C8 C8 C8 . C8 C8 | C8 C8 C8 C8 C8 C8 C8 C8',
    },
    {
      lyd: 'stoej',
      styrke: 0.1,
      noder:
        '. . C4 . . . C4 . | . . C4 . . . C4 . | . . C4 . . . C4 . | . . C4 . . . C4 C4 | ' +
        '. . C4 . . . C4 . | . . C4 . . . C4 . | . . C4 . . . C4 . | . . C4 . C4 C4 C4 C4',
    },
  ],
};

/**
 * Fodnoternes kælder (kapitel 5): nysgerrig og lidt hemmelighedsfuld, E-mol. En lille melodi, der går på listesko
 * mellem reolerne, en rolig bas og en tynd klokke, som når man vender en gammel side. Klokken er væk med "Mindre uhygge".
 */
const arkiv: Sang = {
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
const blaeksoe: Sang = {
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
const hytte: Sang = {
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

/** Viskeskovens bane: samme sang som skoven, lidt hurtigere, fordi man løber og hopper. */
const viskesti: Sang = { ...viskeskov, bpm: viskeskov.bpm + 14 };

export const SANGE: Record<string, Sang> = { bibliotek, kaelder, pennedal, floden, fyrtaarn, eng, torv, smoeger, trykkeri, tage, forside, ufaerdige, intro, minde, viskeskov, kamp, viskesti, rimbjerg, arkiv, blaeksoe, hytte };
