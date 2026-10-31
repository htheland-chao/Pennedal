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

/** Forsiden og menuerne: Pennedals tema, roligere. */
const forside: Sang = { ...pennedal, bpm: 76 };

/** Sang pr. tema. Et tema uden sang får forsidens. */
export const SANGE: Record<string, Sang> = { bibliotek, kaelder, pennedal, floden, fyrtaarn, forside };
