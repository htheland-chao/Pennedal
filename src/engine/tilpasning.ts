export type Niveau = 1 | 2 | 3 | 4 | 5;

export type FaerdighedsStatus = {
  niveau: Niveau;
  rigtigeIForsoeg1: number;
  fejl: number;
  /** Rigtige svar i første forsøg i træk. */
  iTraek: number;
  /** Fejl i træk. */
  fejlITraek: number;
};

export type Haendelse = 'op' | 'ned' | null;

export const START_STATUS: FaerdighedsStatus = {
  niveau: 1,
  rigtigeIForsoeg1: 0,
  fejl: 0,
  iTraek: 0,
  fejlITraek: 0,
};

/** Antal rigtige i første forsøg i træk, der løfter niveauet. */
export const OP_EFTER = 3;
/** Antal fejl i træk, der sænker niveauet. */
export const NED_EFTER = 2;

/**
 * Registrerer et svar. Tiden bruges aldrig: hurtige svar giver ingen fordel.
 * - rigtigt i første forsøg: tæller op mod et højere niveau
 * - rigtigt i et senere forsøg: nulstiller rækken, men sænker ikke
 * - forkert: tæller fejl, og to i træk sænker niveauet
 */
export function registrerSvar(
  status: FaerdighedsStatus,
  svar: { rigtigt: boolean; forsoeg: number },
): { status: FaerdighedsStatus; haendelse: Haendelse } {
  const s = { ...status };
  if (svar.rigtigt) {
    s.fejlITraek = 0;
    if (svar.forsoeg === 1) {
      s.rigtigeIForsoeg1 += 1;
      s.iTraek += 1;
      if (s.iTraek >= OP_EFTER && s.niveau < 5) {
        s.niveau = (s.niveau + 1) as Niveau;
        s.iTraek = 0;
        return { status: s, haendelse: 'op' };
      }
    } else {
      s.iTraek = 0;
    }
    return { status: s, haendelse: null };
  }
  s.fejl += 1;
  s.iTraek = 0;
  s.fejlITraek += 1;
  if (s.fejlITraek >= NED_EFTER && s.niveau > 1) {
    s.niveau = (s.niveau - 1) as Niveau;
    s.fejlITraek = 0;
    return { status: s, haendelse: 'ned' };
  }
  return { status: s, haendelse: null };
}

/** Efter så mange forkerte gæt på samme opgave skal eleven vælge reglen først. */
export const REGEL_EFTER_FORSOEG = 2;
