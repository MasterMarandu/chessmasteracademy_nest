import { useCallback, useEffect, useState } from 'react';

export type ToastTone = 'ok' | 'error';

export interface Toast {
  tone: ToastTone;
  text: string;
}

/** Aviso breve con caducidad: se cierra solo y también a mano. */
export function useToast(timeout = 3400) {
  const [toast, setToast] = useState<Toast | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), timeout);
    return () => window.clearTimeout(timer);
  }, [toast, timeout]);
  const notify = useCallback((tone: ToastTone, text: string) => setToast({ tone, text }), []);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, notify, dismiss };
}
