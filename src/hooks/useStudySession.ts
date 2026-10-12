import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { Move, PieceSymbol, Square } from 'chess.js';
import {
  allLessons, BASE, baseNotes, exercises, italianNotes, makeGame, TRUNK, type Family, type Lesson,
} from '../data/evans.ts';
import {
  INITIAL_SESSION, isFlipped, isPractice, sessionReducer,
  type Feedback, type SessionMode, type SessionState, type Side, type View,
} from '../state/session.ts';
import type { AppLocation } from '../state/location.ts';

interface Options {
  /** Estado inicial: permite arrancar directamente en el enlace de la barra de direcciones. */
  initial?: SessionState;
  /** Se llama cuando se recorre una línea hasta el final. */
  onLineCompleted?: (lessonId: string) => void;
  /** Se llama al resolver un ejercicio. */
  onExerciseSolved?: (exerciseId: string) => void;
  onToast?: (tone: 'ok' | 'error', text: string) => void;
}

export function useStudySession({ initial, onLineCompleted, onExerciseSolved, onToast }: Options = {}) {
  const [state, dispatch] = useReducer(sessionReducer, initial ?? INITIAL_SESSION);
  const boardRef = useRef<HTMLElement>(null);

  const lesson = allLessons.find((item) => item.id === state.lessonId) ?? null;
  // Fuera del entrenamiento se usa el primer ejercicio como valor por defecto:
  // así los paneles no tienen que comprobar null en cada uso.
  const exercise = exercises[state.mode.kind === 'practice' ? state.mode.index : 0];
  const flipped = isFlipped(state);
  const practice = isPractice(state);
  const exerciseFinished = state.mode.kind === 'practice'
    && (state.mode.feedback === 'correct' || state.mode.feedback === 'revealed');

  const game = useMemo(() => {
    // Último recurso ante datos corruptos: la app sigue usable en la posición base.
    try { return makeGame(state.moves, state.ply); }
    catch { return makeGame(BASE, BASE.length); }
  }, [state.moves, state.ply]);

  const hintSquare = useMemo((): Square | undefined => {
    if (state.mode.kind !== 'practice' || !state.mode.hint || exerciseFinished) return undefined;
    const current = exercises[state.mode.index];
    return makeGame(current.moves).move(current.answer).from;
  }, [state.mode, exerciseFinished]);

  // Reproducción automática.
  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.playing]);

  useEffect(() => {
    if (state.playing && state.ply >= state.moves.length) dispatch({ type: 'pause' });
  }, [state.playing, state.ply, state.moves.length]);

  // Una línea cuenta como recorrida cuando se llega al final de verdad.
  const completes = lesson !== null && state.mode.kind === 'study'
    && state.ply === state.moves.length && state.moves.length === lesson.moves.length
    && lesson.startPly < lesson.moves.length;
  const completionRef = useRef(onLineCompleted);
  useEffect(() => { completionRef.current = onLineCompleted; });
  useEffect(() => {
    if (completes && lesson) completionRef.current?.(lesson.id);
  }, [completes, lesson]);

  function revealBoardOnMobile() {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    window.requestAnimationFrame(() => boardRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    }));
  }

  function navigate(view: View) {
    dispatch({ type: 'navigate', view });
  }

  function openLesson(next: Lesson, side?: Side) {
    try { makeGame(next.moves); } catch {
      onToast?.('error', 'Esta línea no está disponible. Prueba otra variante.');
      return;
    }
    dispatch({ type: 'openLesson', lesson: next, side });
    revealBoardOnMobile();
  }

  function startExercise(index = 0) {
    const target = ((index % exercises.length) + exercises.length) % exercises.length;
    const moves = exercises[target].moves;
    dispatch({
      type: 'openPractice', index: target, moves,
      side: makeGame(moves).turn() === 'b' ? 'black' : 'white',
    });
    revealBoardOnMobile();
  }

  function loadDefense() {
    if (!lesson?.defenseMoves) return;
    const defense = lesson.defenseMoves;
    const divergence = lesson.moves.findIndex((move, index) => move !== defense[index]);
    const start = divergence < 0 ? lesson.startPly : divergence;
    dispatch({
      type: 'loadDefense', moves: defense, ply: start,
      side: makeGame(defense, start).turn() === 'b' ? 'black' : 'white',
    });
    onToast?.('ok', 'Defensa alternativa cargada. Avanza para ver la continuación.');
    revealBoardOnMobile();
  }

  function reset() {
    if (state.mode.kind === 'practice') { startExercise(state.mode.index); return; }
    const opening = state.view === 'italian' ? TRUNK : BASE;
    dispatch({ type: 'reset', moves: lesson?.moves ?? opening, ply: lesson?.startPly ?? opening.length });
  }

  function jumpTo(ply: number) { dispatch({ type: 'jumpTo', ply }); }

  /** Coloca en el tablero una posición concreta sin cambiar de lección. */
  function showPosition(nextMoves: string[], nextPly: number) {
    dispatch({ type: 'selectLine', lessonId: state.lessonId, moves: nextMoves, ply: nextPly });
  }

  function togglePlayback() { dispatch({ type: 'togglePlayback' }); }

  function revealAnswer() {
    const current = exercise;
    if (!current) return;
    dispatch({ type: 'revealAnswer', moves: [...current.moves, current.answer], ply: current.moves.length + 1 });
  }

  function openTreeLine(path: string[], nodePly: number) {
    if (!path.length) { dispatch({ type: 'selectLine', lessonId: null, moves: TRUNK, ply: 0 }); return; }
    const key = path.join();
    const match = allLessons
      .filter((item) => item.moves.slice(0, path.length).join() === key)
      .sort((a, b) => (a.kind === 'game' ? 1 : 0) - (b.kind === 'game' ? 1 : 0)
        || Math.abs(a.moves.length - path.length) - Math.abs(b.moves.length - path.length))[0] ?? null;
    dispatch({
      type: 'selectLine', lessonId: match?.id ?? null, moves: match?.moves ?? path, ply: nodePly,
      planSide: nodePly % 2 === 0 ? 'black' : 'white',
    });
    revealBoardOnMobile();
  }

  function playMove(from: Square, to: Square, promotion: PieceSymbol = 'q') {
    if (practice && exerciseFinished) return;
    const probe = makeGame(state.moves, state.ply);
    let move: Move;
    // Sólo la validación de legalidad queda dentro del try: un fallo propio
    // (por ejemplo, una respuesta mal escrita en los datos) debe verse, no disfrazarse.
    try { move = probe.move({ from, to, promotion }); }
    catch {
      onToast?.('error', 'Esa jugada no es legal en esta posición.');
      return;
    }

    if (state.mode.kind === 'practice') {
      const current = exercises[state.mode.index];
      const expected = makeGame(current.moves).move(current.answer);
      if (move.san !== expected.san) { dispatch({ type: 'practiceWrong' }); return; }
      dispatch({ type: 'practiceCorrect', moves: [...current.moves, move.san], ply: current.moves.length + 1 });
      onExerciseSolved?.(current.id);
      return;
    }

    const expected = state.moves[state.ply] ? makeGame(state.moves, state.ply).move(state.moves[state.ply]).san : null;
    if (move.san === expected) { dispatch({ type: 'advance', san: move.san }); return; }
    dispatch({ type: 'exploreFreely', moves: [...state.moves.slice(0, state.ply), move.san], ply: state.ply + 1 });
    if (state.mode.kind !== 'free') {
      onToast?.('ok', 'Análisis libre: puedes explorar movimientos de ambos bandos.');
    }
  }

  /** Aplica un enlace de la barra de direcciones al estado de estudio. */
  function restore(location: AppLocation) {
    if (location.exerciseIndex !== null) { startExercise(location.exerciseIndex); return; }
    if (location.lessonId) {
      const found = allLessons.find((item) => item.id === location.lessonId);
      if (found) { openLesson(found); return; }
    }
    navigate(location.view);
  }

  // Rótulo y nota del tablero: un switch exhaustivo sobre el modo, no una cadena de ternarios.
  const boardTitle = ((): string => {
    switch (state.mode.kind) {
      case 'practice': return `Ejercicio ${state.mode.index + 1}`;
      case 'free': return 'Análisis libre';
      case 'defense': return 'La defensa alternativa';
      default:
        if (lesson) return lesson.title;
        if (state.view === 'italian') return 'La apertura italiana';
        if (state.view === 'ideas' && state.ply > BASE.length) return 'La idea sobre el tablero';
        return 'Posición inicial del Evans';
    }
  })();

  const boardNote = ((): string => {
    const current = exercise;
    switch (state.mode.kind) {
      case 'free':
        return 'Estás explorando tu propia línea. Puedes mover ambos bandos, retroceder o volver al estudio original. No hay un motor jugando.';
      case 'defense':
        return lesson?.defendingSide === 'white' ? lesson.whitePlan : lesson?.blackPlan ?? '';
      case 'practice':
        if (!current) return '';
        return exerciseFinished ? current.explanation
          : 'Observa la posición y juega en el tablero. La respuesta está en la idea, no en memorizar.';
      default:
        return lesson?.notes[state.ply]
          || (state.view === 'italian' ? italianNotes[state.ply] : undefined)
          || baseNotes[state.ply]
          || (state.view === 'ideas' ? allLessons.find((item) => item.id === 'main')?.notes[state.ply] : undefined)
          || 'Observa el centro, la seguridad de los reyes y las piezas que todavía necesitan desarrollarse.';
    }
  })();

  // El momento del gambito sólo existe donde el gambito existe.
  const gambitMoment = state.ply === BASE.length && state.mode.kind === 'study'
    && state.view !== 'italian' && lesson?.family !== 'italian';

  return {
    boardRef,
    // estado
    view: state.view, lesson, moves: state.moves, ply: state.ply, flipped, game, mode: state.mode,
    playing: state.playing, expandedBoard: state.expandedBoard, family: state.family,
    showAll: state.showAll, planSide: state.planSide, studySide: state.studySide, orientation: state.orientation,
    exercise, exerciseIndex: state.mode.kind === 'practice' ? state.mode.index : 0,
    feedback: (state.mode.kind === 'practice' ? state.mode.feedback : 'idle') as Feedback,
    showHint: state.mode.kind === 'practice' && state.mode.hint,
    practice, exerciseFinished, hintSquare, boardTitle, boardNote, gambitMoment,
    // acciones
    navigate, openLesson, startExercise, loadDefense, reset, jumpTo, togglePlayback, revealAnswer,
    openTreeLine, playMove, showPosition, restore,
    chooseSide: (side: Side) => dispatch({ type: 'chooseSide', side }),
    rotate: () => dispatch({ type: 'rotate' }),
    setFamily: (family: Family | 'all') => dispatch({ type: 'setFamily', family }),
    toggleShowAll: () => dispatch({ type: 'toggleShowAll' }),
    setPlanSide: (side: Side) => dispatch({ type: 'setPlanSide', side }),
    toggleExpanded: () => dispatch({ type: 'toggleExpanded' }),
    toggleHint: () => dispatch({ type: 'toggleHint' }),
    isMode: (kind: SessionMode['kind']) => state.mode.kind === kind,
  };
}

export type StudySession = ReturnType<typeof useStudySession>;
