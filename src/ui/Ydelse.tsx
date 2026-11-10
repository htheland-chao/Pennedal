import { useEffect, useState } from 'react';
import { t } from '../content';

type MaalerKilde = () => number;

/** Skjult ydelsesmåler. Vises med ?debug=1 i adressen. */
export function Ydelse({ fps }: { fps: MaalerKilde }) {
  const [tal, setTal] = useState({ fps: 0, mb: 0, min: 0, snit: 0 });
  useEffect(() => {
    // De sidste 20 målinger (10 sekunder): det laveste og gennemsnittet, så Henrik kan aflæse dem på en Chromebook.
    const seneste: number[] = [];
    const id = setInterval(() => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      const nu = Math.round(fps());
      if (nu > 0) seneste.push(nu);
      if (seneste.length > 20) seneste.shift();
      const min = seneste.length ? Math.min(...seneste) : 0;
      const snit = seneste.length ? Math.round(seneste.reduce((a, b) => a + b, 0) / seneste.length) : 0;
      setTal({ fps: nu, mb: mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0, min, snit });
    }, 500);
    return () => clearInterval(id);
  }, [fps]);
  const skala = new URLSearchParams(location.search).get('skala') ?? '1';
  return (
    <div className="ydelse" aria-hidden="true">
      {t('debug.fps')}: {tal.fps} | {t('debug.snit')}: {tal.snit} | {t('debug.laveste')}: {tal.min} | {t('debug.skala')}: {skala}
      {tal.mb > 0 && (
        <>
          {' '}
          | {t('debug.hukommelse')}: {tal.mb} MB
        </>
      )}
    </div>
  );
}
