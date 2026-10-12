import { BASE, TRUNK, type Family, type Lesson } from '../data/evans.ts';

export type Side = 'white' | 'black';
export type Feedback = 'idle' | 'wrong' | 'correct' | 'revealed';
export type View = 'italian' | 'explorer' | 'tree' | 'ideas' | 'traps' | 'defense' | 'repertoire' | 'games';

/** Modos mutuamente excluyentes: antes eran cinco booleanos que podían contradecirse. */
export type SessionMode =
  | { kind: 'study' }
  | { kind: 'free'; origin: { moves: string[]; ply: number; lessonId: string | null } }
  | { kind: 'defense' }
  | { kind: 'practice'; index: number; feedback: Feedback; hint: boolean };

export interface SessionState {
  view: View;
  lessonId: string | null;
  moves: string[];
  ply: number;
  studySide: Side;
  /** null = el tablero sigue al lado de estudio; un valor = el usuario lo giró a mano. */
  orientation: Side | null;
  mode: SessionMode;
  playing: boolean;
  expandedBoard: boolean;
  family: Family | 'all';
  showAll: boolean;
  planSide: Side;
}

export type SessionAction =
  | { type: 'navigate'; view: View }
  | { type: 'openLesson'; lesson: Lesson; side?: Side }
  | { type: 'openPractice'; index: number; moves: string[]; side: Side }
  | { type: 'loadDefense'; moves: string[]; ply: number; side: Side }
  | { type: 'selectLine'; lessonId: string | null; moves: string[]; ply: number; planSide?: Side }
  | { type: 'reset'; moves: string[]; ply: number }
  | { type: 'jumpTo'; ply: number }
  | { type: 'advance'; san: string }
  | { type: 'exploreFreely'; moves: string[]; ply: number }
  | { type: 'practiceCorrect'; moves: string[]; ply: number }
  | { type: 'practiceWrong' }
  | { type: 'revealAnswer'; moves: string[]; ply: number }
  | { type: 'togglePlayback' }
  | { type: 'pause' }
  | { type: 'tick' }
  | { type: 'chooseSide'; side: Side }
  | { type: 'rotate' }
  | { type: 'setFamily'; family: Family | 'all' }
  | { type: 'toggleShowAll' }
  | { type: 'setPlanSide'; side: Side }
  | { type: 'toggleExpanded' }
  | { type: 'toggleHint' };

export const INITIAL_SESSION: SessionState = {
  view: 'explorer',
  lessonId: null,
  moves: BASE,
  ply: BASE.length,
  studySide: 'white',
  orientation: null,
  mode: { kind: 'study' },
  playing: false,
  expandedBoard: false,
  family: 'all',
  showAll: false,
  planSide: 'white',
};

export function isFlipped(state: SessionState): boolean {
  return (state.orientation ?? state.studySide) === 'black';
}

export function isPractice(state: SessionState): boolean {
  return state.mode.kind === 'practice';
}

/** Vistas que muestran la línea abierta: entrar en ellas no la pierde. */
const LINE_VIEWS: View[] = ['tree', 'ideas'];

function changingSide(state: SessionState, side: Side): SessionState {
  return { ...state, studySide: side, orientation: null, planSide: side };
}

/** Al cambiar de línea o de modo se abandona cualquier exploración anterior. */
function freshLine(state: SessionState, line: Partial<SessionState>): SessionState {
  return { ...state, playing: false, mode: { kind: 'study' }, ...line };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'navigate': {
      // El árbol y las ideas muestran la línea abierta: no se pierde el contexto.
      if (LINE_VIEWS.includes(action.view) && state.lessonId) {
        return { ...state, view: action.view, playing: false, expandedBoard: false };
      }
      const opening = action.view === 'italian' ? TRUNK : BASE;
      return changingSide({
        ...state, view: action.view, lessonId: null, moves: opening, ply: opening.length,
        mode: { kind: 'study' }, playing: false, expandedBoard: false, family: 'all', showAll: false,
      }, action.view === 'defense' ? 'black' : 'white');
    }

    case 'openLesson': {
      const side = action.side ?? (state.view === 'defense' ? 'black' : 'white');
      const view: View = action.lesson.kind === 'trap' ? 'traps'
        : action.lesson.kind === 'game' ? 'games'
        : (state.view === 'defense' || state.view === 'repertoire' || state.view === 'italian') ? state.view
        : 'explorer';
      return changingSide({
        ...state, view, lessonId: action.lesson.id, moves: action.lesson.moves, ply: action.lesson.startPly,
        mode: { kind: 'study' }, playing: false, expandedBoard: false,
      }, side);
    }

    case 'openPractice':
      return changingSide({
        ...state, view: 'explorer', lessonId: null, moves: action.moves, ply: action.moves.length,
        mode: { kind: 'practice', index: action.index, feedback: 'idle', hint: false },
        playing: false, expandedBoard: false,
      }, action.side);

    case 'loadDefense':
      return changingSide({
        ...state, moves: action.moves, ply: action.ply,
        mode: { kind: 'defense' }, playing: false,
      }, action.side);

    case 'selectLine':
      return freshLine(state, {
        lessonId: action.lessonId, moves: action.moves, ply: action.ply,
        planSide: action.planSide ?? state.planSide,
      });

    case 'reset':
      return freshLine(state, { moves: action.moves, ply: action.ply });

    case 'jumpTo':
      return { ...state, playing: false, ply: Math.max(0, Math.min(state.moves.length, action.ply)) };

    case 'advance':
      return { ...state, playing: false, ply: state.ply + 1 };

    case 'exploreFreely':
      // Un modo cada vez: explorar por tu cuenta abandona la defensa alternativa.
      return {
        ...state, moves: action.moves, ply: action.ply, playing: false,
        mode: state.mode.kind === 'free'
          ? state.mode
          : { kind: 'free', origin: { moves: state.moves, ply: state.ply, lessonId: state.lessonId } },
      };

    case 'practiceCorrect':
      return state.mode.kind === 'practice'
        ? { ...state, moves: action.moves, ply: action.ply, mode: { ...state.mode, feedback: 'correct', hint: false } }
        : state;

    case 'practiceWrong':
      return state.mode.kind === 'practice' ? { ...state, mode: { ...state.mode, feedback: 'wrong' } } : state;

    case 'revealAnswer':
      return state.mode.kind === 'practice'
        ? { ...state, moves: action.moves, ply: action.ply, mode: { ...state.mode, feedback: 'revealed', hint: false } }
        : state;

    case 'togglePlayback':
      if (isPractice(state)) return state;
      return state.ply >= state.moves.length
        ? { ...state, ply: 0, playing: true }
        : { ...state, playing: !state.playing };

    case 'pause':
      return { ...state, playing: false };

    case 'tick':
      return { ...state, ply: Math.min(state.ply + 1, state.moves.length) };

    case 'chooseSide':
      return changingSide(state, action.side);

    case 'rotate':
      return { ...state, orientation: state.orientation ? null : (isFlipped(state) ? 'white' : 'black') };

    case 'setFamily':
      return { ...state, family: action.family, showAll: false };

    case 'toggleShowAll':
      return { ...state, showAll: !state.showAll };

    case 'setPlanSide':
      return { ...state, planSide: action.side };

    case 'toggleExpanded':
      return { ...state, expandedBoard: !state.expandedBoard };

    case 'toggleHint':
      return state.mode.kind === 'practice' ? { ...state, mode: { ...state.mode, hint: !state.mode.hint } } : state;

    default:
      return state;
  }
}
