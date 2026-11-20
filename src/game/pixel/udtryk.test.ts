import { describe, expect, it } from 'vitest';
import { kapitler } from '../../content';
import { PORTRAETTER } from './portraetter';
import { harUdtryk, medUdtryk, UDTRYK, type Udtryk } from './udtryk';
import { portraetBilleder } from './levende';

type Figur = keyof typeof PORTRAETTER;

function replikkerMedUdtryk(): { taler: string; udtryk: string; tekst: string }[] {
  const ud: { taler: string; udtryk: string; tekst: string }[] = [];
  const gaa = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(gaa);
    else if (o && typeof o === 'object') {
      const r = o as Record<string, unknown>;
      if (typeof r.taler === 'string' && typeof r.udtryk === 'string') ud.push({ taler: r.taler, udtryk: r.udtryk, tekst: String(r.tekst) });
      Object.values(r).forEach(gaa);
    }
  };
  gaa(kapitler);
  return ud;
}

describe('udtryk i portrætterne', () => {
  it('ændrer portrættet, holder sig inden for 24 x 24 og bruger kun portrættets egne farver', () => {
    for (const figur of Object.keys(PORTRAETTER) as Figur[])
      for (const u of UDTRYK) {
        if (!harUdtryk(figur, u)) continue;
        const kort = medUdtryk(figur, u);
        expect(kort.raekker, `${figur} ${u}`).not.toEqual(PORTRAETTER[figur].raekker);
        expect(kort.raekker).toHaveLength(24);
        for (const r of kort.raekker) {
          expect(r).toHaveLength(24);
          for (const c of r) if (c !== '.') expect(kort.palet[c], `${figur} ${u}: ${c}`).toBeDefined();
        }
        // Blink og tale skal stadig kunne laves.
        expect(() => portraetBilleder(figur, kort)).not.toThrow();
      }
  });

  it('giver tre forskellige ansigter til Æseløre, Klatten, Vims og Fru Fodnote', () => {
    for (const figur of ['aeseloere', 'klatten', 'vims', 'fodnote'] as const) {
      const ansigter = new Set(UDTRYK.map((u) => medUdtryk(figur, u).raekker.join('')));
      expect(ansigter.size).toBe(3);
    }
  });

  it('bruges kun i replikker, hvor figuren har udtrykket', () => {
    const fejl = replikkerMedUdtryk().filter(
      (r) => !(UDTRYK as readonly string[]).includes(r.udtryk) || !(r.taler in PORTRAETTER) || !harUdtryk(r.taler as Figur, r.udtryk as Udtryk),
    );
    expect(fejl).toEqual([]);
  });
});
