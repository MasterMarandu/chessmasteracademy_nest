import { ArrowRight, GitBranch, Shield, Bookmark } from 'lucide-react';
import Modal from './Modal';
import { exercises, italianLines, libraryErrors, variants } from '../data/evans';

/** Cómo funciona la biblioteca: método, atajos y alcance del contenido. */
export default function HelpModal({ onClose }: { onClose: () => void }) {
  return <Modal title="Menos memoria. Más ajedrez." onClose={onClose}>
    <p className="modal-intro">Evans es tu espacio para entender una apertura, no solo para repetir sus jugadas. El Giuoco Piano es el tronco; el gambito Evans, su rama más ambiciosa.</p>
    <div className="help-steps">
      <div><GitBranch size={21} /><div><h3>Explora una idea</h3><p>Elige una variante, avanza con las flechas o reproduce la línea. Puedes hacer movimientos legales para investigar por tu cuenta.</p></div></div>
      <div><Shield size={21} /><div><h3>Mira los dos lados</h3><p>Cada línea explica los planes de ambos bandos y el detalle táctico que no debes pasar por alto.</p></div></div>
      <div><Bookmark size={21} /><div><h3>Construye tu repertorio</h3><p>Guarda variantes, practica los {exercises.length} ejercicios y exporta tus líneas comentadas en PGN. El progreso se conserva en este navegador, sin cuenta.</p></div></div>
    </div>
    <div className="keyboard-help"><span><kbd>←</kbd><kbd>→</kbd>Recorrer jugadas</span><span><kbd>Espacio</kbd>Reproducir</span><span><kbd>/</kbd>Buscar</span></div>
    <div className="library-info">
      <h3>Una biblioteca para aprender</h3>
      <p>Incluye las {italianLines.length} líneas del Giuoco Piano y las {variants.length} variantes del gambito Evans con sus alternativas, no todas las ramas teóricas posibles. Las líneas son ejemplos didácticos, no victorias forzadas. No se utiliza un motor de evaluación.</p>
      <p>{libraryErrors.length === 0 ? 'Todas las secuencias de esta biblioteca pasan la validación de movimientos legales de chess.js.' : `Se detectaron ${libraryErrors.length} líneas pendientes de revisión.`}</p>
      <div className="source-links"><a href="https://en.wikipedia.org/wiki/Evans_Gambit" target="_blank" rel="noreferrer">Teoría y nomenclatura<ArrowRight size={12} /></a><a href="https://www.365chess.com/eco/C52_Evans_gambit_Lasker_defence" target="_blank" rel="noreferrer">Defensa Lasker<ArrowRight size={12} /></a></div>
      <p className="art-credit">Piezas adaptadas del conjunto de <a href="https://commons.wikimedia.org/wiki/User:Cburnett" target="_blank" rel="noreferrer">Cburnett</a>, con cambios de color y trazado. <a href="/chesspieces-license.txt" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</p>
    </div>
  </Modal>;
}
