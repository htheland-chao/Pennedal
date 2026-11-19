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
  palet: { K: '#222222', h: '#b9bfcf', S: '#eec1a0', g: '#c9dcf2', E: '#222222', m: '#c0503e', D: '#28467c', L: '#f4efe0' },
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
  palet: { K: '#222222', P: '#f4efe0', p: '#c9dcf2', E: '#222222', d: '#8a8a8a' },
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
  palet: { K: '#8a7656', W: '#f4efe0', d: '#d9b56f' },
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
  palet: { K: '#222222', G: '#4f9467', g: '#356c4d', s: '#3a3560', E: '#f3ead2' },
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
  palet: { K: '#2a2f48', E: '#f4efe0' },
};
