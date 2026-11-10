import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
import '@fontsource/pixelify-sans/latin-600.css';
import { laasOpMusik } from './ui/musik/afspiller';
import { spilEffekt } from './ui/effekter';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { Lydkorrektur } from './ui/Lydkorrektur';

// ?lyd=1 viser siden, hvor alle indtalte lydklip kan aflyttes.
const visLyd = new URLSearchParams(window.location.search).has('lyd');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {visLyd ? <Lydkorrektur /> : <App />}
  </StrictMode>,
);

// Offline: gem spillets filer, så det virker uden net efter første besøg.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* spillet virker også uden */
    });
  });
}

// Browsere tillader først lyd efter elevens første tryk eller tast.
for (const type of ['pointerdown', 'keydown'] as const) document.addEventListener(type, laasOpMusik, { passive: true });
// Et lille klik på knapper (Henrik, 10. november 2026). Svarknapper får deres egen lyd (rigtig eller forkert) i stedet.
document.addEventListener(
  'click',
  (e) => {
    const knap = (e.target as Element | null)?.closest?.('button');
    if (!knap || knap.disabled) return;
    if (knap.closest('.kamp-muligheder, .ord-muligheder, .muligheder, [data-ingen-klik]')) return;
    spilEffekt('knap');
  },
  { capture: true, passive: true },
);
