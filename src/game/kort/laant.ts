import { hash } from '../pixel/lerred';

/**
 * Lånt grafik (Henrik, 19. november 2026): kun slået til med ?laant=1 i adressen, så eleverne ikke ser den, før Henrik
 * har godkendt stilen. Se LICENSER.md.
 */
export function laantGrafik(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).has('laant');
}

/** Hvor stor en gruppe af runde træer højst er (i felter), og hvor stor en del af skoven der har grupper. */
const GRUPPE = 5;
const ANDEL_GRUPPER = 0.3;
/** Inde i en gruppe er de fleste træer runde, så kanten ikke bliver en skarp firkant. */
const ANDEL_I_GRUPPE = 0.75;

/**
 * Runde træer står i små grupper (Henrik, 19. november 2026: blandet halvt om halvt var "bombastisk og lidt rodet").
 * Skoven deles i felter på 5 x 5. Cirka hvert tredje felt er en gruppe, og der er de fleste træer runde.
 * Samme sted giver altid samme svar, så træer og skygger passer sammen.
 */
export function rundtTrae(tx: number, ty: number): boolean {
  const gx = Math.floor(tx / GRUPPE);
  const gy = Math.floor(ty / GRUPPE);
  return hash(gx * 11 + 5, gy * 17 + 3) < ANDEL_GRUPPER && hash(tx * 3 + 2, ty * 9 + 4) < ANDEL_I_GRUPPE;
}
