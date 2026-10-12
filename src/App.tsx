import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, CheckCheck,
  ChevronDown, ChevronRight, CircleHelp, Copy, Crown, Download, GitBranch, Info, Lightbulb, ListTree,
  Menu, MousePointer2, Network, Play, RotateCcw,
  Search, Shield, Target, X, Zap,
} from 'lucide-react';
import BoardColumn from './components/BoardColumn';
import { KnightMark } from './components/ChessPiece';
import Modal from './components/Modal';
import VariationTree from './components/VariationTree';
import { useStudySession } from './hooks/useStudySession';
import LessonList from './panels/LessonList';
import type { StudyUi } from './panels/types';
import type { View } from './state/session';
import {
  allLessons, BASE, ecoFor, exercises, games, italianLines, LESSON_IDS,
  lessonById, libraryErrors, makeGame, normalizeSearch, sharpness, sharpnessLabel, spanishSan, TRUNK,
  traps, variants, type Lesson,
} from './data/evans';

// Etiqueta de la miga de pan: dónde estás dentro de la biblioteca.
const SECTION_LABELS: Record<View, string> = {
  italian: 'Apertura Italiana', explorer: 'Gambito Evans', tree: 'Árbol de variantes',
  ideas: 'Ideas y planes', traps: 'Patrones tácticos', defense: 'Defensa del Evans',
  repertoire: 'Mi repertorio', games: 'Partidas clásicas',
};

// Lecciones referenciadas por la interfaz: por identificador, nunca por posición en el array.
const MAIN_LINE = lessonById(LESSON_IDS.main);
const LASKER = lessonById(LESSON_IDS.lasker);
const MODERN = lessonById(LESSON_IDS.modern);
const DECLINED = lessonById(LESSON_IDS.declined);
const COMPROMISED = lessonById(LESSON_IDS.compromised);
const LESSON_IDS_SET = new Set(allLessons.map((lesson) => lesson.id));
const EXERCISE_IDS_SET = new Set(exercises.map((exercise) => exercise.id));
// Ply de la posición con el centro montado (d4-e4) en la línea principal,
// y de la jugada 5. c3 que gana un tiempo sobre el alfil.
const CENTRE_PLY = 15;
const TEMPO_PLY = BASE.length + 2;
const FIRST_TRAP_EXERCISE = Math.max(0, exercises.findIndex((exercise) => exercise.topic === 'trap'));

function useStoredList(key: string, valid: Set<string>) {  const [value, setValue] = useState<string[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      // Se descartan los identificadores que ya no existen en la biblioteca.
      return Array.isArray(stored)
        ? stored.filter((item): item is string => typeof item === 'string' && valid.has(item))
        : [];
    } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Study remains available when storage is blocked. */ } }, [key, value]);
  return [value, setValue] as const;
}

function IconButton({ label, children, onClick, disabled, className = '' }: {
  label: string; children: ReactNode; onClick: () => void; disabled?: boolean; className?: string;
}) {
  return <button type="button" className={`icon-button ${className}`} title={label} aria-label={label} disabled={disabled} onClick={onClick}>{children}</button>;
}

function SharpnessMeter({ id, size = 'sm', label = true }: { id: string; size?: 'sm' | 'lg'; label?: boolean }) {
  const value = sharpness[id] ?? 3;
  return (
    <span className={`sharpness-wrap ${size === 'lg' ? 'sharpness-lg-wrap' : ''}`}>
      <span className={`sharpness sharpness-${size} heat-${value}`} role="img"
        aria-label={`Agudeza ${value} de 5: ${sharpnessLabel(value)}`} title={`Agudeza ${value}/5 · ${sharpnessLabel(value)}`}>
        {[1, 2, 3, 4, 5].map((step) => <i key={step} className={step <= value ? 'on' : ''} />)}
      </span>
      {label && <span className="sharpness-label">{sharpnessLabel(value)}</span>}
    </span>
  );
}

