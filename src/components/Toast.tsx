import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, X } from 'lucide-react';
import type { Toast } from '../hooks/useToast';

/** Aviso flotante: informativo o de error, con cierre a mano. */
export default function ToastView({ toast, onDismiss }: { toast: Toast | null; onDismiss: () => void }) {
  return <AnimatePresence>{toast && <motion.div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{toast.tone === 'error' ? <Info size={17} /> : <Check size={17} />}<span>{toast.text}</span><button onClick={onDismiss} aria-label="Cerrar aviso"><X size={15} /></button></motion.div>}</AnimatePresence>;
}
