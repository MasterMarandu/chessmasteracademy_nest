import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square, type PieceSymbol } from 'chess.js';
import { AnimatePresence, motion } from 'framer-motion';
import ChessPiece from './ChessPiece';
import { spanishSan } from '../data/evans';

interface Props {
  game: Chess;
  flipped: boolean;
  onMove: (from: Square, to: Square, promotion?: PieceSymbol) => void;
  disabled?: boolean;
  hintSquare?: Square;
}

const pieceNames = { p: 'peón', n: 'caballo', b: 'alfil', r: 'torre', q: 'dama', k: 'rey' };

export default function ChessBoard({ game, flipped, onMove, disabled = false, hintSquare }: Props) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const fen = game.fen();
  useEffect(() => { setSelected(null); setPromotion(null); }, [fen]);

  const history = game.history({ verbose: true });
  const lastMove = history[history.length - 1];
  const legalMoves = selected ? game.moves({ square: selected, verbose: true }) : [];

  const squareCenter = (square: string) => {
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]) - 1;
    return { x: (flipped ? 7 - file : file) + 0.5, y: (flipped ? rank : 7 - rank) + 0.5 };
  };
  const arrow = (() => {
    if (!lastMove) return null;
    const from = squareCenter(lastMove.from);
    const to = squareCenter(lastMove.to);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    return {
      from, to,
      x2: to.x - Math.cos(angle) * 0.3,
      y2: to.y - Math.sin(angle) * 0.3,
      color: lastMove.color === 'w' ? '#4d7c33' : '#233219',
    };
  })();
  const legalTargets = new Set(legalMoves.map((move) => move.to));
  const squares = Array.from({ length: 64 }, (_, index) => {
    const file = flipped ? 7 - index % 8 : index % 8;
    const rank = flipped ? Math.floor(index / 8) + 1 : 8 - Math.floor(index / 8);
    return `${'abcdefgh'[file]}${rank}` as Square;
  });

  // Stable identities let pieces glide between squares, including castling.
  const identities = useMemo(() => {
    const ids: Partial<Record<Square, string>> = {};
    new Chess().board().flat().forEach((piece) => { if (piece) ids[piece.square] = piece.square; });
    for (const move of game.history({ verbose: true })) {
      ids[move.to] = ids[move.from];
      delete ids[move.from];
      if (move.isEnPassant()) delete ids[`${move.to[0]}${move.from[1]}` as Square];
      if (move.isKingsideCastle() || move.isQueensideCastle()) {
        const rank = move.color === 'w' ? '1' : '8';
        const from = `${move.isKingsideCastle() ? 'h' : 'a'}${rank}` as Square;
        const to = `${move.isKingsideCastle() ? 'f' : 'd'}${rank}` as Square;
        ids[to] = ids[from];
        delete ids[from];
      }
    }
    return ids;
  }, [game]);

  function attemptMove(from: Square, to: Square) {
    if (disabled || from === to) return;
    const possible = game.moves({ square: from, verbose: true }).filter((move) => move.to === to);
    if (!possible.length) { setSelected(null); return; }
    if (possible.some((move) => move.promotion)) { setPromotion({ from, to }); return; }
    onMove(from, to);
    setSelected(null);
  }

  function clickSquare(square: Square) {
    if (disabled) return;
    const piece = game.get(square);
    if (selected && legalTargets.has(square)) { attemptMove(selected, square); return; }
    setSelected(piece?.color === game.turn() && selected !== square ? square : null);
  }

  return <div className="chessboard" role="group" aria-label={`Tablero de ajedrez. Juegan ${game.turn() === 'w' ? 'blancas' : 'negras'}.`}>
    <div className="board-squares">
      {squares.map((square, index) => {
        const piece = game.get(square);
        const light = (Math.floor(index / 8) + index % 8) % 2 === 0;
        const last = lastMove?.from === square || lastMove?.to === square;
        const check = piece?.type === 'k' && piece.color === game.turn() && game.inCheck();
        return <button key={square} type="button" data-square={square}
          aria-label={`${square}${piece ? `, ${pieceNames[piece.type]} de ${piece.color === 'w' ? 'blancas' : 'negras'}` : ', vacía'}${legalTargets.has(square) ? ', movimiento disponible' : ''}`}
          aria-pressed={selected === square}
          className={`board-square ${light ? 'light' : 'dark'}${last ? ' last-move' : ''}${selected === square ? ' selected' : ''}${hintSquare === square ? ' hint-square' : ''}${check ? ' in-check' : ''}`}
          onClick={() => clickSquare(square)}
          draggable={!disabled && piece?.color === game.turn()}
          onDragStart={(event) => {
            if (disabled || piece?.color !== game.turn()) { event.preventDefault(); return; }
            event.dataTransfer.setData('text/plain', square);
            event.dataTransfer.effectAllowed = 'move';
            const pieceElement = event.currentTarget.closest('.chessboard')?.querySelector<HTMLElement>(`[data-piece-square="${square}"]`);
            if (pieceElement) {
              const bounds = pieceElement.getBoundingClientRect();
              event.dataTransfer.setDragImage(pieceElement, bounds.width / 2, bounds.height / 2);
            }
            setSelected(square);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = event.dataTransfer.getData('text/plain');
            if (/^[a-h][1-8]$/.test(from)) attemptMove(from as Square, square);
          }}>
          {index % 8 === 0 && <span className="rank-label">{square[1]}</span>}
          {index >= 56 && <span className="file-label">{square[0]}</span>}
          {legalTargets.has(square) && <span className={piece ? 'legal-capture' : 'legal-dot'} />}
        </button>;
      })}
    </div>
    <svg className="arrow-layer" viewBox="0 0 8 8" aria-hidden="true">
      <defs>
        <marker id="evans-arrow-head" viewBox="0 0 10 10" refX="6.4" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto-start-reverse">
          <path d="M0 .8 9 5 0 9.2z" fill={arrow?.color ?? 'transparent'} />
        </marker>
      </defs>
      {arrow && (
        <motion.line
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}
          x1={arrow.from.x} y1={arrow.from.y} x2={arrow.x2} y2={arrow.y2}
          stroke={arrow.color} strokeWidth="0.3" strokeLinecap="round" markerEnd="url(#evans-arrow-head)"
        />
      )}
    </svg>
    <p className="sr-only" aria-live="polite">{lastMove ? `Última jugada: ${spanishSan(lastMove.san)}.` : 'Sin jugadas todavía.'}</p>
    <div className="board-pieces" aria-hidden="true">
      <AnimatePresence initial={false}>
        {game.board().flat().filter((piece) => piece !== null).map((piece) => {
          const file = piece.square.charCodeAt(0) - 97;
          const rank = Number(piece.square[1]) - 1;
          const left = (flipped ? 7 - file : file) * 12.5;
          const top = (flipped ? rank : 7 - rank) * 12.5;
          return <motion.div key={identities[piece.square] || `${piece.color}-${piece.square}`} className="board-piece" data-piece-square={piece.square}
            initial={false} animate={{ left: `${left}%`, top: `${top}%`, opacity: 1 }} exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 390, damping: 34, opacity: { duration: 0.12 } }}>
            <ChessPiece type={piece.type} color={piece.color} />
          </motion.div>;
        })}
      </AnimatePresence>
    </div>
    {promotion && <div className="promotion-overlay" role="dialog" aria-modal="true" aria-label="Elige una pieza para promocionar" onKeyDown={(event) => { if (event.key === 'Escape') setPromotion(null); }}>
      <div className="promotion-dialog"><h3>Elige tu pieza</h3><div className="promotion-options">
        {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((type) => <button key={type} autoFocus={type === 'q'} aria-label={`Promocionar a ${pieceNames[type]}`} onClick={() => { onMove(promotion.from, promotion.to, type); setPromotion(null); }}><ChessPiece type={type} color={game.turn()} /></button>)}
      </div><button className="text-button" onClick={() => setPromotion(null)}>Cancelar</button></div>
    </div>}
  </div>;
}