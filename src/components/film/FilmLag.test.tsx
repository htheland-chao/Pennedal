import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Kontekst } from '../Kontekst';
import { STANDARD_INDSTILLINGER, nytSpil, STANDARD_AVATAR, type GemtSpil } from '../../data/gem';
import type { EnkelHandling, Handling } from '../../engine/film/typer';
import type { PhaserFilm } from '../../game/kort/film';
import { FilmLag } from './FilmLag';

const SEKVENS: Handling[] = [
  { type: 'samtidig', handlinger: [{ type: 'bjaelker', til: true }, { type: 'kamera', til: { figur: 'spiller' }, ms: 2000 }] },
  { type: 'replikker', replikker: [{ taler: 'aeseloere', tekst: 'Første replik.' }, { taler: 'aeseloere', tekst: 'Anden replik.' }] },
  { type: 'saet', valg: 'film.set' },
  { type: 'bjaelker', til: false },
];

function lav(handlinger = SEKVENS) {
  const log: string[] = [];
  const phaser: PhaserFilm = {
    start: () => log.push('start'),
    udfoer: (h: EnkelHandling) => {
      log.push(`+${h.type}`);
      return new Promise((r) => setTimeout(r, 'ms' in h && typeof h.ms === 'number' ? h.ms : 0));
    },
    slut: (h) => log.push(`slut:${h.type}`),
    oprydning: () => log.push('oprydning'),
  };
  const spilRef = { current: nytSpil(STANDARD_AVATAR, { adjektiv: 0, dyr: 0 }) as GemtSpil };
  const onSaet = vi.fn();
  const onFaerdig = vi.fn();
  // "Gå videre af sig selv" er slået til: i en film skal replikkerne alligevel vente på Videre (krav 5).
  const indstillinger = { ...STANDARD_INDSTILLINGER, oplaesning: false, autoVidere: true };
  render(
    <Kontekst.Provider value={{ indstillinger, visOrdkort: () => {} }}>
      <FilmLag handlinger={handlinger} phaser={{ current: phaser }} spilRef={spilRef} onSaet={onSaet} onTaler={() => {}} onFaerdig={onFaerdig} />
    </Kontekst.Provider>,
  );
  return { log, onSaet, onFaerdig };
}

const tid = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe('filmsekvensen i React', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom kender ikke <dialog>-vinduets showModal og close.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('viser bjælker og replikker, venter på Videre og rydder op', async () => {
    const { log, onSaet, onFaerdig } = lav();
    await tid(10);
    expect(document.querySelector('.film-bjaelker.vis')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Spring over/ })).toBeTruthy();
    await tid(2500);
    expect(screen.getByText('Første replik.')).toBeTruthy();
    // Ingen tid på tekst: repliken står der stadig efter et minut.
    await tid(60_000);
    expect(screen.getByText('Første replik.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Videre' }));
    expect(screen.getByText('Anden replik.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Videre' }));
    await tid(1000);
    expect(onSaet).toHaveBeenCalledWith('film.set');
    expect(onFaerdig).toHaveBeenCalledTimes(1);
    expect(log).toEqual(['start', '+kamera', 'oprydning']);
    expect(document.querySelector('.film-bjaelker.vis')).toBeNull();
  });

  it('"Spring over" giver samme sluttilstand: valget er sat, og kameraet står ved målet', async () => {
    const { log, onSaet, onFaerdig } = lav();
    await tid(100);
    fireEvent.click(screen.getByRole('button', { name: /Spring over/ }));
    await tid(10);
    expect(log).toEqual(['start', '+kamera', 'slut:kamera', 'oprydning']);
    expect(onSaet).toHaveBeenCalledWith('film.set');
    expect(onFaerdig).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Første replik.')).toBeNull();
  });

  it('Escape springer over, også midt i en replik', async () => {
    const { onSaet, onFaerdig } = lav();
    await tid(2500);
    expect(screen.getByText('Første replik.')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Spring over/ })).toHaveLength(1);
    fireEvent.keyDown(window, { key: 'Escape' });
    await tid(10);
    expect(onSaet).toHaveBeenCalledWith('film.set');
    expect(onFaerdig).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Første replik.')).toBeNull();
  });

  it('starter ikke, hvis komponenten forsvinder med det samme, og afslutter ikke trinnet ved afbrydelse', async () => {
    const { log, onFaerdig } = lav();
    cleanup();
    await tid(5000);
    expect(log).toEqual([]);
    expect(onFaerdig).not.toHaveBeenCalled();
  });
});
