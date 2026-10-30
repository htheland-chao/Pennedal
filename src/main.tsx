import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/opendyslexic/400.css';
import '@fontsource/opendyslexic/700.css';
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
