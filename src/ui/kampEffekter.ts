/**
 * Kampens animationer (Henrik, 8. november 2026): hvert slag og hvert angreb skal se fedt ud.
 * Denne fil oversætter det, der sker i kampen (kampmotorens hændelser), til trin, der spilles ét ad gangen:
 * hvilke effekter der vises hvor, hvilken kort linje der står på skærmen, og hvordan livet ændrer sig.
 * Ren logik uden React, så rækkefølgen kan testes. Selve udseendet står i styles.css (.fx-*).
 */
import { KRUMMER_LIV, type AngrebId, type Haendelse, type KampTingId, type MedlemId } from '../mechanics/kampmotor';

export type EffektType =
  | 'straale'
  | 'forbi'
  | 'stort'
  | 'nedslag'
  | 'svag'
  | 'tal'
  | 'oploes'
  | 'ordplads'
  | 'kombi'
  | 'skjold'
  | 'lap'
  | 'lys'
  | 'krummer'
  | 'punktum'
  | 'visk'
  | `angreb-${AngrebId}`
  | 'blaendet'
  | 'sejr'
  | 'nederlag';

/** Placeringer er i procent af scenen (0-100). tx/ty er målet for noget, der flyver. */
export type Effekt = { type: EffektType; x: number; y: number; tx?: number; ty?: number; tekst?: string; slags?: 'skade' | 'liv' | 'info' };

export type Trin = {
  effekter: Effekt[];
  /** Den korte linje nederst. null: ingen tekst i dette trin. */
  linje: { noegle: string; vaerdier: Record<string, string | number> } | null;
  /** Hvor længe trinnet varer i millisekunder. */
  varighed: number;
  /** Livet ændres, når trinnet starter. */
  fjendeLiv?: { nr: number; delta: number }[];
  holdLiv?: { id: MedlemId; delta: number }[];
  /** Figurer, der ryster, blinker eller falder. */
  ryst?: { fjender?: number[]; hold?: MedlemId[]; skaerm?: boolean };
  oploest?: number[];
  faldet?: MedlemId[];
};

export type Pladser = { fjende: (nr: number) => [number, number]; medlem: (id: MedlemId) => [number, number] };

const ANGREB_TEKST: Record<AngrebId, string> = {
  aed: 'kamp.kort.angreb.aed',
  gab: 'kamp.kort.angreb.gab',
  stjael: 'kamp.kort.angreb.stjael',
  hvisk: 'kamp.kort.angreb.hvisk',
  gentag: 'kamp.kort.angreb.gentag',
  raab: 'kamp.kort.angreb.raab',
};
const TING_TEKST: Record<KampTingId, string> = { lanterne: 'kamp.kort.lanterne', krummer: 'kamp.kort.krummer', punktum: 'kamp.kort.punktum' };

/**
 * Laver trinnene for en række hændelser. navne giver væsnernes og holdets navne til de korte linjer.
 * Angreb mod hele holdet samles i ét trin, så det ser ud som én bølge.
 */
