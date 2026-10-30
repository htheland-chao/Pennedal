import { avatarDele } from '../content';
import type { Avatar } from '../engine/gem';

/**
 * Tegner avataren som SVG. Den samme tegning bruges i avatar-designeren og i spilverdenen.
 * Grafikken er en pladsholder, indtil der er rigtig grafik fra Blender.
 */
const STREG = '#2b2433';
const BUKSER = '#2d3047';
const SKO = '#1b1b1b';

function farve(del: string, i: number): string {
  return avatarDele[del]?.farver?.[i] ?? '#888888';
}

function moerkere(hex: string, faktor = 0.8): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * faktor);
  const g = Math.round(((n >> 8) & 255) * faktor);
  const b = Math.round((n & 255) * faktor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function avatarSvg(a: Avatar): string {
  const hud = farve('hud', a.hud);
  const haar = farve('haarfarve', a.haarfarve);
  const hovedFarve = farve('hovedfarve', a.hovedfarve);
  const toej = farve('toejfarve', a.toejfarve);
  const toejMoerk = moerkere(toej);
  const bredde = [34, 42, 50][a.krop];
  const venstre = 60 - bredde / 2;
  const hoejre = 60 + bredde / 2;
  const toerklaede = a.hoved === 1;
  const s = `stroke="${STREG}" stroke-width="1.5"`;
  const dele: string[] = [];

  // Kappe bag kroppen.
  if (a.toej === 3) {
    dele.push(`<path d="M${venstre - 4} 84 L${venstre - 16} 188 L${hoejre + 16} 188 L${hoejre + 4} 84 Z" fill="${toejMoerk}" ${s}/>`);
  }
  // Hætte bag hovedet.
  if (a.toej === 1 && !toerklaede) {
    dele.push(`<circle cx="60" cy="58" r="29" fill="${toejMoerk}" ${s}/>`);
  }
  // Hår bag hovedet.
  if (!toerklaede) {
    if (a.haar === 1) dele.push(`<rect x="33" y="36" width="54" height="66" rx="20" fill="${haar}" ${s}/>`);
    if (a.haar === 4) dele.push(`<circle cx="60" cy="46" r="36" fill="${haar}" ${s}/>`);
    if (a.haar === 5) dele.push(`<ellipse cx="88" cy="62" rx="9" ry="22" fill="${haar}" ${s}/>`);
    if (a.haar === 6) dele.push(`<circle cx="60" cy="24" r="11" fill="${haar}" ${s}/>`);
  }
  // Tørklæde bagved og ned over skuldrene.
  if (toerklaede) {
    dele.push(`<path d="M30 56 Q30 22 60 22 Q90 22 90 56 L96 104 L24 104 Z" fill="${hovedFarve}" ${s}/>`);
  }

  // Ben eller kjole.
  if (a.toej === 2) {
    dele.push(`<rect x="${60 - 13}" y="150" width="10" height="36" fill="${hud}" ${s}/>`);
    dele.push(`<rect x="${60 + 3}" y="150" width="10" height="36" fill="${hud}" ${s}/>`);
  } else {
    dele.push(`<rect x="${60 - 15}" y="136" width="13" height="50" rx="3" fill="${BUKSER}" ${s}/>`);
    dele.push(`<rect x="${60 + 2}" y="136" width="13" height="50" rx="3" fill="${BUKSER}" ${s}/>`);
  }
  dele.push(`<ellipse cx="${60 - 9}" cy="189" rx="10" ry="5" fill="${SKO}"/>`);
  dele.push(`<ellipse cx="${60 + 9}" cy="189" rx="10" ry="5" fill="${SKO}"/>`);

  // Arme.
  const lange = a.toej === 1 || a.toej === 3;
  dele.push(`<rect x="${venstre - 11}" y="86" width="11" height="48" rx="5" fill="${lange ? toej : hud}" ${s}/>`);
  dele.push(`<rect x="${hoejre}" y="86" width="11" height="48" rx="5" fill="${lange ? toej : hud}" ${s}/>`);
  if (!lange) {
    dele.push(`<rect x="${venstre - 11}" y="86" width="11" height="16" rx="4" fill="${toej}" ${s}/>`);
    dele.push(`<rect x="${hoejre}" y="86" width="11" height="16" rx="4" fill="${toej}" ${s}/>`);
  }
  dele.push(`<circle cx="${venstre - 5.5}" cy="137" r="6" fill="${hud}" ${s}/>`);
  dele.push(`<circle cx="${hoejre + 5.5}" cy="137" r="6" fill="${hud}" ${s}/>`);

  // Krop.
  if (a.toej === 2) {
    dele.push(`<path d="M${venstre} 84 L${hoejre} 84 L${hoejre + 12} 152 L${venstre - 12} 152 Z" fill="${toej}" ${s}/>`);
  } else {
    dele.push(`<rect x="${venstre}" y="82" width="${bredde}" height="58" rx="8" fill="${toej}" ${s}/>`);
  }
  if (a.toej === 1) dele.push(`<rect x="${60 - 12}" y="118" width="24" height="12" rx="3" fill="${toejMoerk}" ${s}/>`);
  if (a.toej === 3) dele.push(`<circle cx="60" cy="88" r="3.5" fill="#e5c03a" ${s}/>`);

  // Hals og hoved.
  dele.push(`<rect x="54" y="70" width="12" height="14" fill="${hud}" ${s}/>`);
  dele.push(`<circle cx="60" cy="52" r="${toerklaede ? 21 : 24}" fill="${hud}" ${s}/>`);

  // Hår foran.
  if (!toerklaede && a.hoved !== 2 && a.hoved !== 3) {
    if (a.haar === 2) {
      for (const [x, y] of [[40, 38], [48, 31], [57, 28], [66, 29], [75, 33], [82, 41]]) {
        dele.push(`<circle cx="${x}" cy="${y}" r="8" fill="${haar}" ${s}/>`);
      }
    } else if (a.haar === 7) {
      dele.push(`<path d="M37 46 Q40 27 60 27 Q80 27 83 46 Q60 38 37 46 Z" fill="${haar}" opacity="0.85"/>`);
    } else {
      dele.push(`<path d="M35 52 Q34 26 60 26 Q86 26 85 52 Q78 38 60 39 Q44 39 35 52 Z" fill="${haar}" ${s}/>`);
    }
  }
  if (!toerklaede && a.haar === 3) {
    dele.push(`<path d="M38 56 Q34 80 40 98" fill="none" stroke="${haar}" stroke-width="7" stroke-linecap="round"/>`);
    dele.push(`<path d="M82 56 Q86 80 80 98" fill="none" stroke="${haar}" stroke-width="7" stroke-linecap="round"/>`);
  }

  // Hovedbeklædning foran.
  if (toerklaede) {
    dele.push(`<path d="M36 46 Q38 28 60 28 Q82 28 84 46 Q72 34 60 34 Q48 34 36 46 Z" fill="${hovedFarve}" ${s}/>`);
  }
  if (a.hoved === 2) {
    dele.push(`<path d="M34 46 Q34 18 60 18 Q86 18 86 46 Z" fill="${hovedFarve}" ${s}/>`);
    dele.push(`<rect x="33" y="40" width="54" height="9" rx="4" fill="${moerkere(hovedFarve)}" ${s}/>`);
  }
  if (a.hoved === 3) {
    dele.push(`<path d="M36 44 Q36 22 60 22 Q84 22 84 44 Z" fill="${hovedFarve}" ${s}/>`);
    dele.push(`<path d="M60 42 L100 42 Q98 48 84 48 L60 48 Z" fill="${moerkere(hovedFarve)}" ${s}/>`);
  }

  // Øjne.
  const oejne: string[] = [];
  for (const x of [51, 69]) {
    if (a.oejne === 0) oejne.push(`<circle cx="${x}" cy="52" r="3" fill="${STREG}"/>`);
    if (a.oejne === 1) oejne.push(`<ellipse cx="${x}" cy="52" rx="4" ry="1.6" fill="${STREG}"/>`);
    if (a.oejne === 2) oejne.push(`<path d="M${x - 4} 54 Q${x} 48 ${x + 4} 54" fill="none" stroke="${STREG}" stroke-width="2" stroke-linecap="round"/>`);
    if (a.oejne === 3) oejne.push(`<circle cx="${x}" cy="52" r="5" fill="#ffffff" ${s}/><circle cx="${x}" cy="53" r="2.5" fill="${STREG}"/>`);
  }
  dele.push(...oejne);

  // Mund.
  if (a.mund === 0) dele.push(`<path d="M53 62 Q60 68 67 62" fill="none" stroke="${STREG}" stroke-width="2" stroke-linecap="round"/>`);
  if (a.mund === 1) dele.push(`<path d="M52 61 Q60 72 68 61 Z" fill="#8a2f3b" ${s}/>`);
  if (a.mund === 2) dele.push(`<path d="M54 64 L66 64" stroke="${STREG}" stroke-width="2" stroke-linecap="round"/>`);
  if (a.mund === 3) dele.push(`<circle cx="60" cy="64" r="3.5" fill="#8a2f3b" ${s}/>`);

  // Tilbehør.
  if (a.tilbehoer === 1) {
    dele.push(`<circle cx="51" cy="52" r="7" fill="none" stroke="${STREG}" stroke-width="2"/>`);
    dele.push(`<circle cx="69" cy="52" r="7" fill="none" stroke="${STREG}" stroke-width="2"/>`);
    dele.push(`<path d="M58 52 L62 52" stroke="${STREG}" stroke-width="2"/>`);
  }
  if (a.tilbehoer === 2) {
    dele.push(`<rect x="46" y="74" width="28" height="10" rx="4" fill="${hovedFarve}" ${s}/>`);
    dele.push(`<rect x="64" y="80" width="9" height="22" rx="3" fill="${hovedFarve}" ${s}/>`);
  }
  if (a.tilbehoer === 3) {
    const x = hoejre + 6;
    dele.push(`<circle cx="${x}" cy="152" r="13" fill="#ffd76a" opacity="0.45"/>`);
    dele.push(`<path d="M${x} 138 L${x} 143" stroke="${STREG}" stroke-width="1.5"/>`);
    dele.push(`<rect x="${x - 6}" y="143" width="12" height="16" rx="3" fill="#ffe9a8" ${s}/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200" width="120" height="200">${dele.join('')}</svg>`;
}

export function avatarDataUri(a: Avatar): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarSvg(a))}`;
}
