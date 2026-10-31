import { describe, expect, it } from 'vitest';
import { FAERDIGHEDER } from './faerdigheder';
import { registrerSvar, START_STATUS, type FaerdighedsStatus } from './tilpasning';
import { KODE_LAENGDE, KODE_LAENGDE_V1, laesGemmekode, lavGemmekode, normaliserKode } from './gemmekode';
import { gemSpil, hentGemtSpil, nytSpil, STANDARD_AVATAR, validerGemtSpil } from './gem';
import { lavCsv } from './csv';

describe('tilpasning af sværhedsgrad', () => {
  it('går op efter tre rigtige i første forsøg i træk', () => {
    let s = { ...START_STATUS };
    let h;
    for (let i = 0; i < 3; i++) ({ status: s, haendelse: h } = registrerSvar(s, { rigtigt: true, forsoeg: 1 }));
    expect(h).toBe('op');
    expect(s.niveau).toBe(2);
    expect(s.rigtigeIForsoeg1).toBe(3);
  });

  it('går ikke op, når svaret først er rigtigt i andet forsøg', () => {
    let s = { ...START_STATUS };
    for (let i = 0; i < 5; i++) s = registrerSvar(s, { rigtigt: true, forsoeg: 2 }).status;
    expect(s.niveau).toBe(1);
  });

  it('går ned efter to fejl i træk, men aldrig under 1', () => {
    let s: FaerdighedsStatus = { ...START_STATUS, niveau: 3 };
    s = registrerSvar(s, { rigtigt: false, forsoeg: 1 }).status;
    const r = registrerSvar(s, { rigtigt: false, forsoeg: 2 });
    expect(r.haendelse).toBe('ned');
    expect(r.status.niveau).toBe(2);
    let lav = { ...START_STATUS };
    for (let i = 0; i < 6; i++) lav = registrerSvar(lav, { rigtigt: false, forsoeg: 1 }).status;
    expect(lav.niveau).toBe(1);
    expect(lav.fejl).toBe(6);
  });

  it('går aldrig over 5', () => {
    let s: FaerdighedsStatus = { ...START_STATUS, niveau: 5 };
    for (let i = 0; i < 6; i++) s = registrerSvar(s, { rigtigt: true, forsoeg: 1 }).status;
    expect(s.niveau).toBe(5);
  });
});

