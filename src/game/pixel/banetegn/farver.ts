/**
 * Farverne, som flere platformbaner deler: tage, mure, planker, blæk, vand og den viskede kant.
 * Delt ud af banetegn.ts 17. november 2026 (Henriks regel: ingen fil over 500 linjer, én opgave pr. fil).
 */

export const hx = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

export const TAG = { a: hx('#b0413e'), b: hx('#8e3428'), kant: hx('#7a2e1f'), lys: hx('#c9604c') };
export const MUR = { a: hx('#8a6a45'), b: hx('#7a5c3e'), fuge: hx('#5a3a28'), bjaelke: hx('#4a3426') };
export const PLANKE = { top: hx('#c9a46a'), a: hx('#a07a4a'), kant: hx('#5a3a28') };
export const BLAEK = { a: hx('#141629'), b: hx('#1d2140'), glans: hx('#4f6fa8') };
export const VAND = { a: hx('#14203f'), b: hx('#1a2a52'), krus: hx('#2c3f73') };

export const SKOVBUND = { top: hx('#e8e6ee'), graes: hx('#c9cfc4'), a: hx('#b8ad9c'), b: hx('#a99f8e'), sten: hx('#8f8a80') };
export const TOMRUM = { a: hx('#eceaf2'), b: hx('#e2e0ea'), streg: hx('#d2cfdc') };
export const VISKET = hx('#b9b4c8');
