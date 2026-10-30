import { FAERDIGHEDER } from './faerdigheder';
import type { GemtSpil } from './gem';

/** CSV med semikolon og BOM, så dansk Excel og Google Sheets læser æ, ø og å rigtigt. */
export function lavCsv(spil: GemtSpil, navn: string, etiket: (id: string) => string, overskrifter: string[]): string {
  const felt = (x: string | number) => {
    const s = String(x);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linjer = [['Avatarnavn', ...overskrifter].map(felt).join(';')];
  for (const id of FAERDIGHEDER) {
    const s = spil.faerdigheder[id];
    linjer.push([navn, etiket(id), s.niveau, s.rigtigeIForsoeg1, s.fejl].map(felt).join(';'));
  }
  return '﻿' + linjer.join('\r\n') + '\r\n';
}
