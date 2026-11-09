/**
 * Fodnoternes kælder (kapitel 5, 9. november 2026): Fru Fodnote, Den Tvivlende Sætning, fodnotetal, det grønne hæfte
 * og Den Ufærdige på kortet. Tegnet til Pennedal. Ingen bogstaver eller tal: fodnotetallene er små, hvide lapper.
 */
import type { Tegnkort } from './sprites';

/** Fru Fodnote: en meget lille dame med knold i håret, store briller og en mørk kjole. */
export const FRU_FODNOTE: Tegnkort = {
  raekker: [
    '...KKK....',
    '..KhhhK...',
    '..KhhhK...',
    '.KKKKKKK..',
    '.KSgSSgSK.',
    '.KgEgEgSK.',
    '.KSSSSSSK.',
    '..KSmSSK..',
    '..KDDDDK..',
    '.KDDLDDDK.',
    '.KDDDDDDK.',
    '..KDDDDK..',
    '..KK..KK..',
  ],
  palet: { K: '#2a2433', h: '#c9c2d6', S: '#e8c4a8', g: '#bfe0f0', E: '#2a2433', m: '#a85a5a', D: '#3e5a7a', L: '#f4efe0' },
};

/** Den Tvivlende Sætning: et ark papir, der er to halvdele med hver sit ansigt. */
export const TVIVL: Tegnkort = {
  raekker: [
    '..KKKKKKKKKK..',
    '.KPPPPPPPPPPK.',
    'KPPPPPPPPPPPPK',
    'KPEPPPPKpppppK',
    'KPPPPPPKpEpppK',
    'KPPddPPKppddpK',
    'KPPPPPPKpppppK',
    'KPKKKPPKpKKKpK',
    'KPPPPPPKpppppK',
    'KPPddPPKppddpK',
    'KPPPPPPKpppppK',
    '.KPPPPPKppppK.',
    '..KKPPPKppKK..',
    '....KKKKKK....',
  ],
  palet: { K: '#2a2433', P: '#f4efe0', p: '#d6d0e4', E: '#2a2433', d: '#9a92a8' },
};

/** Et fodnotetal, der er faldet af: en lille, hvid papirlap, der lyser svagt. */
export const FODNOTETAL: Tegnkort = {
  raekker: [
    '..KKKK..',
    '.KWWWWK.',
    'KWWddWWK',
    'KWWWWWWK',
    '.KWdWWK.',
    '..KKKK..',
  ],
  palet: { K: '#8a8070', W: '#fffbe8', d: '#c9a46a' },
};

/** Det grønne hæfte på gulvet med skyggen og de store øjne på forsiden. */
export const HAEFTE_KORT: Tegnkort = {
  raekker: [
    'KKKKKKKKKKKK',
    'KGGGGGGGGGgK',
    'KGGGGGGGGGgK',
    'KGGGsssGGGgK',
    'KGGsEsEsGGgK',
    'KGGsssssGGgK',
    'KGGGsssGGGgK',
    'KGGGGGGGGGgK',
    'KKKKKKKKKKKK',
  ],
  palet: { K: '#1f2a20', G: '#6f8f62', g: '#4f6f44', s: '#3a3560', E: '#f6ecd6' },
};

/** Den Ufærdige: en høj skikkelse af blyantstreger, der aldrig blev tegnet færdige. To blege øjne. */
export const UFAERDIGE_KORT: Tegnkort = {
  raekker: [
    '.....KKKK.....',
    '....K....K....',
    '...K..KK..K...',
    '...K.E..E.K...',
    '...K......K...',
    '....K.KK.K....',
    '...KKK..KKK...',
    '..K..K..K..K..',
    '.K...K..K...K.',
    '.K..K....K..K.',
    '..K.K....K.K..',
    '....K....K....',
    '....K.KK.K....',
    '...K..K.K..K..',
    '...K..K..K.K..',
    '..K...K...K...',
    '..K..K.....K..',
    '.K...K......K.',
    'K....K.......K',
    '..K.K.K.K.K...',
  ],
  palet: { K: '#3a3a48', E: '#e8e4f0' },
};
