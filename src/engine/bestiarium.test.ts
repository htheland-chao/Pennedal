import { describe, expect, it } from 'vitest';
import { hentKendte, huskKendte } from './bestiarium';

class Lager {
  d = new Map<string, string>();
  getItem(k: string) {
    return this.d.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.d.set(k, v);
  }
}

describe('bestiariet', () => {
  it('husker kendte væsner uden dubletter og tåler et tomt eller ødelagt lager', () => {
    const l = new Lager() as unknown as Storage;
    expect(hentKendte(l)).toEqual([]);
    huskKendte(['tomordet'], l);
    huskKendte(['tomordet', 'ekko'], l);
    expect(hentKendte(l)).toEqual(['tomordet', 'ekko']);
    (l as unknown as Lager).setItem('pennedal.bestiarium.v1', '{ikke json');
    expect(hentKendte(l)).toEqual([]);
    expect(hentKendte(undefined)).toEqual([]);
  });
});
