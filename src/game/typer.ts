import type { Sted } from '../content';

/** Det, React og Phaser-scenerne udveksler. Fælles for KortScene og BaneScene. */
export type VerdenKroge = {
  onInteraktion: (objektId: string) => void;
  onNaer: (objektId: string | null) => void;
  /** Placering af E-hintet over det, eleven kan undersøge, i procent af spilfladen. null skjuler det. */
  onHint?: (pos: { x: number; y: number } | null) => void;
  /** Platformbane: true, når Æseløre skal tilbyde at bære hovedpersonen over. */
  onHjaelp?: (vis: boolean) => void;
};

export type VerdenData = {
  sted: Sted;
  aktiv: string | null;
  /** Escape room: alt det, man kan undersøge på én gang. Der vises ingen pil, kun E-hintet. */
  aktive?: string[];
  mindreUhygge: boolean;
  /** Platformbane: målet er allerede nået (eleven er længere i kapitlet). Så starter hovedpersonen ved målet. */
  baneKlaret?: boolean;
  /** Objekter, der ikke skal vises lige nu, fx Klatten, når han er løbet. */
  skjulte?: string[];
};
