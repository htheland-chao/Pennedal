import type { OgTekst } from '../content';
import { vaelg } from '../engine/tilfaeldig';

export type OgToken = {
  /** Ordet uden tegn, som det står i kilden. */
  ord: string;
  erOg: boolean;
  /** s: skal blive punktum. b: skal blive stående. */
  ogType?: 's' | 'b';
  erNavn: boolean;
  /** Tegn efter ordet, fx komma eller punktum. */
  tegn: string;
};

export type OgTilstand = {
  /** Indeks for og'er, der er lavet om til punktum. */
  punktummer: number[];
  /** Indeks for ord, hvor eleven har skiftet begyndelsesbogstav. */
  skiftet: number[];
};

export type OgFejl = 'mangler' | 'bliv' | 'stort' | 'lille' | 'navn';
export type OgResultat = { ok: true } | { ok: false; fejl: OgFejl; indeks: number };

export function parseOgTekst(tekst: string): OgToken[] {
  return tekst.split(/\s+/).map((raa) => {
    const m = /^(.*?)(\{([sbn])\})?([.,!?:;]*)$/u.exec(raa);
    if (!m) throw new Error(`Kan ikke læse ordet: ${raa}`);
    const ord = m[1];
    const markering = m[3] as 's' | 'b' | 'n' | undefined;
    const erOg = ord.toLowerCase() === 'og' && (markering === 's' || markering === 'b');
    return {
      ord,
      erOg,
      ogType: erOg ? (markering as 's' | 'b') : undefined,
      erNavn: markering === 'n',
      tegn: m[4],
    };
  });
}

export const tomOgTilstand = (): OgTilstand => ({ punktummer: [], skiftet: [] });

function storForbogstav(s: string): boolean {
  const f = s.charAt(0);
  return f !== f.toLocaleLowerCase('da-DK');
}

/** Om ordet på plads i lige nu vises med stort begyndelsesbogstav. */
export function harStort(tokens: OgToken[], tilstand: OgTilstand, i: number): boolean {
  const kilde = storForbogstav(tokens[i].ord);
  return tilstand.skiftet.includes(i) ? !kilde : kilde;
}

export function visOrd(tokens: OgToken[], tilstand: OgTilstand, i: number): string {
  const o = tokens[i].ord;
  const stort = harStort(tokens, tilstand, i);
  const f = o.charAt(0);
  return (stort ? f.toLocaleUpperCase('da-DK') : f.toLocaleLowerCase('da-DK')) + o.slice(1);
}

/** Forrige token, der ikke er et og, der er lavet om til punktum. */
function forrigeErPunktum(tilstand: OgTilstand, i: number): boolean {
  return i > 0 && tilstand.punktummer.includes(i - 1);
}

export function skalHaveStort(tokens: OgToken[], tilstand: OgTilstand, i: number): boolean {
  return i === 0 || tokens[i].erNavn || forrigeErPunktum(tilstand, i);
}

export function tjekOgorm(tokens: OgToken[], tilstand: OgTilstand): OgResultat {
  // 1. Et og, der skulle blive, er lavet om.
  for (const i of tilstand.punktummer) {
    if (tokens[i]?.ogType === 'b') return { ok: false, fejl: 'bliv', indeks: i };
  }
  // 2. Store og små bogstaver.
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].erOg && tilstand.punktummer.includes(i)) continue;
    const skal = skalHaveStort(tokens, tilstand, i);
    const har = harStort(tokens, tilstand, i);
    if (skal && !har) return { ok: false, fejl: tokens[i].erNavn ? 'navn' : 'stort', indeks: i };
    if (!skal && har) return { ok: false, fejl: 'lille', indeks: i };
  }
  // 3. Et og mellem to sætninger mangler at blive klippet.
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].ogType === 's' && !tilstand.punktummer.includes(i)) return { ok: false, fejl: 'mangler', indeks: i };
  }
  return { ok: true };
}

/** Den færdige tekst, som eleven har lavet den. */
export function visTekst(tokens: OgToken[], tilstand: OgTilstand): string {
  let ud = '';
  tokens.forEach((tok, i) => {
    if (tok.erOg && tilstand.punktummer.includes(i)) {
      ud = ud.trimEnd() + '. ';
      return;
    }
    ud += visOrd(tokens, tilstand, i) + tok.tegn + ' ';
  });
  return ud.trim();
}

/** Den rigtige tekst, bruges i tests og som facit i korrekturlisten. */
export function facit(tokens: OgToken[]): string {
  const punktummer = tokens.map((t, i) => (t.ogType === 's' ? i : -1)).filter((i) => i >= 0);
  const skiftet: number[] = [];
  const foreloebig: OgTilstand = { punktummer, skiftet };
  tokens.forEach((_, i) => {
    if (tokens[i].erOg && punktummer.includes(i)) return;
    if (skalHaveStort(tokens, foreloebig, i) !== storForbogstav(tokens[i].ord)) skiftet.push(i);
  });
  return visTekst(tokens, { punktummer, skiftet });
}

export function antalLed(tokens: OgToken[], tilstand: OgTilstand): number {
  return tokens.filter((t, i) => t.erOg && !tilstand.punktummer.includes(i)).length;
}

export function vaelgOgTekst(tekster: OgTekst[], niveau: number, tal: () => number, brugt: string[] = []): OgTekst {
  for (let afstand = 0; afstand < 5; afstand++) {
    const kandidater = tekster.filter(
      (t) => Math.abs(t.niveau - niveau) === afstand && !brugt.includes(t.id),
    );
    if (kandidater.length > 0) return vaelg(kandidater, tal);
  }
  return vaelg(tekster, tal);
}