export function trinFor(hs: Haendelse[], p: Pladser, navn: { fjende: (nr: number) => string; medlem: (id: MedlemId) => string }, hold: MedlemId[]): Trin[] {
  const ud: Trin[] = [];
  const avatar = p.medlem('avatar');
  let stortVist = false;
  for (let i = 0; i < hs.length; i++) {
    const h = hs[i];
    switch (h.type) {
      case 'ramt': {
        const [x, y] = p.fjende(h.fjende);
        const effekter: Effekt[] = [];
        if (h.stort && !stortVist) {
          stortVist = true;
          effekter.push({ type: 'stort', x: avatar[0], y: avatar[1], tx: x, ty: y });
        } else if (!h.stort) effekter.push({ type: 'straale', x: avatar[0], y: avatar[1], tx: x, ty: y });
        effekter.push({ type: 'nedslag', x, y });
        if (h.svag) effekter.push({ type: 'svag', x, y: y - 22 });
        effekter.push({ type: 'tal', x, y: y - 12, tekst: `-${h.skade}`, slags: 'skade' });
        ud.push({
          effekter,
          linje: { noegle: h.svag ? 'kamp.kort.svag' : 'kamp.kort.ramt', vaerdier: { navn: navn.fjende(h.fjende), skade: h.skade } },
          varighed: h.stort ? 1300 : 1150,
          fjendeLiv: [{ nr: h.fjende, delta: -h.skade }],
          ryst: { fjender: [h.fjende], skaerm: h.svag || h.stort },
        });
        break;
      }
      case 'forbi': {
        const [x, y] = p.fjende(h.fjende);
        ud.push({
          effekter: [{ type: 'forbi', x: avatar[0], y: avatar[1], tx: x, ty: y - 30 }],
          linje: { noegle: 'kamp.kort.forbi', vaerdier: { navn: navn.fjende(h.fjende) } },
          varighed: 1000,
        });
        break;
      }
      case 'rolig': {
        const [x, y] = p.fjende(h.fjende);
        // Væsnet smelter, og de ord, det havde ædt, falder på plads som en linje (Henrik, 9. november 2026).
        ud.push({
          effekter: [{ type: 'oploes', x, y }, { type: 'ordplads', x, y: y - 18 }],
          linje: { noegle: 'kamp.kort.rolig', vaerdier: { navn: navn.fjende(h.fjende) } },
          varighed: 1300,
          oploest: [h.fjende],
        });
        break;
      }
      case 'kombi':
        ud.push({ effekter: [{ type: 'kombi', x: 50, y: 40 }], linje: { noegle: 'kamp.kort.kombi', vaerdier: {} }, varighed: 1100 });
        break;
      case 'forsvar':
        ud.push({ effekter: hold.map((id) => ({ type: 'skjold' as const, x: p.medlem(id)[0], y: p.medlem(id)[1] })), linje: { noegle: 'kamp.kort.forsvar', vaerdier: {} }, varighed: 900 });
        break;
      case 'evne': {
        if (h.evne === 'lap') {
          const id = h.hvem ?? 'avatar';
          const [x, y] = p.medlem(id);
          ud.push({
            effekter: [{ type: 'lap', x, y }, { type: 'tal', x, y: y - 14, tekst: `+${h.liv ?? 0}`, slags: 'liv' }],
            linje: { noegle: 'kamp.kort.lap', vaerdier: { hvem: navn.medlem(id), liv: h.liv ?? 0 } },
            varighed: 1000,
            holdLiv: [{ id, delta: h.liv ?? 0 }],
          });
        } else if (h.evne === 'slet' && h.fjende !== undefined) {
          const [x, y] = p.fjende(h.fjende);
          ud.push({ effekter: [{ type: 'visk', x, y }], linje: { noegle: 'kamp.kort.slet', vaerdier: { navn: navn.fjende(h.fjende) } }, varighed: 900 });
        }
        break;
      }
      case 'ting': {
        const effekter: Effekt[] = [];
        const holdLiv: NonNullable<Trin['holdLiv']> = [];
        if (h.ting === 'lanterne') effekter.push({ type: 'lys', x: avatar[0], y: avatar[1] });
        if (h.ting === 'krummer')
          for (const id of hold) {
            const [x, y] = p.medlem(id);
            effekter.push({ type: 'krummer', x, y }, { type: 'tal', x, y: y - 14, tekst: `+${KRUMMER_LIV}`, slags: 'liv' });
            holdLiv.push({ id, delta: KRUMMER_LIV });
          }
        if (h.ting === 'punktum' && h.fjende !== undefined) {
          const [x, y] = p.fjende(h.fjende);
          effekter.push({ type: 'punktum', x, y });
        }
        ud.push({
          effekter,
          linje: { noegle: TING_TEKST[h.ting], vaerdier: { navn: h.fjende !== undefined ? navn.fjende(h.fjende) : '' } },
          varighed: 1000,
          holdLiv: holdLiv.length ? holdLiv : undefined,
        });
        break;
      }
      case 'angreb': {
        // Angreb fra samme væsen mod flere (gab, hvisk) samles i ét trin.
        const samme: Extract<Haendelse, { type: 'angreb' }>[] = [h];
        while (hs[i + 1]?.type === 'angreb' && (hs[i + 1] as typeof h).fjende === h.fjende && (hs[i + 1] as typeof h).angreb === h.angreb) samme.push(hs[++i] as typeof h);
        const [x, y] = p.fjende(h.fjende);
        const effekter: Effekt[] = [];
        for (const a of samme) {
          const [mx, my] = p.medlem(a.hvem);
          effekter.push({ type: `angreb-${a.angreb}`, x, y, tx: mx, ty: my });
          effekter.push({ type: 'tal', x: mx, y: my - 14, tekst: a.skade > 0 ? `-${a.skade}` : '0', slags: 'skade' });
        }
        const ramte = samme.filter((a) => a.skade > 0);
        ud.push({
          effekter,
          linje:
            ramte.length === 0
              ? { noegle: 'kamp.kort.afvist', vaerdier: { navn: navn.fjende(h.fjende), hvem: navn.medlem(h.hvem) } }
              : { noegle: ANGREB_TEKST[h.angreb], vaerdier: { navn: navn.fjende(h.fjende), hvem: navn.medlem(h.hvem), skade: h.skade } },
          varighed: 1250,
          holdLiv: samme.map((a) => ({ id: a.hvem, delta: -a.skade })),
          ryst: { hold: ramte.map((a) => a.hvem), skaerm: ramte.length > 0 },
        });
        break;
      }
      case 'misser': {
        const [x, y] = p.fjende(h.fjende);
        ud.push({ effekter: [{ type: 'blaendet', x, y }], linje: { noegle: 'kamp.kort.misser', vaerdier: { navn: navn.fjende(h.fjende) } }, varighed: 900 });
        break;
      }
      case 'lammet': {
        const [x, y] = p.fjende(h.fjende);
        ud.push({ effekter: [{ type: 'punktum', x, y }], linje: { noegle: 'kamp.kort.lammet', vaerdier: { navn: navn.fjende(h.fjende) } }, varighed: 900 });
        break;
      }
      case 'faldet':
        if (h.hvem !== 'avatar') ud.push({ effekter: [], linje: { noegle: 'kamp.kort.faldet', vaerdier: { hvem: navn.medlem(h.hvem) } }, varighed: 900, faldet: [h.hvem] });
        break;
      case 'vundet':
        ud.push({ effekter: [{ type: 'sejr', x: 50, y: 45 }], linje: { noegle: 'kamp.kort.vundet', vaerdier: {} }, varighed: 1600 });
        break;
      case 'slaaet':
        ud.push({ effekter: [{ type: 'nederlag', x: 50, y: 50 }], linje: { noegle: 'kamp.kort.slaaet', vaerdier: {} }, varighed: 1600, faldet: ['avatar'] });
        break;
    }
  }
  return ud;
}
