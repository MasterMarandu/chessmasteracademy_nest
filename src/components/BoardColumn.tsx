import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Lightbulb, Maximize2,
  Minimize2, MousePointer2, Pause, Play, RotateCcw,
} from 'lucide-react';
import ChessBoard from './ChessBoard';
import IconButton from './IconButton';
import { spanishSan } from '../data/evans.ts';
import type { StudySession } from '../hooks/useStudySession.ts';

function MoveStrip({ moves, ply, onSelect, disabled = false }: { moves: string[]; ply: number; onSelect: (ply: number) => void; disabled?: boolean }) {
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const active = strip.current?.querySelector<HTMLElement>('[aria-current="step"]');
    if (active && strip.current) strip.current.scrollTo({ left: active.offsetLeft - strip.current.clientWidth / 2 + 25, behavior: 'smooth' });
  }, [ply]);
  return <div ref={strip} className="move-strip" aria-label="Secuencia de jugadas">
    {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => <span className="move-pair" key={i}>
      <span className="move-number">{i + 1}.</span>
      {[i * 2, i * 2 + 1].filter((index) => index < moves.length).map((index) => <button key={index} disabled={disabled} className={ply === index + 1 ? 'current-move' : ''} aria-current={ply === index + 1 ? 'step' : undefined} aria-label={`Jugada ${i + 1}, ${index % 2 === 0 ? 'blancas' : 'negras'}: ${spanishSan(moves[index])}`} onClick={() => onSelect(index + 1)}>{spanishSan(moves[index])}</button>)}
    </span>)}
  </div>;
}

/** Tablero, lista de jugadas, transporte y anotación: la tarea principal de la aplicación. */
export default function BoardColumn({ session }: { session: StudySession }) {
  const {
    boardRef, boardTitle, boardNote, gambitMoment, game, flipped, practice, exerciseFinished,
    hintSquare, moves, ply, playing, expandedBoard, orientation, studySide,
    playMove, jumpTo, reset, togglePlayback, toggleExpanded, rotate, chooseSide,
    exercise, feedback, isMode,
  } = session;
  const freeAnalysis = isMode('free');
  const defenseLine = isMode('defense');

  return <motion.section ref={boardRef} className="board-column" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }} aria-label="Tablero interactivo">
    <div className="board-heading">
      <h2>{boardTitle}</h2>
      <div className="board-heading-right">
        <span className={`turn-pill ${game.turn() === 'w' ? 'is-white' : 'is-black'}`}><span className="pill-dot" /><span>{game.isCheckmate() ? 'Jaque mate' : game.isDraw() ? 'Tablas' : `Juegan ${game.turn() === 'w' ? 'las blancas' : 'las negras'}${game.inCheck() ? ' · jaque' : ''}`}</span></span>
        <div className="side-switch" role="group" aria-label="Lado con el que estudias: orienta el tablero y cambia el plan que se muestra">
          <button type="button" aria-pressed={studySide === 'white'} title="Estudiar y leer los planes desde las blancas" onClick={() => chooseSide('white')}><span className="side-dot white" />Blancas</button>
          <button type="button" aria-pressed={studySide === 'black'} title="Estudiar y leer los planes desde las negras" onClick={() => chooseSide('black')}><span className="side-dot black" />Negras</button>
        </div>
      </div>
    </div>
    {practice && <div className={`mobile-exercise-prompt ${feedback === 'correct' ? 'is-correct' : ''}`}><span>{exerciseFinished ? feedback === 'correct' ? '¡Esa es la idea!' : 'La solución' : exercise.title}</span><p>{exerciseFinished ? exercise.explanation : feedback === 'wrong' ? 'Esa jugada es legal, pero no resuelve el objetivo. Vuelve a intentarlo.' : exercise.prompt}</p></div>}
    <div className="board-frame"><ChessBoard game={game} flipped={flipped} onMove={playMove} disabled={practice && exerciseFinished} hintSquare={hintSquare} /><div className="board-dock"><MoveStrip moves={moves} ply={ply} onSelect={jumpTo} disabled={practice} /><div className="board-controls"><IconButton label="Volver a la posición del estudio" onClick={reset}><RotateCcw size={17} /></IconButton><div className="transport-controls"><IconButton label="Primera posición" onClick={() => jumpTo(0)} disabled={practice || ply === 0}><ChevronsLeft size={19} /></IconButton><IconButton label="Jugada anterior (flecha izquierda)" onClick={() => jumpTo(ply - 1)} disabled={practice || ply === 0}><ChevronLeft size={21} /></IconButton><IconButton label={playing ? 'Pausar reproducción' : 'Reproducir la línea'} onClick={togglePlayback} disabled={practice} className="play-button">{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</IconButton><IconButton label="Jugada siguiente (flecha derecha)" onClick={() => jumpTo(ply + 1)} disabled={practice || ply >= moves.length}><ChevronRight size={21} /></IconButton><IconButton label="Última posición" onClick={() => jumpTo(moves.length)} disabled={practice || ply >= moves.length}><ChevronsRight size={19} /></IconButton></div><div className="board-view-controls"><IconButton label={orientation ? 'Volver a la orientación del lado de estudio' : 'Girar el tablero (solo orientación)'} onClick={rotate}><ArrowDownUp size={17} /></IconButton><IconButton label={expandedBoard ? 'Reducir tablero' : 'Ampliar tablero'} onClick={toggleExpanded}>{expandedBoard ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</IconButton></div></div></div></div>
    <div className="board-hint"><MousePointer2 size={12} /><span>Mueve las piezas o usa las flechas. La saeta marca la última jugada.</span><span className="board-key-hints"><kbd>←</kbd><kbd>→</kbd></span></div>
    {(freeAnalysis || defenseLine) && <div className="analysis-status"><span>{freeAnalysis ? 'Estás en análisis libre' : 'Viendo la defensa alternativa'}</span><button onClick={reset}>Volver al estudio<RotateCcw size={13} /></button></div>}
    <div className="board-annotation"><span className="annotation-icon"><Lightbulb size={22} strokeWidth={1.5} /></span><div><span className="small-label">{practice ? 'APRENDE HACIENDO' : freeAnalysis ? 'TU PROPIA EXPLORACIÓN' : gambitMoment ? 'LA IDEA DETRÁS DEL SACRIFICIO' : 'LA IDEA DE ESTA POSICIÓN'}</span><h3>{gambitMoment ? 'Un peón por la iniciativa.' : practice ? exerciseFinished ? 'Entender es recordar.' : 'Mira, piensa, juega.' : ply === 0 ? 'Todo empieza aquí.' : `${Math.ceil(ply / 2)}${ply % 2 === 0 ? '...' : '.'} ${spanishSan(moves[ply - 1] || '')}`}</h3><p>{boardNote}</p></div></div>
  </motion.section>;
}