describe('gemmekode', () => {
  const spil = nytSpil({ ...STANDARD_AVATAR, hud: 7, haar: 5, tilbehoer: 3 }, { adjektiv: 31, dyr: 4 });
  spil.trin = 9;
  spil.laasteOp = ['toej.kappe', 'tilbehoer.lanterne'];
  spil.faerdigeHistorier = 2;
  spil.faerdigheder['stav.stumme'].niveau = 4;
  spil.faerdigheder['fort.struktur'].niveau = 5;
  const maks = () => 16;

  it('kan læses tilbage til det samme', () => {
    const kode = lavGemmekode(spil);
    expect(kode.replace(/-/g, '')).toHaveLength(KODE_LAENGDE);
    const r = laesGemmekode(kode, maks);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.spil.avatar).toEqual(spil.avatar);
    expect(r.spil.avatarnavn).toEqual(spil.avatarnavn);
    expect(r.spil.trin).toBe(9);
    expect(r.spil.laasteOp).toEqual(['toej.kappe', 'tilbehoer.lanterne']);
    expect(r.spil.faerdigeHistorier).toBe(2);
    for (const f of FAERDIGHEDER) expect(r.spil.faerdigheder[f].niveau).toBe(spil.faerdigheder[f].niveau);
  });

  it('tåler små bogstaver, mellemrum og forvekslingstegn', () => {
    const kode = lavGemmekode(spil);
    const rodet = kode.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l');
    expect(normaliserKode(rodet)).toBe(kode.replace(/-/g, ''));
    expect(laesGemmekode(rodet, maks).ok).toBe(true);
  });

  it('fanger en tastefejl i langt de fleste tilfælde', () => {
    const kode = lavGemmekode(spil).replace(/-/g, '');
    const alfabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let fanget = 0;
    let i = 0;
    for (let pos = 0; pos < kode.length; pos++) {
      for (const t of alfabet) {
        if (t === kode[pos]) continue;
        i++;
        const forkert = kode.slice(0, pos) + t + kode.slice(pos + 1);
        if (!laesGemmekode(forkert, maks).ok) fanget++;
      }
    }
    expect(fanget / i).toBeGreaterThan(0.99);
  });

  it('giver en forståelig fejl ved forkert længde og ugyldige tegn', () => {
    expect(laesGemmekode('ABC', maks)).toEqual({ ok: false, fejl: 'laengde', antal: 3 });
    const r = laesGemmekode('ABC!', maks);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.fejl).toBe('tegn');
  });

  it('gemmer hukommelsesskår, Klattens venlighed og vigtige valg (version 2)', () => {
    const s2 = { ...spil, skaar: ['k1a', 'k3b', 'k8b'], venlighed: 5, valg: { 'klatten.hjulpet': 'ja', 'taske.noegle': 'Nøgle' } };
    const r = laesGemmekode(lavGemmekode(s2), maks);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.spil.skaar).toEqual(['k1a', 'k3b', 'k8b']);
    expect(r.spil.venlighed).toBe(5);
    // Kun de vigtige valg følger med. Ting fra et escape room gør ikke.
    expect(r.spil.valg).toEqual({ 'klatten.hjulpet': 'ja' });
  });

  it('kan stadig læse en gammel kode fra version 1', () => {
    // Lavet med gemmekoden fra før version 2: kapitel 2, trin 9, kappe og lanterne låst op.
    const r = laesGemmekode('4H7W-KM54-GKC0-0000-0000-0000-C42R', maks);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(KODE_LAENGDE_V1).toBe(28);
    expect(r.spil.kapitel).toBe(2);
    expect(r.spil.trin).toBe(9);
    expect(r.spil.avatar.hud).toBe(7);
    expect(r.spil.laasteOp).toEqual(['toej.kappe', 'tilbehoer.lanterne']);
    expect(r.spil.faerdigheder['stav.stumme'].niveau).toBe(4);
    expect(r.spil.skaar).toEqual([]);
    expect(r.spil.venlighed).toBe(0);
  });

  it('afviser en kode med et trin, der ikke findes', () => {
    const kode = lavGemmekode(spil);
    expect(laesGemmekode(kode, () => 3)).toEqual({ ok: false, fejl: 'indhold' });
  });
});

describe('gemt spil', () => {
  it('gemmer og henter fra lageret', () => {
    const lager = new Map<string, string>();
    const fake = {
      getItem: (k: string) => lager.get(k) ?? null,
      setItem: (k: string, v: string) => void lager.set(k, v),
      removeItem: (k: string) => void lager.delete(k),
    } as unknown as Storage;
    const spil = nytSpil(STANDARD_AVATAR, { adjektiv: 1, dyr: 2 });
    spil.faerdigheder['stav.stumme'].fejl = 3;
    expect(gemSpil(spil, fake)).toBe(true);
    expect(hentGemtSpil(fake)).toEqual(spil);
  });

  it('afviser ødelagte data', () => {
    expect(validerGemtSpil(null)).toBeNull();
    expect(validerGemtSpil({ version: 2 })).toBeNull();
    const spil = nytSpil(STANDARD_AVATAR, { adjektiv: 1, dyr: 2 }) as unknown as Record<string, unknown>;
    expect(validerGemtSpil({ ...spil, avatar: { ...STANDARD_AVATAR, hud: 99 } })).toBeNull();
  });

  it('overlever et lager, der kaster fejl', () => {
    const ondt = {
      getItem: () => {
        throw new Error('nej');
      },
      setItem: () => {
        throw new Error('nej');
      },
    } as unknown as Storage;
    expect(hentGemtSpil(ondt)).toBeNull();
    expect(gemSpil(nytSpil(STANDARD_AVATAR, { adjektiv: 0, dyr: 0 }), ondt)).toBe(false);
  });
});

describe('CSV', () => {
  it('har BOM, semikolon og én linje pr. færdighed', () => {
    const spil = nytSpil(STANDARD_AVATAR, { adjektiv: 0, dyr: 0 });
    const csv = lavCsv(spil, 'Modig Ugle', (id) => id, ['Færdighed', 'Niveau', 'Rigtige', 'Fejl']);
    expect(csv.startsWith('﻿')).toBe(true);
    const linjer = csv.trim().split('\r\n');
    expect(linjer).toHaveLength(FAERDIGHEDER.length + 1);
    expect(linjer[1]).toBe('Modig Ugle;stav.stumme;1;0;0');
  });
});
