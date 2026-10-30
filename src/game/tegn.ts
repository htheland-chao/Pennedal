import type Phaser from 'phaser';
import type { StedObjekt } from '../content';

/** Pladsholdergrafik tegnet med kode. Skal erstattes af rigtig grafik senere. */
export const BREDDE = 960;
export const HOEJDE = 540;
export const GULV_TOP = 270;

function farveTal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function tegnBaggrund(g: Phaser.GameObjects.Graphics, tema: string, mindreUhygge: boolean) {
  switch (tema) {
    case 'bibliotek': {
      g.fillStyle(0xe9d8b4).fillRect(0, 0, BREDDE, GULV_TOP);
      g.fillStyle(0xb98b5a).fillRect(0, GULV_TOP, BREDDE, HOEJDE - GULV_TOP);
      for (let x = 0; x < BREDDE; x += 60) g.lineStyle(1, 0x9c7346, 0.6).lineBetween(x, GULV_TOP, x - 40, HOEJDE);
      // Reoler med bøger.
      const bogfarver = [0xb0413e, 0x2e8b57, 0x2c6fbb, 0xe5c03a, 0x7b4bb3, 0xe67e22];
      for (const rx of [40, 600]) {
        g.fillStyle(0x6b4a2b).fillRect(rx, 40, 260, 220);
        for (let hylde = 0; hylde < 4; hylde++) {
          const y = 52 + hylde * 52;
          for (let i = 0; i < 18; i++) {
            const h = 30 + ((i * 7 + hylde * 3) % 12);
            g.fillStyle(bogfarver[(i + hylde) % bogfarver.length]).fillRect(rx + 10 + i * 13.5, y + 40 - h, 11, h);
          }
          g.fillStyle(0x4a321c).fillRect(rx, y + 40, 260, 6);
        }
      }
      // Vindue.
      g.fillStyle(0xbfe3f2).fillRect(360, 50, 180, 130);
      g.lineStyle(6, 0xffffff).strokeRect(360, 50, 180, 130).lineBetween(450, 50, 450, 180);
      // Disk.
      g.fillStyle(0x8a5a32).fillRect(450, 270, 160, 50);
      break;
    }
    case 'kaelder': {
      g.fillStyle(0x2e2a35).fillRect(0, 0, BREDDE, GULV_TOP);
      for (let y = 10; y < GULV_TOP; y += 34)
        for (let x = (y / 34) % 2 ? 0 : 40; x < BREDDE; x += 80)
          g.lineStyle(2, 0x26222c).strokeRect(x, y, 80, 34);
      g.fillStyle(0x3d3a40).fillRect(0, GULV_TOP, BREDDE, HOEJDE - GULV_TOP);
      g.lineStyle(10, 0x55505c).lineBetween(0, 60, BREDDE, 60);
      g.fillStyle(0xffe9a8, 0.9).fillCircle(470, 90, 10);
      g.fillStyle(0xffe9a8, 0.12).fillCircle(470, 150, 140);
      g.fillStyle(0x000000, mindreUhygge ? 0.1 : 0.3).fillRect(0, 0, BREDDE, HOEJDE);
      break;
    }
    case 'pennedal':
    case 'floden':
    case 'fyrtaarn': {
      g.fillGradientStyle(0x1f2a44, 0x1f2a44, 0x4b5f8a, 0x4b5f8a, 1).fillRect(0, 0, BREDDE, GULV_TOP);
      const maaner: [number, number, number, number][] = [
        [160, 70, 26, 0xf4f1ea],
        [300, 50, 16, 0xffd76a],
        [820, 80, 22, 0xb9d7ff],
      ];
      for (const [x, y, r, c] of maaner) {
        g.fillStyle(c, 0.25).fillCircle(x, y, r * 1.8);
        g.fillStyle(c).fillCircle(x, y, r);
      }
      for (let i = 0; i < 40; i++) g.fillStyle(0xffffff, 0.7).fillCircle((i * 197) % BREDDE, (i * 53) % 200, 1.2);
      g.fillStyle(0xd9cdb0).fillRect(0, GULV_TOP, BREDDE, HOEJDE - GULV_TOP);
      if (tema === 'pennedal') {
        // Papirtræer.
        for (const [x, h] of [[60, 160], [240, 200], [420, 150], [760, 190], [920, 170]] as const) {
          g.fillStyle(0x6b4a2b).fillRect(x - 6, GULV_TOP - 10, 12, 30);
          g.fillStyle(0xf4f1ea).fillTriangle(x - 50, GULV_TOP, x + 50, GULV_TOP, x, GULV_TOP - h);
          for (let k = 1; k < 5; k++)
            g.lineStyle(1, 0x9a9a9a).lineBetween(x - 40 + k * 6, GULV_TOP - k * 20, x + 40 - k * 6, GULV_TOP - k * 20);
        }
        g.fillStyle(0xc2a878).fillRect(0, 390, BREDDE, 60);
      }
      if (tema === 'floden') {
        g.fillStyle(0x3a7bd5).fillRect(410, GULV_TOP, 220, HOEJDE - GULV_TOP);
        for (let i = 0; i < 8; i++) g.lineStyle(2, 0xb9d7ff, 0.6).lineBetween(420, 300 + i * 30, 470 + (i % 3) * 40, 300 + i * 30);
        g.fillStyle(0x8a6a45);
        g.fillRect(450, 470, 40, 10).fillRect(560, 430, 36, 10).fillRect(500, 500, 30, 9);
      }
      if (tema === 'fyrtaarn') {
        g.fillStyle(0x2c4a7a).fillRect(0, GULV_TOP, BREDDE, 40);
        g.fillStyle(0xffd76a, 0.25).fillCircle(820, 70, 90);
        g.fillStyle(0xf4f1ea).fillTriangle(760, 470, 880, 470, 840, 110);
        g.fillStyle(0xf4f1ea).fillRect(790, 110, 60, 360);
        g.fillStyle(0xb0413e).fillRect(790, 200, 60, 40).fillRect(790, 330, 60, 40);
        g.fillStyle(0xffe9a8).fillRect(796, 70, 48, 40);
        g.fillStyle(0xb0413e).fillTriangle(784, 70, 856, 70, 820, 40);
      }
      if (!mindreUhygge && tema !== 'fyrtaarn') g.fillStyle(0x000000, 0.12).fillRect(0, 0, BREDDE, HOEJDE);
      break;
    }
    default:
      g.fillStyle(0x777777).fillRect(0, 0, BREDDE, HOEJDE);
  }
}

