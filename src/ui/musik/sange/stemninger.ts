/**
 * Sangene til stemninger, der ikke hører til ét sted: forsiden, introen, minderne, Den Ufærdige og kampene.
 * Delt ud af sange.ts 16. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */
import { arpeggio, heleTakter, type Sang } from '../noder';
import { pennedal } from './steder1';

/** Forsiden og menuerne: Pennedals tema, roligere. */
export const forside: Sang = { ...pennedal, bpm: 76 };

/**
 * Introen: en spilledåse i a-mol, langsom og lidt sørgmodig, med regn i baggrunden.
 * De sidste takter løfter sig mod C-dur, så det slutter med en lille forventning.
 */
export const intro: Sang = {
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
export const minde: Sang = {
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
 * Den Ufærdige: ingen melodi, kun lave toner, der gnider mod hinanden (halvtoner), og hvisken.
 * Den skal give et sug i maven, men aldrig larme. Med "Mindre uhygge" er hvisken og den skarpe tone væk.
 */
export const ufaerdige: Sang = {
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

/**
 * Kamp (9. november 2026): energisk, hurtig og ildevarslende, så man mærker, at der er fare på færde.
 * D-mol med en lille sekund (Eb) i sjette takt. Pumpende bas i ottendedele, et kort, truende motiv,
 * skarpe akkordstød på bagslagene og trommer af støj. Det skarpe og stødene er væk med "Mindre uhygge".
 */
export const kamp: Sang = {
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
