import { useEffect, useId, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, className = '' }: {
  title: string; onClose: () => void; children: ReactNode; className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const id = useId();
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const root = container.current;
    const focusable = () => Array.from(root?.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href], textarea, [tabindex="0"]') || []);
    const focusTarget = root?.querySelector<HTMLElement>('[data-autofocus]') || focusable()[0];
    focusTarget?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); close.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    root?.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      root?.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, []);

  return <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div ref={container} className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={id}
      initial={{ y: 18, scale: 0.985 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="modal-header"><h2 id={id}>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><X size={20} /></button></div>
      {children}
    </motion.div>
  </motion.div>;
}