function downloadFile(content: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/x-chess-pgn;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [mobileNav, setMobileNav] = useState(false);
  const [saved, setSaved] = useStoredList('evans-repertoire-v1', LESSON_IDS_SET);
  const [completed, setCompleted] = useStoredList('evans-studied-v1', LESSON_IDS_SET);
  const [solved, setSolved] = useStoredList('evans-exercises-v1', EXERCISE_IDS_SET);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [fenOpen, setFenOpen] = useState(false);
  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  // Toda la sesión de estudio vive en el reducer: modos excluyentes, lado y orientación.
  const session = useStudySession({
    onLineCompleted: (id) => setCompleted((current) => current.includes(id) ? current : [...current, id]),
    onExerciseSolved: (id) => setSolved((current) => current.includes(id) ? current : [...current, id]),
    onToast: (tone, text) => setToast({ tone, text }),
  });
  const {
    view, lesson, moves, ply, game, expandedBoard, family, showAll, planSide,
    exercise, exerciseIndex, feedback, showHint, practice, exerciseFinished,
    navigate, openLesson: selectLesson, startExercise, loadDefense, reset: resetStudy, jumpTo,
    togglePlayback, revealAnswer, openTreeLine: selectFromTree,
    setFamily, toggleShowAll, setPlanSide, toggleExpanded, toggleHint,
  } = session;
  const defenseLine = session.isMode('defense');
  const ui: StudyUi = {
    saved, solved, completed,
    toggleSaved,
    toggleCompleted: (id) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    notify: (tone, text) => setToast({ tone, text }),
    closeSearch: () => setSearchOpen(false),
  };

  const studiedCount = allLessons.filter((item) => completed.includes(item.id)).length;
  const librarySize = allLessons.length;
  const searchResults = allLessons.filter((item) => normalizeSearch(`${item.title} ${item.subtitle} ${item.notation}`).includes(normalizeSearch(searchQuery)));

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const keyHandler = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setHelpOpen(false); setFenOpen(false); setSearchOpen((current) => !current); return; }
    if (event.key === '/' && !typing) { event.preventDefault(); setHelpOpen(false); setFenOpen(false); setSearchOpen(true); return; }
    if (event.key === 'Escape') { setSearchOpen(false); setHelpOpen(false); setFenOpen(false); setMobileNav(false); if (expandedBoard) toggleExpanded(); return; }
    if (typing || searchOpen || helpOpen || fenOpen || practice) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); jumpTo(ply - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); jumpTo(ply + 1); }
    if (event.key === 'Home') { event.preventDefault(); jumpTo(0); }
    if (event.key === 'End') { event.preventDefault(); jumpTo(moves.length); }
    if (event.code === 'Space' && target.tagName !== 'BUTTON' && target.tagName !== 'A') { event.preventDefault(); togglePlayback(); }
  };

  // El manejador se registra una sola vez y siempre lee el estado más reciente:
  // así no hay cierres obsoletos cuando cambian ply, moves o el modo de estudio.
  const keyHandlerRef = useRef(keyHandler);
  useEffect(() => { keyHandlerRef.current = keyHandler; });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandlerRef.current(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  // Las acciones de estudio viven en el hook; aquí sólo queda lo que toca la interfaz.
  function showPosition(nextMoves: string[], nextPly: number) {
    session.showPosition(nextMoves, nextPly);
  }

  function openSearchResult(item: Lesson) {
    selectLesson(item);
    setSearchOpen(false);
  }

  function toggleSaved(item: Lesson) {
    const removing = saved.includes(item.id);
    setSaved((current) => removing ? current.filter((id) => id !== item.id) : [...current, item.id]);
    setToast(removing
      ? { tone: 'ok', text: 'Variante eliminada de tu repertorio.' }
      : { tone: 'ok', text: 'Guardada en tu repertorio. Puedes volver a ella cuando quieras.' });
  }

  function buildPgn(item: Lesson | null, sequence: string[]) {
    const result = makeGame([]);
    const original = item?.moves.join() === sequence.join();
    sequence.forEach((move, index) => {
      result.move(move);
      if (original && item?.notes[index + 1]) result.setComment(item.notes[index + 1]);
    });
    // Los metadatos salen de los datos; el exportador no adivina ni miente sobre el contenido.
    result.setHeader('Event', item
      ? (original ? item.title : `Análisis libre a partir de ${item.title}`)
      : 'Análisis libre · Apertura Italiana');
    result.setHeader('White', item?.players?.white ?? 'Blancas');
    result.setHeader('Black', item?.players?.black ?? 'Negras');
    if (item?.year) result.setHeader('Date', String(item.year));
    // El código ECO sólo se declara donde está verificado: el Evans aceptado o rehusado.
    if (item && item.family !== 'italian') result.setHeader('ECO', ecoFor(sequence));
    if (original && item?.result) result.setHeader('Result', item.result);
    return result.pgn();
  }

  function exportStudy() {
    downloadFile(buildPgn(lesson, moves), `evans-${lesson?.id || 'analisis'}.pgn`);
    setToast({ tone: 'ok', text: 'Archivo PGN preparado para descargar.' });
  }

  async function copyFen() {
    try { await navigator.clipboard.writeText(game.fen()); setToast({ tone: 'ok', text: 'Posición FEN copiada al portapapeles.' }); }
    catch { setFenOpen(true); }
  }

  const tabItems: { view: View; label: string; icon: ReactNode }[] = [
    { view: 'italian', label: 'Italiana', icon: <Network size={16} /> },
    { view: 'explorer', label: 'Explorador', icon: <GitBranch size={16} /> },
    { view: 'tree', label: 'Árbol', icon: <ListTree size={16} /> },
    { view: 'ideas', label: 'Ideas y planes', icon: <Lightbulb size={16} /> },
    { view: 'traps', label: 'Celadas', icon: <Zap size={16} /> },
    { view: 'defense', label: 'Defensa', icon: <Shield size={16} /> },
  ];

  function areaProps(target: View | View[]) {
    const views = Array.isArray(target) ? target : [target];
    // Durante el entrenamiento sólo se resalta esa entrada: no hay sección activa detrás.
    const active = !practice && views.includes(view);
    return { className: active ? 'active' : '', 'aria-current': active ? 'page' as const : undefined };
  }

  function renderDetail() {
    if (!lesson) return null;
    const whiteDefender = lesson.kind === 'trap' && lesson.defendingSide === 'white';
    const attackingPlan = whiteDefender ? lesson.blackPlan : lesson.whitePlan;
    const defendingPlan = whiteDefender ? lesson.whitePlan : lesson.blackPlan;
    return <div>
      <div className="detail-topline"><button className="back-link" onClick={() => navigate(view)}><ArrowLeft size={15} />{view === 'italian' ? 'La apertura italiana' : view === 'repertoire' ? 'Mi repertorio' : lesson.kind === 'trap' ? 'Todas las celadas' : lesson.kind === 'game' ? 'Partidas clásicas' : 'Todas las variantes'}</button><span className={`level level-${lesson.level.toLowerCase()}`}>{lesson.level}</span></div>
      <div className="detail-title-row"><h2>{lesson.title}</h2><IconButton label={saved.includes(lesson.id) ? 'Quitar del repertorio' : 'Guardar en mi repertorio'} onClick={() => toggleSaved(lesson)} className={saved.includes(lesson.id) ? 'is-saved' : ''}><Bookmark size={21} fill={saved.includes(lesson.id) ? 'currentColor' : 'none'} /></IconButton></div>
      <div className="detail-meta"><p className="detail-notation">{lesson.notation}</p><p className="detail-sharp"><span>Agudeza</span><SharpnessMeter id={lesson.id} size="lg" /><em>{sharpnessLabel(sharpness[lesson.id] ?? 3)}</em></p></div>
      <p className="detail-description">{lesson.description}</p>
      <div className="plan-switch" role="group" aria-label="Plan por bando">
        <button aria-pressed={planSide === 'white'} className={planSide === 'white' ? 'active' : ''} onClick={() => setPlanSide('white')}>{whiteDefender ? <Zap size={14} /> : <span className="side-dot white" />}{whiteDefender ? 'La idea táctica' : 'Plan de blancas'}</button>
        <button aria-pressed={planSide === 'black'} className={planSide === 'black' ? 'active' : ''} onClick={() => setPlanSide('black')}><Shield size={14} />Cómo defenderte</button>
      </div>
      <AnimatePresence mode="wait"><motion.div key={planSide} className="plan-content" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
        <h3>{planSide === 'white' ? whiteDefender ? 'Reconoce la amenaza.' : 'Juega con un propósito.' : whiteDefender ? 'Evita la trampa con blancas.' : 'Neutraliza la iniciativa.'}</h3>
        <p>{planSide === 'white' ? attackingPlan : defendingPlan}</p>
        {planSide === 'black' && lesson.defenseMoves && <button className="text-button" onClick={loadDefense}><Play size={14} />Ver la defensa en el tablero<ArrowRight size={14} /></button>}
      </motion.div></AnimatePresence>
      <div className="watch-out"><span><Info size={17} /></span><div><h4>El detalle que importa</h4><p>{lesson.warning}</p></div></div>
      <div className="continuation-heading"><h3>{defenseLine ? 'La defensa alternativa' : 'La continuación'}</h3><span>Haz clic para explorar</span></div>
      <div className="detail-moves">{moves.map((move, index) => <span key={index} className="detail-move-wrap">{index % 2 === 0 && <span className="move-number">{Math.floor(index / 2) + 1}.</span>}<button onClick={() => jumpTo(index + 1)} className={ply === index + 1 ? 'active' : ''}>{spanishSan(move)}</button></span>)}</div>
      <div className="detail-actions"><button className="button button-outline" onClick={() => { setCompleted((current) => current.includes(lesson.id) ? current.filter((id) => id !== lesson.id) : [...current, lesson.id]); }}>{completed.includes(lesson.id) ? <CheckCheck size={17} /> : <Check size={17} />}{completed.includes(lesson.id) ? 'Estudiada' : 'Marcar como estudiada'}</button><IconButton label="Descargar esta línea en PGN" onClick={exportStudy}><Download size={18} /></IconButton><IconButton label="Copiar posición FEN" onClick={copyFen}><Copy size={17} /></IconButton></div>
      {lesson.source && <a className="source-link" href={lesson.source} target="_blank" rel="noreferrer">Consultar la fuente<ArrowRight size={12} /></a>}
    </div>;
  }

  function renderItalian() {
    const trunkLine = TRUNK.map((move, index) => `${index % 2 === 0 ? `${index / 2 + 1}.` : ''}${spanishSan(move)}`).join(' ');
    return <>
      <div className="panel-intro"><div className="eyebrow">EL TRONCO COMÚN</div><h2>Giuoco Piano: la casa del Evans.</h2><p>Todo empieza en 1. e4 e5 2. Cf3 Cc6 3. Ac4 Ac5. Desde esa posición, las blancas deciden el carácter de la partida.</p></div>
      <div className="italian-trunk"><span className="small-label">POSICIÓN DEL TRONCO</span><strong>{trunkLine}</strong></div>
      <div className="list-heading"><h3>Tres caminos desde la misma posición</h3><span>{italianLines.length + 1} ramas</span></div>
      <div className="italian-map">
        {italianLines.map((line) => <button key={line.id} className="italian-branch" onClick={() => selectLesson(line)}>
          <span className="italian-branch-move">{`4. ${spanishSan(line.moves[TRUNK.length])}`}</span>
          <strong>{line.title}</strong>
          <p>{line.subtitle}</p>
          <em>Estudiar la línea<ArrowRight size={12} /></em>
        </button>)}
        <button className="italian-branch is-gambit" onClick={() => navigate('explorer')}>
          <span className="italian-branch-move">4. b4</span>
          <strong>Gambito Evans</strong>
          <p>El peón se entrega a cambio de tiempo y centro. Es el corazón de esta biblioteca: {variants.length} variantes, {traps.length} celadas y {games.length} partidas clásicas.</p>
          <em>Ir al explorador del Evans<ArrowRight size={12} /></em>
        </button>
      </div>
      <p className="quiet-note"><Info size={15} />c3 y d3 conservan el material y discuten el centro; b4 lo entrega a cambio de desarrollo. Ninguna es mejor en abstracto: son estilos distintos, y cada una pide un plan diferente.</p>
      <button className="button button-outline" onClick={resetStudy}><RotateCcw size={16} />Volver al tronco en el tablero</button>
    </>;
  }

  function renderExplorer() {
    const filtered = variants.filter((item) => family === 'all' || item.family === family);
    const visible = showAll ? filtered : filtered.slice(0, 5);
    return <>
      <div className="panel-intro explorer-intro"><h2>Una apertura. Muchos caminos.</h2><p>Entiende cada respuesta. Encuentra tu forma de jugar. Las líneas se cargan directamente en el tablero.</p></div>
      <div className="list-heading"><h3>Variantes principales</h3><span>{variants.length} variantes del Evans</span></div>
      <div className="family-filter" role="group" aria-label="Filtrar variantes">{([['all', 'Todas'], ['accepted', 'Aceptado'], ['declined', 'Rehusado'], ['other', 'Otras']] as const).map(([value, label]) => <button key={value} aria-pressed={family === value} className={family === value ? 'active' : ''} onClick={() => setFamily(value)}>{label}{value === 'all' && <span>{variants.length}</span>}</button>)}</div>
      <p className="list-legend"><Info size={13} /><span><strong>Esencial · Intermedia · Avanzada</strong> indica por dónde empezar. <strong>Agudeza</strong> mide cuán forzada y táctica es la línea, de Sólida a Letal.</span></p>
      <LessonList items={visible} session={session} ui={ui} />
      {filtered.length > 5 && <button className="show-all-button" onClick={toggleShowAll}>{showAll ? 'Mostrar las esenciales' : `Ver las ${filtered.length} variantes`}<ChevronDown size={15} className={showAll ? 'rotated' : ''} /></button>}
      <div className="defense-invitation">
        <div className="defense-invitation-head"><span className="defense-invitation-icon"><Shield size={20} strokeWidth={1.7} /></span><div><strong>¿Y si juegas con negras?</strong><p>Defender el Evans no es sufrir: es devolver el peón en el momento exacto y quedarse con un desarrollo sano.</p></div></div>
        <div className="defense-invitation-grid">
          <button onClick={() => selectLesson(LASKER, 'black')}><span>Defensa Lasker</span><small>5...Aa5 6. d4 d6 · la respuesta clásica</small></button>
          <button onClick={() => selectLesson(MODERN, 'black')}><span>Defensa moderna</span><small>5...Ae7 · flexible y poco explorada</small></button>
          <button onClick={() => selectLesson(DECLINED, 'black')}><span>Gambito rehusado</span><small>4...Ab6 · sin cargar teoría pesada</small></button>
        </div>
        <button className="defense-invitation-more" onClick={() => navigate('defense')}>Ver el plan defensivo completo<ArrowRight size={15} /></button>
      </div>
    </>;
  }

  function renderPractice() {
    return <div className="practice-panel">
      <div className="eyebrow">DEL CONOCIMIENTO AL TABLERO</div><h2>Ahora te toca a ti.</h2><p className="panel-subtitle">No memorices la jugada. Descubre la idea.</p>
      <div className="exercise-progress"><span>Ejercicio {exerciseIndex + 1} de {exercises.length}</span><span>{solved.length}/{exercises.length} resueltos</span></div>
      <div className="exercise-dots">{exercises.map((item, index) => <button key={item.id} className={`${index === exerciseIndex ? 'active' : ''} ${solved.includes(item.id) ? 'solved' : ''}`} aria-label={`Ejercicio ${index + 1}: ${item.title}${solved.includes(item.id) ? ', resuelto' : ''}`} onClick={() => startExercise(index)}>{solved.includes(item.id) ? <Check size={13} /> : index + 1}</button>)}</div>
      <div className="exercise-question"><span className="small-label">{makeGame(exercise.moves).turn() === 'w' ? 'JUEGAN BLANCAS' : 'JUEGAN NEGRAS'}</span><h3>{exercise.title}</h3><p>{exercise.prompt}</p></div>
      <div aria-live="polite">
        {feedback === 'wrong' && <div className="exercise-feedback wrong"><Info size={20} /><div><strong>Hay una idea más precisa.</strong><p>La jugada es legal, pero no resuelve este ejercicio. Mira el objetivo y vuelve a intentarlo.</p></div></div>}
        {exerciseFinished && <motion.div className={`exercise-feedback ${feedback === 'correct' ? 'correct' : 'revealed'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span>{feedback === 'correct' ? <CheckCheck size={23} /> : <Lightbulb size={23} />}</span><div><strong>{feedback === 'correct' ? '¡Esa es la idea!' : 'La jugada que buscábamos'} <span className="answer-san">{spanishSan(exercise.answer)}</span></strong><p>{exercise.explanation}</p>{feedback === 'revealed' && <small>Ver la solución no cuenta como ejercicio resuelto.</small>}</div></motion.div>}
        {showHint && !exerciseFinished && <div className="hint-content"><Lightbulb size={18} /><p>{exercise.hint}</p></div>}
      </div>
      <div className="practice-actions">{exerciseFinished ? <><button className="button button-primary" onClick={() => startExercise(exerciseIndex + 1)}>{exerciseIndex === exercises.length - 1 ? 'Volver a practicar' : 'Siguiente ejercicio'}<ArrowRight size={16} /></button><button className="text-button" onClick={() => startExercise(exerciseIndex)}><RotateCcw size={14} />Reintentar</button></> : <><button className="button button-outline" onClick={toggleHint}><Lightbulb size={16} />{showHint ? 'Ocultar pista' : 'Dame una pista'}</button><button className="text-button" onClick={revealAnswer}>Ver solución</button></>}</div>
      <div className="practice-tip"><MousePointer2 size={17} /><p>Haz clic en una pieza y después en su destino. También puedes arrastrarla.</p></div>
      {solved.length === exercises.length && <div className="all-complete"><Crown size={24} /><h3>Las ideas ya son tuyas.</h3><p>Has resuelto los {exercises.length} ejercicios. Vuelve a las variantes para seguir profundizando.</p><button className="text-button" onClick={() => navigate('explorer')}>Explorar variantes<ArrowRight size={15} /></button></div>}
    </div>;
  }

  function renderPanel() {
    if (practice) return renderPractice();
    if (view === 'tree') return <>
      <VariationTree moves={moves} ply={ply} onSelect={selectFromTree} />
      {lesson && <div className="tree-lesson-note">
        <div><span className="small-label">FICHA VINCULADA</span><h4>{lesson.title}</h4><p>{lesson.subtitle}</p></div>
        <div className="tree-lesson-side">
          <SharpnessMeter id={lesson.id} size="lg" />
          <button className="text-button" onClick={() => navigate(lesson.kind === 'trap' ? 'traps' : lesson.kind === 'game' ? 'games' : 'explorer')}>Abrir la ficha completa<ArrowRight size={13} /></button>
        </div>
      </div>}
    </>;
    if (lesson) return renderDetail();
    if (view === 'italian') return renderItalian();
    if (view === 'explorer') return renderExplorer();
    if (view === 'traps') return <><div className="panel-intro"><div className="eyebrow">LA TÁCTICA CAMBIA LA PARTIDA</div><h2>Ve la amenaza antes que tu rival.</h2><p>Cuatro patrones para atacar mejor y no caer en la trampa.</p></div><LessonList items={traps} session={session} ui={ui} /><p className="quiet-note"><Info size={15} />Cada celada incluye una explicación y, cuando la posición lo permite, una alternativa defensiva reproducible.</p><button className="button button-outline" onClick={() => startExercise(FIRST_TRAP_EXERCISE)}><Target size={17} />Practicar las celadas<ArrowRight size={16} /></button></>;
    if (view === 'games') return <><div className="panel-intro"><div className="eyebrow">APRENDE DE LOS MAESTROS</div><h2>Ideas que hicieron historia.</h2><p>Dos partidas completas para ver el gambito en acción.</p></div><LessonList items={games} session={session} ui={ui} showLevel={false} /><div className="editorial-note"><span>1852</span><h3>El ajedrez también puede ser arte.</h3><p>Avanza jugada a jugada, observa cómo se coordinan las piezas y descubre el momento en que la iniciativa se convierte en ataque.</p></div></>;
    if (view === 'repertoire') {
      const collection = allLessons.filter((item) => saved.includes(item.id));
      return <><div className="panel-intro"><div className="eyebrow">TU BIBLIOTECA PERSONAL</div><h2>Las líneas que haces tuyas.</h2><p>Tu repertorio se guarda en este navegador.</p></div>{collection.length ? <><LessonList items={collection} session={session} ui={ui} showLevel={false} /><button className="button button-outline repertoire-export" onClick={() => downloadFile(collection.map((item) => buildPgn(item, item.moves)).join('\n\n'), 'mi-repertorio-evans.pgn')}><Download size={16} />Exportar repertorio en PGN</button></> : <div className="empty-state"><Bookmark size={35} strokeWidth={1.2} /><h3>Tu próxima buena idea empieza aquí.</h3><p>Abre una variante y pulsa el marcador para guardarla. Así tendrás tus líneas favoritas siempre a mano.</p><button className="button button-primary" onClick={() => navigate('explorer')}>Explorar variantes<ArrowRight size={16} /></button></div>}</>;
    }
    if (view === 'defense') return <><div className="panel-intro"><div className="eyebrow">AL OTRO LADO DEL TABLERO</div><h2>Defiende con una idea clara.</h2><p>No necesitas conservar el peón. Necesitas recuperar el tiempo.</p></div><div className="defense-principles"><div><span>01</span><p><strong>Tu rey va primero.</strong> Desarrolla y enroca antes de aceptar otro peón.</p></div><div><span>02</span><p><strong>Devuelve para ganar tiempo.</strong> Simplifica cuando la iniciativa blanca crezca.</p></div><div><span>03</span><p><strong>Responde en el centro.</strong> Prepara ...d5 en vez de defenderte pasivamente.</p></div></div><div className="list-heading"><h3>Tres caminos para empezar</h3><Shield size={16} /></div><LessonList items={[LASKER, MODERN, DECLINED]} session={session} ui={ui} showLevel={false} /><button className="show-all-button" onClick={() => { navigate('explorer'); toggleShowAll(); }}>Ver todas las respuestas<ArrowRight size={15} /></button></>;
    return <><div className="panel-intro"><div className="eyebrow">ENTIENDE EL PORQUÉ</div><h2>No es un peón. Es tiempo.</h2><p>Tres ideas que dan sentido a cada movimiento.</p></div><div className="concept-list">
      <button onClick={() => showPosition([...BASE, 'Bxb4', 'c3'], TEMPO_PLY)}><span className="concept-number">01</span><div><h3>Desarrolla con amenazas.</h3><p>c3 ataca al alfil y prepara d4. Una jugada, dos propósitos: así conviertes el peón en tiempos.</p><span>Ver 5. c3 en el tablero<ArrowRight size={14} /></span></div></button>
      <button onClick={() => showPosition(MAIN_LINE.moves, CENTRE_PLY)}><span className="concept-number">02</span><div><h3>Haz del centro tu territorio.</h3><p>Los peones en d4 y e4 abren diagonales y dan espacio a tus piezas. La iniciativa nace en el centro.</p><span>Explorar el centro<ArrowRight size={14} /></span></div></button>
      <button onClick={() => selectLesson(COMPROMISED)}><span className="concept-number">03</span><div><h3>Ataca con todas tus piezas.</h3><p>Db3 y Aa3 presionan f7 y dificultan el enroque. Antes de sacrificar otra vez, termina tu desarrollo.</p><span>Ver el plan de ataque<ArrowRight size={14} /></span></div></button>
    </div><button className="button button-outline" onClick={() => startExercise()}><Target size={16} />Lleva las ideas a la práctica<ArrowRight size={15} /></button></>;
  }

  return <MotionConfig reducedMotion="user"><div className="app-shell">
    <a className="skip-link" href="#main">Saltar al contenido</a>
    {mobileNav && <button className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Cerrar menú" />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <button className="brand" onClick={() => navigate('explorer')} aria-label="Evans, ir al explorador"><KnightMark /><span><strong>evans<span className="brand-period">.</span></strong><small>CHESS EXPLORER</small></span></button>
      <div className="sidebar-label">TU ESPACIO DE ESTUDIO</div>
      <nav className="sidebar-nav" aria-label="Navegación principal">
        <button {...areaProps('italian')} onClick={() => navigate('italian')}><Network size={19} />Apertura Italiana<span className="nav-active-dot" /></button>
        <button {...areaProps(['explorer', 'tree', 'ideas'])} onClick={() => navigate('explorer')}><GitBranch size={19} />Explorador<span className="nav-active-dot" /></button>
        <button {...areaProps('repertoire')} onClick={() => navigate('repertoire')}><Bookmark size={18} />Mi repertorio{saved.length > 0 && <span className="nav-count">{saved.length}</span>}</button>
        <button className={practice ? 'active' : ''} aria-current={practice ? 'page' : undefined} onClick={() => startExercise()}><Target size={19} />Entrenamiento</button>
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-label">MÁS ALLÁ DE LA TEORÍA</div>
      <nav className="sidebar-nav secondary-nav" aria-label="Recursos de aprendizaje">
        <button {...areaProps('traps')} onClick={() => navigate('traps')}><Zap size={18} />Patrones tácticos</button>
        <button {...areaProps('defense')} onClick={() => navigate('defense')}><Shield size={18} />Defensa del Evans</button>
        <button {...areaProps('games')} onClick={() => navigate('games')}><Crown size={19} />Partidas clásicas</button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-quote"><span className="quote-rule" /><p>Cada jugada,<br />una intención.</p><span>MENOS MEMORIA. MÁS AJEDREZ.</span></div>
        <div className="study-progress"><div><span>Tu progreso</span><strong>{studiedCount}<span> / {librarySize}</span></strong></div><div className="progress-track"><motion.span animate={{ width: `${studiedCount / librarySize * 100}%` }} transition={{ duration: 0.5 }} /></div><small>{studiedCount} de {librarySize} líneas recorridas</small></div>
        <button className="help-link" onClick={() => setHelpOpen(true)}><CircleHelp size={17} />Cómo funciona<ArrowRight size={14} /></button>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="topbar-left"><IconButton label="Abrir menú" onClick={() => setMobileNav(true)} className="mobile-menu-button"><Menu size={21} /></IconButton><BookOpen size={17} /><span>Biblioteca de aperturas</span><ChevronRight size={14} /><strong>{lesson ? lesson.title : practice ? 'Entrenamiento' : SECTION_LABELS[view]}</strong></div><div className="topbar-right"><button className="search-trigger" onClick={() => { setSearchQuery(''); setSearchOpen(true); }}><Search size={16} /><span>Buscar una variante...</span><kbd>/</kbd></button><span className="topbar-divider" /><button className="profile-button" onClick={() => navigate('repertoire')} aria-label="Abrir mi repertorio">E</button></div></header>
      <main className="main-content" id="main">
        <motion.section className="page-heading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div><div className="opening-eyebrow"><span className="opening-dot" />APERTURA ITALIANA<span className="eyebrow-divider" /><span>C51 - C52</span></div><h1>Gambito Evans<span className="heading-period">.</span></h1><p>Un peón por la iniciativa. Aprende a convertir el tiempo en ataque.</p></div>
          <button className={`button ${practice ? 'button-outline' : 'button-primary'} practice-cta`} onClick={() => practice ? navigate('explorer') : startExercise()}>{practice ? <ArrowLeft size={17} /> : <Target size={18} />}{practice ? 'Volver al explorador' : 'Practicar apertura'}{!practice && <ArrowRight size={16} />}</button>
        </motion.section>

        <nav className="study-tabs" aria-label="Secciones de estudio">{tabItems.map((tab) => <button key={tab.view} {...areaProps(tab.view)} onClick={() => navigate(tab.view)}>{tab.icon}{tab.label}{view === tab.view && <motion.span layoutId="active-tab" className="tab-underline" transition={{ type: 'spring', stiffness: 350, damping: 32 }} />}</button>)}<span className="interactive-label"><span />Aprende en el tablero</span></nav>

        <div className={`study-workspace ${expandedBoard ? 'board-expanded' : ''}`}>
          <BoardColumn session={session} />

          {!expandedBoard && <AnimatePresence mode="wait"><motion.section key={`${view}-${lesson?.id ?? 'list'}`} className="study-panel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.22 }} aria-label="Contenido de estudio">{renderPanel()}</motion.section></AnimatePresence>}
        </div>
        <footer className="page-footer"><span>Comprende la posición. Confía en tus ideas.</span><button onClick={() => setHelpOpen(true)}>Sobre esta biblioteca<ArrowRight size={12} /></button></footer>
      </main>
    </div>

    <AnimatePresence>{toast && <motion.div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{toast.tone === 'error' ? <Info size={17} /> : <Check size={17} />}<span>{toast.text}</span><button onClick={() => setToast(null)} aria-label="Cerrar aviso"><X size={15} /></button></motion.div>}</AnimatePresence>
    <AnimatePresence>{searchOpen && <Modal title="Encuentra tu próxima línea" onClose={() => setSearchOpen(false)} className="search-modal"><div className="search-input-wrap"><Search size={20} /><input data-autofocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Giuoco Piano, Lasker, f7..." aria-label="Buscar líneas, celadas y partidas" /></div><div className="search-results"><span className="small-label">{searchResults.length} RESULTADOS EN LA BIBLIOTECA</span>{searchResults.length ? searchResults.map((item) => <button className="search-result" key={item.id} onClick={() => openSearchResult(item)}><span>{item.kind === 'trap' ? <Zap size={18} /> : item.kind === 'game' ? <Crown size={18} /> : <GitBranch size={18} />}</span><span><strong>{item.title}</strong><small>{item.notation}</small></span><ChevronRight size={16} /></button>) : <div className="search-empty"><Search size={26} /><p>No encontramos esa línea.</p><span>Prueba con una defensa, una jugada o un nombre.</span></div>}</div><div className="search-footer"><kbd>ESC</kbd>para cerrar<span>{allLessons.length} líneas · {italianLines.length} italianas · {traps.length} patrones · {games.length} partidas</span></div></Modal>}</AnimatePresence>
    <AnimatePresence>
      {helpOpen && <Modal title="Menos memoria. Más ajedrez." onClose={() => setHelpOpen(false)}>
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
      </Modal>}
    </AnimatePresence>
    <AnimatePresence>{fenOpen && <Modal title="Copia esta posición" onClose={() => setFenOpen(false)}><p className="modal-intro">Tu navegador no permite copiar automáticamente. Selecciona este FEN y cópialo.</p><input className="fen-input" data-autofocus readOnly value={game.fen()} onFocus={(event) => event.target.select()} aria-label="Posición en formato FEN" /></Modal>}</AnimatePresence>
  </div></MotionConfig>;
}
