import { useEffect, useRef } from 'react';

export interface ShortcutOptions {
  practice: boolean;
  searchOpen: boolean;
  helpOpen: boolean;
  fenOpen: boolean;
  expandedBoard: boolean;
  ply: number;
  totalPly: number;
  jumpTo: (ply: number) => void;
  togglePlayback: () => void;
  toggleExpanded: () => void;
  /** Cierra ayuda y FEN, pero no el buscador: es lo que hacen los atajos de abrir búsqueda. */
  closeAuxiliary: () => void;
  toggleSearch: () => void;
  openSearch: () => void;
  /** Cierra todo lo que esté abierto, incluido el menú móvil. */
  closeAll: () => void;
}

/**
 * Atajos de teclado de la aplicación. El manejador se registra una sola vez y
 * siempre lee el estado más reciente mediante una referencia: así no hay cierres
 * obsoletos cuando cambian ply, moves o el modo de estudio.
 */
export function useKeyboardShortcuts(options: ShortcutOptions) {
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const {
        practice, searchOpen, helpOpen, fenOpen, expandedBoard, ply, totalPly,
        jumpTo, togglePlayback, toggleExpanded,
        closeAuxiliary, toggleSearch, openSearch, closeAll,
      } = optionsRef.current;
      const target = event.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); closeAuxiliary(); toggleSearch(); return;
      }
      if (event.key === '/' && !typing) {
        event.preventDefault(); closeAuxiliary(); openSearch(); return;
      }
      if (event.key === 'Escape') { closeAll(); if (expandedBoard) toggleExpanded(); return; }
      if (typing || searchOpen || helpOpen || fenOpen || practice) return;

      if (event.key === 'ArrowLeft') { event.preventDefault(); jumpTo(ply - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); jumpTo(ply + 1); }
      if (event.key === 'Home') { event.preventDefault(); jumpTo(0); }
      if (event.key === 'End') { event.preventDefault(); jumpTo(totalPly); }
      if (event.code === 'Space' && target.tagName !== 'BUTTON' && target.tagName !== 'A') {
        event.preventDefault(); togglePlayback();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}
