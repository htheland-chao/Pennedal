/**
 * Grafikarket: tegner alle pixelfigurer på én side, så man (og Claude) kan se dem samlet.
 * Åbnes med npm run grafik:ark, som også gemmer et billede af hver gruppe i test-results/ark.
 */
import { tegnkortTilLerred } from '../game/pixel/lerred';
import { grupper } from './samling';
import { MANGE_FARVER, tegnkortInfo } from './tjek';

type Raekke = { gruppe: string; navn: string; b: number; h: number; farver: number; advarsler: string[] };

const rod = document.getElementById('ark')!;
const rapport: Raekke[] = [];

for (const g of grupper()) {
  const sektion = document.createElement('section');
  sektion.dataset.ark = g.id;
  const titel = document.createElement('h2');
  titel.textContent = g.titel;
  sektion.append(titel);
  const gitter = document.createElement('div');
  gitter.className = 'gitter';
  const foerste = g.elementer.length ? tegnkortInfo(g.elementer[0].kort) : null;
  for (const e of g.elementer) {
    const i = tegnkortInfo(e.kort);
    const advarsler: string[] = [];
    if (i.mangler.length) advarsler.push(`mangler farve: ${i.mangler.join('')}`);
    if (i.uens) advarsler.push('rækker af forskellig bredde');
    if (i.farver > MANGE_FARVER) advarsler.push(`mange farver (${i.farver})`);
    const maal = g.forventet ?? (g.ensStoerrelse ? foerste : null);
    if (maal && (i.b !== maal.b || i.h !== maal.h)) advarsler.push(`forkert størrelse, skulle være ${maal.b} x ${maal.h}`);
    const c = tegnkortTilLerred(e.kort);
    c.style.width = `${i.b * g.skala}px`;
    c.style.height = `${i.h * g.skala}px`;
    const fig = document.createElement('figure');
    const tekst = document.createElement('figcaption');
    tekst.textContent = `${e.navn} - ${i.b} x ${i.h}, ${i.farver} farver`;
    if (advarsler.length) {
      tekst.classList.add('advarsel');
      tekst.textContent += ` - ${advarsler.join('; ')}`;
    }
    fig.append(c, tekst);
    gitter.append(fig);
    rapport.push({ gruppe: g.id, navn: e.navn, b: i.b, h: i.h, farver: i.farver, advarsler });
  }
  sektion.append(gitter);
  rod.append(sektion);
}

(window as unknown as { __ark: Raekke[] }).__ark = rapport;
document.body.dataset.klar = 'ja';
