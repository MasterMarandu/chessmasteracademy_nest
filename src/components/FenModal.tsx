import Modal from './Modal';

/** Reserva cuando el navegador no deja copiar al portapapeles: el FEN a mano. */
export default function FenModal({ fen, onClose }: { fen: string; onClose: () => void }) {
  return <Modal title="Copia esta posición" onClose={onClose}>
    <p className="modal-intro">Tu navegador no permite copiar automáticamente. Selecciona este FEN y cópialo.</p>
    <input className="fen-input" data-autofocus readOnly value={fen} onFocus={(event) => event.target.select()} aria-label="Posición en formato FEN" />
  </Modal>;
}