export function tegnObjekt(g: Phaser.GameObjects.Graphics, o: StedObjekt) {
  const c = farveTal(o.farve);
  const v = o.x - o.w / 2;
  const top = o.y - o.h / 2;
  g.lineStyle(2, 0x2b2433);
  switch (o.form) {
    case 'person':
      g.fillStyle(c).fillRoundedRect(v + 6, top + 34, o.w - 12, o.h - 34, 10).strokeRoundedRect(v + 6, top + 34, o.w - 12, o.h - 34, 10);
      g.fillStyle(0xe0a982).fillCircle(o.x, top + 20, 18).strokeCircle(o.x, top + 20, 18);
      break;
    case 'bog':
      g.fillStyle(c).fillRect(v, top, o.w, o.h).strokeRect(v, top, o.w, o.h);
      g.lineStyle(2, 0x2b2433).lineBetween(o.x, top, o.x, top + o.h);
      for (let i = 1; i < 4; i++) g.lineStyle(1, 0x6b4a2b).lineBetween(v + 8, top + i * 11, o.x - 6, top + i * 11);
      break;
    case 'doer':
      g.fillStyle(c).fillRect(v, top, o.w, o.h).strokeRect(v, top, o.w, o.h);
      for (let i = 1; i < 5; i++) g.lineStyle(2, 0x6b5a50).lineBetween(v + 8, top + i * 22, v + o.w - 8, top + i * 22);
      break;
    case 'skab':
      g.fillStyle(c).fillRect(v, top, o.w, o.h).strokeRect(v, top, o.w, o.h);
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 3; k++) {
          const x = v + 8 + k * ((o.w - 16) / 3);
          const y = top + 8 + r * ((o.h - 16) / 4);
          g.fillStyle(r === 3 && k === 1 ? 0xffe9a8 : 0x8a6a45).fillRect(x + 2, y + 2, (o.w - 16) / 3 - 4, (o.h - 16) / 4 - 4);
        }
      break;
    case 'gnom':
      g.fillStyle(c).fillEllipse(o.x, o.y + 8, o.w, o.h - 10).strokeEllipse(o.x, o.y + 8, o.w, o.h - 10);
      g.fillStyle(c).fillTriangle(o.x - 14, top + 14, o.x + 14, top + 14, o.x + 4, top - 8);
      g.fillStyle(0xffffff).fillCircle(o.x - 8, o.y, 5).fillCircle(o.x + 8, o.y, 5);
      g.fillStyle(0x000000).fillCircle(o.x - 7, o.y + 1, 2).fillCircle(o.x + 9, o.y + 1, 2);
      g.fillStyle(c).fillCircle(o.x + 22, o.y + o.h / 2, 5).fillCircle(o.x - 26, o.y + o.h / 2 + 4, 4);
      break;
    case 'skilt':
      g.fillStyle(0x6b4a2b).fillRect(o.x - 4, top + 30, 8, o.h - 30);
      g.fillStyle(c).fillRect(v, top, o.w, 44).strokeRect(v, top, o.w, 44);
      for (let i = 1; i < 4; i++) g.lineStyle(2, 0x1b1b3a).lineBetween(v + 8, top + i * 11, v + o.w - 8, top + i * 11);
      break;
    case 'sti':
      g.fillStyle(c).fillTriangle(v, o.y + o.h / 2, v + o.w, o.y + o.h / 2, o.x, top);
      break;
    case 'bro':
      g.fillStyle(0x6b4a2b).fillRect(v, o.y - 6, 14, 30).fillRect(v + o.w - 14, o.y - 6, 14, 30);
      g.fillStyle(c);
      for (let i = 0; i < 5; i++) if (i !== 2) g.fillRect(v + 10 + i * 38, o.y - 12 + (i % 2) * 6, 32, 12);
      break;
    default:
      g.fillStyle(c).fillRect(v, top, o.w, o.h);
  }
}
