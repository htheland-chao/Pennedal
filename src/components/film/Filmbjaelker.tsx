/**
 * Sorte filmbjælker foroven og forneden (20. november 2026). Ren pynt i CSS: de glider ind og ud, og med
 * "reducer bevægelse" kommer de bare frem. Tiden står i BJAELKE_MS (useFilm.ts) og i CSS.
 */
export function Filmbjaelker({ vis }: { vis: boolean }) {
  return (
    <div className={`film-bjaelker${vis ? ' vis' : ''}`} aria-hidden="true">
      <div className="film-bjaelke film-bjaelke-top" />
      <div className="film-bjaelke film-bjaelke-bund" />
    </div>
  );
}
