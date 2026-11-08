import { useEffect } from 'react';

/**
 * En kort besked i hjørnet, der ikke blokerer spillet (fx "Del 1 er klaret"). Uden knap forsvinder den selv efter et stykke tid.
 * Med en knap (fx "Se mindet nu") bliver den stående, til den lukkes. Teksten er HTML, så den kan læses op. Der er intet, eleven skal nå: beskeden findes også andre steder.
 */
export function Kvittering({ tekst, onSkjul, luk, handling }: { tekst: string; onSkjul: () => void; luk: string; handling?: { tekst: string; onKlik: () => void } }) {
  // En besked med en knap bliver stående, til eleven lukker den (ingen tid på at læse, krav 5).
  const harHandling = !!handling;
  useEffect(() => {
    if (harHandling) return;
    const ur = window.setTimeout(onSkjul, 7000);
    return () => window.clearTimeout(ur);
  }, [tekst, onSkjul, harHandling]);
  return (
    <div className="kvittering" role="status">
      <span className="kvittering-glimt" aria-hidden="true" />
      <p>{tekst}</p>
      {handling && (
        <button type="button" className="knap knap-primaer" onClick={handling.onKlik}>
          {handling.tekst}
        </button>
      )}
      <button type="button" className="knap knap-diskret" onClick={onSkjul}>
        {luk}
      </button>
    </div>
  );
}
