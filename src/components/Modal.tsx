import { useEffect, useRef, type ReactNode } from 'react';

type Props = {
  titel: string;
  children: ReactNode;
  /** Hvis den mangler, kan vinduet ikke lukkes med Escape. */
  onLuk?: () => void;
  bred?: boolean;
  klasse?: string;
};

/** Et rigtigt <dialog>-vindue. Chrome holder fokus inde i vinduet og læser titlen op. */
export function Modal({ titel, children, onLuk, bred, klasse }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute('open', '');
      }
    }
    return () => {
      if (d?.open) d.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${bred ? 'modal-bred' : ''} ${klasse ?? ''}`}
      aria-label={titel}
      onCancel={(e) => {
        e.preventDefault();
        onLuk?.();
      }}
    >
      {children}
    </dialog>
  );
}
