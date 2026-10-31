/** Pixelikoner til tingene i tasken, 12 x 12. Ingen bogstaver (se docs/grafik.md). */
import type { TingId } from '../../engine/taske';
import type { Tegnkort } from './sprites';

const K = '#2b2433'; // kontur

export const TING_IKONER: Record<TingId, Tegnkort> = {
  lanterne: {
    raekker: [
      '....kkkk....', '...k....k...', '..kkkkkkkk..', '..kLLLLLLk..', '..kLYYYYLk..', '..kLYyyYLk..',
      '..kLYyyYLk..', '..kLYYYYLk..', '..kLLLLLLk..', '..kkkkkkkk..', '...kbbbbk...', '....kkkk....',
    ],
    palet: { k: K, L: '#c9a46a', Y: '#ffd76a', y: '#fff6d0', b: '#6b4a2b' },
  },
  kappe: {
    raekker: [
      '....kkkk....', '...kssssk...', '..ksssssskk.', '..kssssssk..', '.kssssssssk.', '.ksssbssssk.',
      '.kssssssbsk.', 'kssssssssssk', 'ksbssssssssk', 'kssssssbsssk', 'kssssssssssk', '.kkkkkkkkkk.',
    ],
    palet: { k: K, s: '#3a3550', b: '#141629' },
  },
  logbog: {
    raekker: [
      '............', '.kkkkkkkkkk.', '.kbbbbbbbbk.', '.kbppppppbk.', '.kbpllllpbk.', '.kbppppppbk.',
      '.kbpllllpbk.', '.kbppppppbk.', '.kbbbbbbbbk.', '.kbbbbbbbrk.', '.kkkkkkkkrk.', '.........r..',
    ],
    palet: { k: K, b: '#7a3b2e', p: '#f4f1ea', l: '#b9b0a0', r: '#c94a4a' },
  },
  punktum: {
    raekker: [
      '............', '............', '....kkkk....', '...kppppk...', '..kpgpppppk.', '..kpppppppk.',
      '..kpppppppk.', '..kpppppppk.', '...kppppk...', '....kkkk....', '............', '............',
    ],
    palet: { k: K, p: '#1d2140', g: '#8fb3e8' },
  },
  krummer: {
    raekker: [
      '............', '..kk........', '.kggk...kk..', '.kgk...kggk.', '..k....kgk..', '.....kk.k...',
      '....kggk....', '....kgk..kk.', '.kk..k..kggk', 'kggk.....kk.', '.kk.........', '............',
    ],
    palet: { k: K, g: '#c9c2d6' },
  },
  rimsten: {
    raekker: [
      '............', '....kkkk....', '..kkssssk...', '.kssssssskk.', '.ksslssssk..', 'kssssssslsk.',
      'ksssslssssk.', 'kssssssssssk', '.ksssssssssk', '..kkssssskk.', '....kkkkk...', '............',
    ],
    palet: { k: K, s: '#8a8f9e', l: '#c9dcf2' },
  },
  haefte: {
    raekker: [
      '.kkkkkkkkk..', '.kgggggggkk.', '.kgggggggkfk', '.kggppppgkkk', '.kggggggggk.', '.kggppppggk.',
      '.kggggggggk.', '.kggppppggk.', '.kggggggggk.', '.kggggggggk.', '.kggggggggk.', '.kkkkkkkkkk.',
    ],
    palet: { k: K, g: '#4f8a4a', p: '#a8d49a', f: '#f4f1ea' },
  },
};
