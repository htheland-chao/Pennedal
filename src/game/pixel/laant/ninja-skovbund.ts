/**
 * Lånt grafik: Ninja Adventure af Pixel-boy og AAA (CC0), https://pixel-boy.itch.io/ninja-adventure-asset-pack
 * Skåret ud af TilesetNature.png og TilesetFloor.png og farvet om til masterpaletten (src/game/pixel/palet.ts).
 * Pakkens gulgrønne er lagt over på Pennedals egne grønne efter lyshed. Lavet 20. november 2026. Se LICENSER.md.
 */
import type { Tegnkort } from '../sprites';

/** TilesetNature.png x 48, y 160. */
const tue1: Tegnkort = {
  raekker: [
    '...aa.aa...aa...',
    '..aba.aca.aba.aa',
    '.acbaaccaacbaaca',
    '.acbbacccbccacca',
    'aaabbccbbccbccca',
    'accacccbbcbbccca',
    'acccbbcbbcbbbca.',
    '.abcbbccbbbbbcba',
    '.cbbbbbbbbbbbbbc',
    '.cbbbbbbbbbbbbbc',
    '.bbbbbbbbbbbbbb.',
    '..bbbbbbbbbbbb..',
    '....bbbbbbbb....',
  ],
  palet: { a: '#24503a', b: '#3d7a57', c: '#2f6448' },
};
/** TilesetNature.png x 80, y 160. */
const tue2: Tegnkort = {
  raekker: [
    '......aa..aa....',
    '....aabaaaba....',
    '...abbbabbbaaaa.',
    '..aabbabbbaabba.',
    '.aaabccbbabbba..',
    '.abaccbcbbbbba..',
    '.abbcbbcbbbbcaa.',
    'aaaccbbcbccccca.',
    'abbcbcbbccbbbcaa',
    'abbcbcbbcbbbaaca',
    '.abcbbcccbbbccca',
    '..cccbccbbbccc..',
    '....cbbcbcc.....',
  ],
  palet: { a: '#24503a', b: '#3d7a57', c: '#2f6448' },
};
/** TilesetNature.png x 112, y 160. */
const tue3: Tegnkort = {
  raekker: [
    '......aa........',
    '.....aba...aa...',
    'aa..abbaaa.aba..',
    'abaabbcaba.aba..',
    'abbabbcbba.abca.',
    '.abbacbbbaabbca.',
    '.abbbabbbacbcba.',
    'aacbbbcbbccccbca',
    'abbcbbbccbbcbbca',
    'aabbcbccbbccbbca',
    '.aabcbcbbccbbcba',
    '.bcbccbbccbbbcba',
    '..bbccbbcbbbcbc.',
    '....ccbcccccc...',
  ],
  palet: { a: '#24503a', b: '#3d7a57', c: '#2f6448' },
};
/** TilesetNature.png x 32, y 160. */
const busk: Tegnkort = {
  raekker: [
    '......aaaaa.....',
    '.....abbbbba....',
    '....abbbbccba...',
    '...abbbbbbbca...',
    '..aaabbcccbbba..',
    '.abbbbbbbccbbba.',
    'abbbbbbccbcbbbba',
    'abbbbcccccccbbba',
    'abcbccccccbccbba',
    'abcbcccccccbccba',
    '.abccccccccbccb.',
    '...accccccbc....',
  ],
  palet: { a: '#24503a', b: '#3d7a57', c: '#2f6448' },
};
/** TilesetNature.png x 32, y 176. */
const kloever: Tegnkort = {
  raekker: [
    '........aaaa...',
    '.......abccca..',
    '..aaaaabccccca.',
    '.accccdaccccca.',
    'acccccbddbbbaa.',
    'acccccbbcccccba',
    'accccbbbcccccba',
    '.abbbaadcccccba',
    '..aaa.adabbbba.',
    '......adaaaaa..',
    '.....adda......',
  ],
  palet: { a: '#24503a', b: '#2f6448', c: '#3d7a57', d: '#24503a' },
};
/** TilesetNature.png x 48, y 176. */
const roedBlomst: Tegnkort = {
  raekker: [
    '........aaaa..',
    '..aaa..abbbba.',
    '.abbbaacccbbba',
    'abbbbbacccbbba',
    'abbbbbacccbbba',
    'abbbbbbacbbbba',
    'acbbbbbbbbbbca',
    '.accbbbbbbbca.',
    '..aaccccccca..',
    '....aaddaaa...',
    '...aaaadda....',
    '...adddeea....',
    '....aaaeea....',
    '.....adda.....',
  ],
  palet: { a: '#1b1b24', b: '#e67e22', c: '#c0503e', d: '#24503a', e: '#356c4d' },
};
/** TilesetNature.png x 96, y 176. */
const hvidBlomst: Tegnkort = {
  raekker: [
    '...aaaaaaaaaa...',
    '..abbbbccbbbba..',
    '.abbbbddddbbbba.',
    '.abbbdddddebbba.',
    '.affgdddddegffa.',
    'afffbgeeeegbfffa',
    'afcbbbghhgbbbcfa',
    'aabbbbbggbbbbbaa',
    'aabbbbbffbbbbbaa',
    'affbbbbffbbbbffa',
    'affccicffciccffa',
    'accaaacffcaaacca',
    'aaaa..acca..aaaa',
    '.......aa.......',
  ],
  palet: { a: '#1b1b24', b: '#f4efe0', c: '#2f6448', d: '#5aa572', e: '#d9b56f', f: '#3d7a57', g: '#c4ab7c', h: '#7a7468', i: '#24503a' },
};
/** TilesetNature.png x 176, y 192. */
const smaasten: Tegnkort = {
  raekker: [
    '.aaaaa........',
    'aaaaaaaa......',
    'aabaaaaaa.....',
    'aaaaaaaaa.....',
    'aaaaaaaaa..aaa',
    '.aaaaaaaa.aaaa',
    '...aaaaaa.aaaa',
    '....aaaa..aaa.',
    '..aa..........',
    '.aaaaaaaa.....',
    '.abaaaaaa.....',
    '.aaaaaaaa.....',
    '..aaaaaa......',
  ],
  palet: { a: '#7a7468', b: '#a7aab8' },
};
/** TilesetNature.png x 64, y 208. */
const brunSten: Tegnkort = {
  raekker: [
    '....aaaaaaaa....',
    '..aabbbbbbbbaa..',
    '.acbbbbbbbbbbca.',
    'acbbbbbbbbbbbbca',
    'acbbbbbbbbbbbbca',
    'acbbbbbbbbbbbbca',
    'acbbbbbbbbbbbbca',
    'accbbbbbbbbbbcca',
    'abccbbbbbbbbccca',
    'acccccccccccccca',
    'acccccccccccccca',
    'acccccccccccccca',
    '.acccccccccccca.',
    '..aaccccccccaa..',
  ],
  palet: { a: '#1b1b24', b: '#d9b56f', c: '#a96e48' },
};
/** TilesetNature.png x 64, y 128. */
const stub: Tegnkort = {
  raekker: [
    '......aaaa......',
    '....aabbbbaa....',
    '...abbccccbba...',
    '..abbbbbbbcbba..',
    '..abbbccbbcbba..',
    '..abbcbbbbcbba..',
    '..abbbccccbbba..',
    '..adbbbbbbbbda..',
    '..addbbbbbbdda..',
    '..aedddddddeda..',
    'aaeedddddeeeeeaa',
    'eeeedddddeeeeeee',
    '...dddddeeeeee..',
    '..dddeee...ee...',
    '.ddee.......e...',
  ],
  palet: { a: '#1b1b24', b: '#e0c995', c: '#d9b56f', d: '#8a5a3a', e: '#a96e48' },
};
/** TilesetFloor.png x 32, y 176. */
const straa1: Tegnkort = {
  raekker: [
    '...........aa..',
    '.......aa.a..a.',
    '......a..a..aa.',
    '.......a.a.aaaa',
    '.........a.aaa.',
    '...............',
    '.aa..aa........',
    'a..aa..a.......',
    '.a.a..a........',
    '...a.aaa.......',
    '.....aa........',
  ],
  palet: { a: '#2a5a40' },
};
/** TilesetFloor.png x 48, y 176. */
const straa2: Tegnkort = {
  raekker: [
    '.......a..',
    '.......a.a',
    '.........a',
    '..........',
    '..........',
    '..........',
    '..a.......',
    'a.a.a.....',
    'a...a.....',
  ],
  palet: { a: '#2a5a40' },
};
/** TilesetFloor.png x 16, y 192. */
const straa3: Tegnkort = {
  raekker: [
    '.aaa...aaaa...',
    'a...a.a....a..',
    '.a...a....a...',
    '..a.a....aa...',
    '..a.a...aaaa..',
    '.a..a...aaaaa.',
    '....a....a...a',
    '.....a..a...a.',
    '........a...a.',
    '........a.....',
    '.........a....',
  ],
  palet: { a: '#2a5a40' },
};
/** TilesetFloor.png x 32, y 192. */
const straa4: Tegnkort = {
  raekker: [
    '.......aaa..',
    '......a...a.',
    '.....a...aaa',
    '........aaa.',
    '............',
    '.aaaa.......',
    'a....a......',
    '.a....a.....',
    '.aa...a.....',
    'aaa.........',
    '..aa........',
  ],
  palet: { a: '#2a5a40' },
};
/** TilesetFloor.png x 64, y 192. */
const straa5: Tegnkort = {
  raekker: [
    '.......a..',
    '.......a.a',
    '.........a',
    '..........',
    '..........',
    '..........',
    '..a.......',
    'a.a.a.....',
    'a...a.....',
  ],
  palet: { a: '#2a5a40' },
};

/** Småting på jorden i Pennedal-skoven. */
export const SKOVBUND_TING: Tegnkort[] = [tue1, tue2, tue3, busk, kloever, roedBlomst, hvidBlomst, smaasten, brunSten, stub];
/** Strå-mærker i græsset (kun den mørke farve, græsset under bevares). */
export const STRAA_MAERKER: Tegnkort[] = [straa1, straa2, straa3, straa4, straa5];
