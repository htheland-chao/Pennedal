/**
 * Oplæsning med Chromes indbyggede talesyntese (Web Speech API).
 * Spillets egne tekster må læses op med alle danske stemmer.
 * Tekster, eleven selv har skrevet, må kun læses op med stemmer, der kører lokalt,
 * så elevtekster aldrig sendes til en ekstern tjeneste (kunLokal: true).
 */
export function taleFindes(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function danskeStemmer(): SpeechSynthesisVoice[] {
  if (!taleFindes()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('da'));
}

export function naarStemmerErKlar(fn: () => void): () => void {
  if (!taleFindes()) return () => {};
  const s = window.speechSynthesis;
  fn();
  s.addEventListener('voiceschanged', fn);
  return () => s.removeEventListener('voiceschanged', fn);
}

export type SigValg = {
  stemme?: string | null;
  kunLokal?: boolean;
  /** Lydstyrke 0-100. */
  styrke?: number;
  /** Kaldes med tegnposition for det ord, der læses lige nu (hvis stemmen understøtter det). */
  vedOrd?: (start: number, laengde: number) => void;
  /** true, når teksten er læst til ende, false ved fejl eller afbrydelse. */
  vedSlut?: (fuldfoert: boolean) => void;
};

export function sig(tekst: string, valg: SigValg = {}): boolean {
  if (!taleFindes()) return false;
  const stemmer = danskeStemmer().filter((v) => !valg.kunLokal || v.localService);
  const stemme = stemmer.find((v) => v.name === valg.stemme) ?? stemmer[0];
  if (!stemme) return false;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(tekst);
  u.voice = stemme;
  u.lang = stemme.lang;
  u.rate = 0.9;
  if (valg.styrke !== undefined) u.volume = Math.min(1, Math.max(0, valg.styrke / 100));
  u.onboundary = (e) => {
    if (e.name === 'word') valg.vedOrd?.(e.charIndex, e.charLength ?? 0);
  };
  u.onend = () => valg.vedSlut?.(true);
  u.onerror = () => valg.vedSlut?.(false);
  s.speak(u);
  return true;
}

export function stopTale(): void {
  if (taleFindes()) window.speechSynthesis.cancel();
}
