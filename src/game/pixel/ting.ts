/** Pixelikoner til tingene i tasken, 12 x 12. Ingen bogstaver (se docs/grafik.md). */
import type { TingId } from '../../engine/taske';
import type { Tegnkort } from './sprites';

const K = '#222222'; // kontur

export const TING_IKONER: Record<TingId, Tegnkort> = {
  lanterne: {
    raekker: [
      '....kkkk....', '...k....k...', '..kkkkkkkk..', '..kLLLLLLk..', '..kLYYYYLk..', '..kLYyyYLk..',
      '..kLYyyYLk..', '..kLYYYYLk..', '..kLLLLLLk..', '..kkkkkkkk..', '...kbbbbk...', '....kkkk....',
    ],
    palet: { k: K, L: '#d9b56f', Y: '#f0c45a', y: '#f4efe0', b: '#6b4a2b' },
  },
  kappe: {
    raekker: [
      '....kkkk....', '...kssssk...', '..ksssssskk.', '..kssssssk..', '.kssssssssk.', '.ksssbssssk.',
      '.kssssssbsk.', 'kssssssssssk', 'ksbssssssssk', 'kssssssbsssk', 'kssssssssssk', '.kkkkkkkkkk.',
    ],
    palet: { k: K, s: '#3a3560', b: '#1b1b24' },
  },
  logbog: {
    raekker: [
      '............', '.kkkkkkkkkk.', '.kbbbbbbbbk.', '.kbppppppbk.', '.kbpllllpbk.', '.kbppppppbk.',
      '.kbpllllpbk.', '.kbppppppbk.', '.kbbbbbbbbk.', '.kbbbbbbbrk.', '.kkkkkkkkrk.', '.........r..',
    ],
    palet: { k: K, b: '#7a2e1f', p: '#f4efe0', l: '#c4ab7c', r: '#c0503e' },
  },
  punktum: {
    raekker: [
      '............', '............', '....kkkk....', '...kppppk...', '..kpgpppppk.', '..kpppppppk.',
      '..kpppppppk.', '..kpppppppk.', '...kppppk...', '....kkkk....', '............', '............',
    ],
    palet: { k: K, p: '#1a1e36', g: '#698fc1' },
  },
  krummer: {
    raekker: [
      '............', '..kk........', '.kggk...kk..', '.kgk...kggk.', '..k....kgk..', '.....kk.k...',
      '....kggk....', '....kgk..kk.', '.kk..k..kggk', 'kggk.....kk.', '.kk.........', '............',
    ],
    palet: { k: K, g: '#b9bfcf' },
  },
  rimsten: {
    raekker: [
      '............', '....kkkk....', '..kkssssk...', '.kssssssskk.', '.ksslssssk..', 'kssssssslsk.',
      'ksssslssssk.', 'kssssssssssk', '.ksssssssssk', '..kkssssskk.', '....kkkkk...', '............',
    ],
    palet: { k: K, s: '#8a8a8a', l: '#c9dcf2' },
  },
  haefte: {
    raekker: [
      '.kkkkkkkkk..', '.kgggggggkk.', '.kgggggggkfk', '.kggppppgkkk', '.kggggggggk.', '.kggppppggk.',
      '.kggggggggk.', '.kggppppggk.', '.kggggggggk.', '.kggggggggk.', '.kggggggggk.', '.kkkkkkkkkk.',
    ],
    palet: { k: K, g: '#2e8b57', p: '#5aa572', f: '#f4efe0' },
  },
};
