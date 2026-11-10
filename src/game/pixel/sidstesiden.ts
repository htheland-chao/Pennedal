/**
 * Den sidste side (kapitel 8, 10. november 2026): Halvsætningen. Tegnet til Pennedal. Ingen bogstaver:
 * sætningen er kun streger, man ikke kan læse, og den er revet over midt i.
 */
import type { Tegnkort } from './sprites';

/** Halvsætningen: en strimmel papir med streger, der er revet over i højre side. To stille øjne og små ben. */
export const HALVSAETNING: Tegnkort = {
  raekker: [
    'KKKKKKKKKKKK.K..',
    'KPPPPPPPPPPPKPK.',
    'KPssPsssPssPPPPK',
    'KPPPPPPPPPPPPPK.',
    'KPWWPPPWWPPPPPPK',
    'KPWEPPPWEPPPPK..',
    'KPPPPPPPPPPPPPPK',
    'KPsssPssPsPPPK..',
    'KPPPPPPPPPPPPPPK',
    'KKKKKKKKKKKKK.K.',
    '..K..K...K..K...',
    '.KK.KK..KK.KK...',
  ],
  palet: { K: '#2a2433', P: '#f4efe0', s: '#8a8298', W: '#ffffff', E: '#2a2433' },
};

/** Skyggen, når den har fået sin slutning: lille og rund med store, runde øjne og et lille smil. Den er ikke uhyggelig mere. */
export const LILLE_SKYGGE: Tegnkort = {
  raekker: [
    '....KKKKKK....',
    '..KKSSSSSSKK..',
    '.KSSSSSSSSSSK.',
    '.KSWWWSSWWWSK.',
    'KSSWWESSWWESSK',
    'KSSWEESSWEESSK',
    'KSSSSSSSSSSSSK',
    'KSSSSmSSmSSSSK',
    'KSSSSSmmSSSSSK',
    '.KSSSSSSSSSSK.',
    '.KSsSSSSSSsSK.',
    '..KKSSSSSSKK..',
    '...KKK..KKK...',
  ],
  palet: { K: '#1d1a2a', S: '#3a3560', s: '#55507a', W: '#ffffff', E: '#1d1a2a', m: '#c9c2d6' },
};
