/**
 * Farverne, som flere platformbaner deler: tage, mure, planker, blæk, vand og den viskede kant.
 * Delt ud af banetegn.ts 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */

export const hx = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

export const TAG = { a: hx('#a83b33'), b: hx('#8e3428'), kant: hx('#7a2e1f'), lys: hx('#c0503e') };
export const MUR = { a: hx('#8a5a3a'), b: hx('#7a4e33'), fuge: hx('#6b3f27'), bjaelke: hx('#4a3426') };
export const PLANKE = { top: hx('#c4ab7c'), a: hx('#a96e48'), kant: hx('#6b3f27') };
export const BLAEK = { a: hx('#1b1b24'), b: hx('#2a2f48'), glans: hx('#4f6fa8') };
export const VAND = { a: hx('#1a1e36'), b: hx('#2a2f48'), krus: hx('#28467c') };

export const SKOVBUND = { top: hx('#f4efe0'), graes: hx('#d9d2bd'), a: hx('#c4ab7c'), b: hx('#a99068'), sten: hx('#8a8a8a') };
export const TOMRUM = { a: hx('#f4efe0'), b: hx('#f3ead2'), streg: hx('#d9d2bd') };
export const VISKET = hx('#b9bfcf');
