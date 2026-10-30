import { useEffect, useState } from 'react';
import { t } from '../content';

type MaalerKilde = () => number;

/** Skjult ydelsesmåler. Vises med ?debug=1 i adressen. */
export function Ydelse({ fps }: { fps: MaalerKilde }) {
  const [tal, setTal] = useState({ fps: 0, mb: 0 });
  useEffect(() => {
    const id = setInterval(() => {
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      setTal({ fps: Math.round(fps()), mb: mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0 });
    }, 500);
    return () => clearInterval(id);
  }, [fps]);
  return (
    <div className="ydelse" aria-hidden="true">
      {t('debug.fps')}: {tal.fps}
      {tal.mb > 0 && (
        <>
          {' '}
          | {t('debug.hukommelse')}: {tal.mb} MB
        </>
      )}
    </div>
  );
}
