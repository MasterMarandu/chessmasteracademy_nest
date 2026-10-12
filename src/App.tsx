import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PieceSymbol, Square } from 'chess.js';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, CheckCheck,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  CircleHelp, Copy, Crown, Download, GitBranch, Info, Lightbulb, ListTree,
  Maximize2, Menu, Minimize2, MousePointer2, Pause, Play, RotateCcw,
  Search, Shield, Target, X, Zap,
} from 'lucide-react';
import ChessBoard from './components/ChessBoard';
import { KnightMark } from './components/ChessPiece';
import Modal from './components/Modal';
import VariationTree from './components/VariationTree';
import {
  allLessons, BASE, baseNotes, exercises, games, libraryErrors,
  makeGame, normalizeSearch, sharpness, sharpnessLabel, spanishSan, traps, variants,
  type Family, type Lesson,
} from './data/evans';

type View = 'explorer' | 'tree' | 'ideas' | 'traps' | 'defense' | 'practice' | 'repertoire' | 'games';
type Feedback = 'idle' | 'wrong' | 'correct' | 'revealed';

function useStoredList(key: string) {
  const [value, setValue] = useState<string[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [];
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
  const [view, setView] = useState<View>('explorer');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [moves, setMoves] = useState<string[]>(BASE);
  const [ply, setPly] = useState(BASE.length);
  const [flipped, setFlipped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [freeAnalysis, setFreeAnalysis] = useState(false);
  const [defenseLine, setDefenseLine] = useState(false);
  const [expandedBoard, setExpandedBoard] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [family, setFamily] = useState<Family | 'all'>('all');
  const [showAll, setShowAll] = useState(false);
  const [planSide, setPlanSide] = useState<'white' | 'black'>('white');
  const [saved, setSaved] = useStoredList('evans-repertoire-v1');
  const [completed, setCompleted] = useStoredList('evans-studied-v1');
  const [solved, setSolved] = useStoredList('evans-exercises-v1');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [showHint, setShowHint] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [fenOpen, setFenOpen] = useState(false);
  const [toast, setToast] = useState('');
  const boardRef = useRef<HTMLElement>(null);

  const lesson = allLessons.find((item) => item.id === lessonId) || null;
  const game = useMemo(() => makeGame(moves, ply), [moves, ply]);
  const exercise = exercises[exerciseIndex];
  const practice = view === 'practice';
  const exerciseFinished = feedback === 'correct' || feedback === 'revealed';
  const studiedCount = variants.filter((item) => completed.includes(item.id)).length;
  const searchResults = allLessons.filter((item) => normalizeSearch(`${item.title} ${item.subtitle} ${item.notation}`).includes(normalizeSearch(searchQuery)));
  const hintSquare = useMemo(() => {
    if (!practice || !showHint || exerciseFinished) return undefined;
    return makeGame(exercise.moves).move(exercise.answer).from;
  }, [practice, showHint, exerciseFinished, exercise]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setPly((current) => Math.min(current + 1, moves.length)), 1000);
    return () => window.clearInterval(timer);
  }, [playing, moves.length]);

  useEffect(() => {
    if (ply >= moves.length) setPlaying(false);
    if (lesson && ply === moves.length && !freeAnalysis && !defenseLine && moves.length === lesson.moves.length) {
      setCompleted((current) => current.includes(lesson.id) ? current : [...current, lesson.id]);
    }
  }, [ply, moves.length, lesson, freeAnalysis, defenseLine, setCompleted]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setHelpOpen(false); setFenOpen(false); setSearchOpen((current) => !current); return; }
      if (event.key === '/' && !typing) { event.preventDefault(); setHelpOpen(false); setFenOpen(false); setSearchOpen(true); return; }
      if (event.key === 'Escape') { setSearchOpen(false); setHelpOpen(false); setFenOpen(false); setMobileNav(false); setExpandedBoard(false); return; }
      if (typing || searchOpen || helpOpen || fenOpen || practice) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); setPlaying(false); setPly((current) => Math.max(0, current - 1)); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setPlaying(false); setPly((current) => Math.min(moves.length, current + 1)); }
      if (event.key === 'Home') { event.preventDefault(); setPlaying(false); setPly(0); }
      if (event.key === 'End') { event.preventDefault(); setPlaying(false); setPly(moves.length); }
      if (event.code === 'Space' && target.tagName !== 'BUTTON' && target.tagName !== 'A') { event.preventDefault(); togglePlayback(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, helpOpen, fenOpen, practice, moves.length, ply, playing]);

  function revealBoardOnMobile() {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    window.requestAnimationFrame(() => boardRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    }));
  }

  function startExercise(index = 0) {
    const next = exercises[(index + exercises.length) % exercises.length];
    setExerciseIndex((index + exercises.length) % exercises.length);
    setView('practice'); setLessonId(null); setMoves(next.moves); setPly(next.moves.length);
    setFlipped(makeGame(next.moves).turn() === 'b'); setFeedback('idle'); setShowHint(false);
    setPlaying(false); setFreeAnalysis(false); setDefenseLine(false); setExpandedBoard(false); setMobileNav(false);
    revealBoardOnMobile();
  }

  function navigate(next: View) {
    if (next === 'practice') { startExercise(); return; }
    setView(next); setLessonId(null); setMoves(BASE); setPly(BASE.length);
    setPlaying(false); setFreeAnalysis(false); setDefenseLine(false); setExpandedBoard(false);
    setMobileNav(false); setFamily('all'); setShowAll(false); setFlipped(next === 'defense');
  }

  function selectLesson(next: Lesson, side?: 'white' | 'black') {
    try { makeGame(next.moves); } catch { setToast('Esta línea no está disponible. Prueba otra variante.'); return; }
    const nextView: View = next.kind === 'trap' ? 'traps' : next.kind === 'game' ? 'games' : (view === 'defense' || view === 'repertoire') ? view : 'explorer';
    setView(nextView); setLessonId(next.id); setMoves(next.moves); setPly(next.startPly);
    setPlanSide(side || (nextView === 'defense' ? 'black' : 'white'));
    setPlaying(false); setFreeAnalysis(false); setDefenseLine(false); setSearchOpen(false);
    setMobileNav(false); setExpandedBoard(false);
    if (side === 'black' || nextView === 'defense') setFlipped(true);
    revealBoardOnMobile();
  }

  function resetStudy() {
    if (practice) { startExercise(exerciseIndex); return; }
    setMoves(lesson?.moves || BASE); setPly(lesson?.startPly || BASE.length);
    setPlaying(false); setFreeAnalysis(false); setDefenseLine(false);
  }

  function jumpTo(next: number) { setPlaying(false); setPly(Math.max(0, Math.min(moves.length, next))); }

  function selectFromTree(path: string[], nodePly: number) {
    setPlaying(false); setFreeAnalysis(false); setDefenseLine(false);
    if (!path.length) { setLessonId(null); setMoves(BASE); setPly(0); return; }
    const key = path.join();
    const match = allLessons
      .filter((item) => item.moves.slice(0, path.length).join() === key)
      .sort((a, b) => (a.kind === 'game' ? 1 : 0) - (b.kind === 'game' ? 1 : 0)
        || Math.abs(a.moves.length - path.length) - Math.abs(b.moves.length - path.length))[0] || null;
    setLessonId(match?.id ?? null);
    setMoves(match?.moves ?? path);
    setPly(nodePly);
    if (match) setPlanSide(nodePly % 2 === 0 ? 'black' : 'white');
    revealBoardOnMobile();
  }

  function togglePlayback() {
    if (practice) return;
    if (ply === moves.length) setPly(0);
    setPlaying((current) => !current);
  }

  function toggleSaved(item: Lesson) {
    const removing = saved.includes(item.id);
    setSaved((current) => removing ? current.filter((id) => id !== item.id) : [...current, item.id]);
    setToast(removing ? 'Variante eliminada de tu repertorio.' : 'Guardada en tu repertorio. Puedes volver a ella cuando quieras.');
  }

  function onBoardMove(from: Square, to: Square, promotion: PieceSymbol = 'q') {
    if (practice && exerciseFinished) return;
    const nextGame = makeGame(moves, ply);
    try {
      const move = nextGame.move({ from, to, promotion });
      if (practice) {
        const expected = makeGame(exercise.moves).move(exercise.answer);
        if (move.san !== expected.san) { setFeedback('wrong'); return; }
        setMoves([...exercise.moves, move.san]); setPly(exercise.moves.length + 1);
        setFeedback('correct'); setShowHint(false);
        setSolved((current) => current.includes(exercise.id) ? current : [...current, exercise.id]);
        return;
      }
      setPlaying(false);
      const expected = moves[ply] ? makeGame(moves, ply).move(moves[ply]).san : null;
      if (move.san === expected) { setPly(ply + 1); return; }
      setMoves([...moves.slice(0, ply), move.san]); setPly(ply + 1);
      if (!freeAnalysis) setToast('Análisis libre: puedes explorar movimientos de ambos bandos.');
      setFreeAnalysis(true);
    } catch { setToast('Esa jugada no es legal en esta posición.'); }
  }

  function revealAnswer() {
    setMoves([...exercise.moves, exercise.answer]); setPly(exercise.moves.length + 1);
    setFeedback('revealed'); setShowHint(false);
  }

  function loadDefense() {
    if (!lesson?.defenseMoves) return;
    const divergence = lesson.moves.findIndex((move, index) => move !== lesson.defenseMoves?.[index]);
    const start = divergence < 0 ? lesson.startPly : divergence;
    setMoves(lesson.defenseMoves); setPly(start);
    setFlipped(makeGame(lesson.defenseMoves, start).turn() === 'b');
    setDefenseLine(true); setFreeAnalysis(false); setPlaying(false); setPlanSide('black');
    setToast('Defensa alternativa cargada. Avanza para ver la continuación.');
    revealBoardOnMobile();
  }

  function buildPgn(item: Lesson | null, sequence: string[]) {
    const result = makeGame([]);
    const original = item?.moves.join() === sequence.join();
    sequence.forEach((move, index) => {
      result.move(move);
      if (original && item?.notes[index + 1]) result.setComment(item.notes[index + 1]);
    });
    result.setHeader('Event', item?.title || 'Gambito Evans - Análisis');
    result.setHeader('White', item?.id === 'evergreen' ? 'Adolf Anderssen' : item?.id === 'fischer-fine' ? 'Bobby Fischer' : 'Blancas');
    result.setHeader('Black', item?.id === 'evergreen' ? 'Jean Dufresne' : item?.id === 'fischer-fine' ? 'Reuben Fine' : 'Negras');
    result.setHeader('ECO', sequence[9] === 'Ba5' ? 'C52' : 'C51');
    if (item?.kind === 'game' && sequence.join() === item.moves.join()) result.setHeader('Result', '1-0');
    return result.pgn();
  }

  function exportStudy() {
    downloadFile(buildPgn(lesson, moves), `evans-${lesson?.id || 'analisis'}.pgn`);
    setToast('Archivo PGN preparado para descargar.');
  }

  async function copyFen() {
    try { await navigator.clipboard.writeText(game.fen()); setToast('Posición FEN copiada al portapapeles.'); }
    catch { setFenOpen(true); }
  }

  const tabItems: { view: View; label: string; icon: ReactNode }[] = [
    { view: 'explorer', label: 'Explorador', icon: <GitBranch size={16} /> },
    { view: 'tree', label: 'Árbol', icon: <ListTree size={16} /> },
    { view: 'ideas', label: 'Ideas y planes', icon: <Lightbulb size={16} /> },
    { view: 'traps', label: 'Celadas', icon: <Zap size={16} /> },
    { view: 'defense', label: 'Defensa', icon: <Shield size={16} /> },
  ];

  function renderLessonRows(items: Lesson[], showLevel = true) {
    return <div className="variant-list">{items.map((item, index) => <motion.div className="variant-list-item" key={item.id}
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-8px' }}
      transition={{ duration: 0.34, delay: Math.min(index * 0.045, 0.25), ease: 'easeOut' }}>
      <button className={`variant-row ${item.id === 'main' && view === 'explorer' ? 'recommended' : ''}`} onClick={() => selectLesson(item)}>
        <span className={`variant-symbol ${item.kind === 'trap' ? 'tactical' : ''}`}>{item.kind === 'trap' ? <Zap size={19} /> : item.kind === 'game' ? <Crown size={20} /> : item.id === 'main' ? <GitBranch size={20} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</span>
        <span className="variant-copy"><span className="variant-title">{item.title}{completed.includes(item.id) && <Check size={13} className="completed-tick" />}</span><span className="variant-notation">{item.notation}</span></span>
        <span className="row-meta">
          {item.id === 'main' && view === 'explorer' ? <span className="recommended-cta"><span>Explorar línea<ArrowRight size={12} /></span></span> : showLevel && <span className={`level level-${item.level.toLowerCase()}`}>{item.level}</span>}
          <SharpnessMeter id={item.id} />
        </span>
        <ChevronRight size={16} className="row-chevron" />
      </button>
      {view === 'repertoire' && <IconButton label={`Quitar ${item.title} del repertorio`} onClick={() => toggleSaved(item)}><Bookmark size={17} fill="currentColor" /></IconButton>}
    </motion.div>)}</div>;
  }

  function renderDetail() {
    if (!lesson) return null;
    const whiteDefender = lesson.kind === 'trap' && lesson.defendingSide === 'white';
    const attackingPlan = whiteDefender ? lesson.blackPlan : lesson.whitePlan;
    const defendingPlan = whiteDefender ? lesson.whitePlan : lesson.blackPlan;
    return <div>
      <div className="detail-topline"><button className="back-link" onClick={() => navigate(view)}><ArrowLeft size={15} />{view === 'repertoire' ? 'Mi repertorio' : lesson.kind === 'trap' ? 'Todas las celadas' : lesson.kind === 'game' ? 'Partidas clásicas' : 'Todas las variantes'}</button><span className={`level level-${lesson.level.toLowerCase()}`}>{lesson.level}</span></div>
      <div className="detail-title-row"><h2>{lesson.title}</h2><IconButton label={saved.includes(lesson.id) ? 'Quitar del repertorio' : 'Guardar en mi repertorio'} onClick={() => toggleSaved(lesson)} className={saved.includes(lesson.id) ? 'is-saved' : ''}><Bookmark size={21} fill={saved.includes(lesson.id) ? 'currentColor' : 'none'} /></IconButton></div>
      <div className="detail-meta"><p className="detail-notation">{lesson.notation}</p><p className="detail-sharp"><span>Agudeza</span><SharpnessMeter id={lesson.id} size="lg" /><em>{sharpnessLabel(sharpness[lesson.id] ?? 3)}</em></p></div>
      <p className="detail-description">{lesson.description}</p>
      <div className="plan-switch" role="tablist" aria-label="Planes por bando">
        <button role="tab" aria-selected={planSide === 'white'} className={planSide === 'white' ? 'active' : ''} onClick={() => setPlanSide('white')}>{whiteDefender ? <Zap size={14} /> : <span className="side-dot white" />}{whiteDefender ? 'La idea táctica' : 'Plan de blancas'}</button>
        <button role="tab" aria-selected={planSide === 'black'} className={planSide === 'black' ? 'active' : ''} onClick={() => setPlanSide('black')}><Shield size={14} />Cómo defenderte</button>
      </div>
      <AnimatePresence mode="wait"><motion.div key={planSide} className="plan-content" role="tabpanel" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
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

  function renderExplorer() {
    const filtered = variants.filter((item) => family === 'all' || item.family === family);
    const visible = showAll ? filtered : filtered.slice(0, 5);
    return <>
      <div className="panel-intro explorer-intro"><h2>Una apertura. Muchos caminos.</h2><p>Entiende cada respuesta. Encuentra tu forma de jugar. Las líneas se cargan directamente en el tablero.</p></div>
      <div className="list-heading"><h3>Variantes principales</h3><span>{variants.length} líneas de estudio</span></div>
      <div className="family-filter" role="group" aria-label="Filtrar variantes">{([['all', 'Todas'], ['accepted', 'Aceptado'], ['declined', 'Rehusado'], ['other', 'Otras']] as const).map(([value, label]) => <button key={value} aria-pressed={family === value} className={family === value ? 'active' : ''} onClick={() => { setFamily(value); setShowAll(false); }}>{label}{value === 'all' && <span>{variants.length}</span>}</button>)}</div>
      {renderLessonRows(visible)}
      {filtered.length > 5 && <button className="show-all-button" onClick={() => setShowAll((current) => !current)}>{showAll ? 'Mostrar las esenciales' : `Ver las ${filtered.length} variantes`}<ChevronDown size={15} className={showAll ? 'rotated' : ''} /></button>}
      <div className="defense-invitation">
        <div className="defense-invitation-head"><span className="defense-invitation-icon"><Shield size={20} strokeWidth={1.7} /></span><div><strong>¿Y si juegas con negras?</strong><p>Defender el Evans no es sufrir: es devolver el peón en el momento exacto y quedarse con un desarrollo sano.</p></div></div>
        <div className="defense-invitation-grid">
          <button onClick={() => selectLesson(variants[1], 'black')}><span>Defensa Lasker</span><small>5...Aa5 6. d4 d6 · la respuesta clásica</small></button>
          <button onClick={() => selectLesson(variants[2], 'black')}><span>Defensa moderna</span><small>5...Ae7 · flexible y poco explorada</small></button>
          <button onClick={() => selectLesson(variants[3], 'black')}><span>Gambito rehusado</span><small>4...Ab6 · sin cargar teoría pesada</small></button>
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
      <div className="practice-actions">{exerciseFinished ? <><button className="button button-primary" onClick={() => startExercise(exerciseIndex + 1)}>{exerciseIndex === exercises.length - 1 ? 'Volver a practicar' : 'Siguiente ejercicio'}<ArrowRight size={16} /></button><button className="text-button" onClick={() => startExercise(exerciseIndex)}><RotateCcw size={14} />Reintentar</button></> : <><button className="button button-outline" onClick={() => setShowHint((current) => !current)}><Lightbulb size={16} />{showHint ? 'Ocultar pista' : 'Dame una pista'}</button><button className="text-button" onClick={revealAnswer}>Ver solución</button></>}</div>
      <div className="practice-tip"><MousePointer2 size={17} /><p>Haz clic en una pieza y después en su destino. También puedes arrastrarla.</p></div>
      {solved.length === exercises.length && <div className="all-complete"><Crown size={24} /><h3>Las ideas ya son tuyas.</h3><p>Has resuelto los 8 ejercicios. Vuelve a las variantes para seguir profundizando.</p><button className="text-button" onClick={() => navigate('explorer')}>Explorar variantes<ArrowRight size={15} /></button></div>}
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
          <button className="text-button" onClick={() => setView(lesson.kind === 'trap' ? 'traps' : lesson.kind === 'game' ? 'games' : 'explorer')}>Abrir la ficha completa<ArrowRight size={13} /></button>
        </div>
      </div>}
    </>;
    if (lesson) return renderDetail();
    if (view === 'explorer') return renderExplorer();
    if (view === 'traps') return <><div className="panel-intro"><div className="eyebrow">LA TÁCTICA CAMBIA LA PARTIDA</div><h2>Ve la amenaza antes que tu rival.</h2><p>Cuatro patrones para atacar mejor y no caer en la trampa.</p></div>{renderLessonRows(traps)}<p className="quiet-note"><Info size={15} />Cada celada incluye una explicación y, cuando la posición lo permite, una alternativa defensiva reproducible.</p><button className="button button-outline" onClick={() => startExercise(5)}><Target size={17} />Practicar las celadas<ArrowRight size={16} /></button></>;
    if (view === 'games') return <><div className="panel-intro"><div className="eyebrow">APRENDE DE LOS MAESTROS</div><h2>Ideas que hicieron historia.</h2><p>Dos partidas completas para ver el gambito en acción.</p></div>{renderLessonRows(games, false)}<div className="editorial-note"><span>1852</span><h3>El ajedrez también puede ser arte.</h3><p>Avanza jugada a jugada, observa cómo se coordinan las piezas y descubre el momento en que la iniciativa se convierte en ataque.</p></div></>;
    if (view === 'repertoire') {
      const collection = allLessons.filter((item) => saved.includes(item.id));
      return <><div className="panel-intro"><div className="eyebrow">TU BIBLIOTECA PERSONAL</div><h2>Las líneas que haces tuyas.</h2><p>Tu repertorio se guarda en este navegador.</p></div>{collection.length ? <>{renderLessonRows(collection, false)}<button className="button button-outline repertoire-export" onClick={() => downloadFile(collection.map((item) => buildPgn(item, item.moves)).join('\n\n'), 'mi-repertorio-evans.pgn')}><Download size={16} />Exportar repertorio en PGN</button></> : <div className="empty-state"><Bookmark size={35} strokeWidth={1.2} /><h3>Tu próxima buena idea empieza aquí.</h3><p>Abre una variante y pulsa el marcador para guardarla. Así tendrás tus líneas favoritas siempre a mano.</p><button className="button button-primary" onClick={() => navigate('explorer')}>Explorar variantes<ArrowRight size={16} /></button></div>}</>;
    }
    if (view === 'defense') return <><div className="panel-intro"><div className="eyebrow">AL OTRO LADO DEL TABLERO</div><h2>Defiende con una idea clara.</h2><p>No necesitas conservar el peón. Necesitas recuperar el tiempo.</p></div><div className="defense-principles"><div><span>01</span><p><strong>Tu rey va primero.</strong> Desarrolla y enroca antes de aceptar otro peón.</p></div><div><span>02</span><p><strong>Devuelve para ganar tiempo.</strong> Simplifica cuando la iniciativa blanca crezca.</p></div><div><span>03</span><p><strong>Responde en el centro.</strong> Prepara ...d5 en vez de defenderte pasivamente.</p></div></div><div className="list-heading"><h3>Tres caminos para empezar</h3><Shield size={16} /></div>{renderLessonRows([variants[1], variants[2], variants[3]], false)}<button className="show-all-button" onClick={() => { setView('explorer'); setShowAll(true); }}>Ver todas las respuestas<ArrowRight size={15} /></button></>;
    return <><div className="panel-intro"><div className="eyebrow">ENTIENDE EL PORQUÉ</div><h2>No es un peón. Es tiempo.</h2><p>Tres ideas que dan sentido a cada movimiento.</p></div><div className="concept-list">
      <button onClick={() => { setMoves([...BASE, 'Bxb4', 'c3']); setPly(9); setFreeAnalysis(false); setPlaying(false); }}><span className="concept-number">01</span><div><h3>Desarrolla con amenazas.</h3><p>c3 ataca al alfil y prepara d4. Una jugada, dos propósitos: así conviertes el peón en tiempos.</p><span>Ver 5. c3 en el tablero<ArrowRight size={14} /></span></div></button>
      <button onClick={() => { setMoves(variants[0].moves); setPly(15); setFreeAnalysis(false); setPlaying(false); }}><span className="concept-number">02</span><div><h3>Haz del centro tu territorio.</h3><p>Los peones en d4 y e4 abren diagonales y dan espacio a tus piezas. La iniciativa nace en el centro.</p><span>Explorar el centro<ArrowRight size={14} /></span></div></button>
      <button onClick={() => selectLesson(variants[6])}><span className="concept-number">03</span><div><h3>Ataca con todas tus piezas.</h3><p>Db3 y Aa3 presionan f7 y dificultan el enroque. Antes de sacrificar otra vez, termina tu desarrollo.</p><span>Ver el plan de ataque<ArrowRight size={14} /></span></div></button>
    </div><button className="button button-outline" onClick={() => startExercise()}><Target size={16} />Lleva las ideas a la práctica<ArrowRight size={15} /></button></>;
  }

  const currentNote = freeAnalysis ? 'Estás explorando tu propia línea. Puedes mover ambos bandos, retroceder o volver al estudio original. No hay un motor jugando.' : defenseLine ? (lesson?.defendingSide === 'white' ? lesson.whitePlan : lesson?.blackPlan) : practice ? (exerciseFinished ? exercise.explanation : 'Observa la posición y juega en el tablero. La respuesta está en la idea, no en memorizar.') : lesson?.notes[ply] || baseNotes[ply] || (view === 'ideas' ? variants[0].notes[ply] : undefined) || 'Observa el centro, la seguridad de los reyes y las piezas que todavía necesitan desarrollarse.';
  const boardTitle = practice ? `Ejercicio ${exerciseIndex + 1}` : freeAnalysis ? 'Análisis libre' : defenseLine ? 'La defensa alternativa' : lesson ? lesson.title : view === 'ideas' && ply > 7 ? 'La idea sobre el tablero' : 'Posición inicial del Evans';

  return <MotionConfig reducedMotion="user"><div className="app-shell">
    {mobileNav && <button className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Cerrar menú" />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <button className="brand" onClick={() => navigate('explorer')} aria-label="Evans, ir al explorador"><KnightMark /><span><strong>evans<span className="brand-period">.</span></strong><small>CHESS EXPLORER</small></span></button>
      <div className="sidebar-label">TU ESPACIO DE ESTUDIO</div>
      <nav className="sidebar-nav" aria-label="Navegación principal">
        <button className={view === 'explorer' || view === 'tree' || view === 'ideas' ? 'active' : ''} onClick={() => navigate('explorer')}><GitBranch size={19} />Explorador<span className="nav-active-dot" /></button>
        <button className={view === 'repertoire' ? 'active' : ''} onClick={() => navigate('repertoire')}><Bookmark size={18} />Mi repertorio{saved.length > 0 && <span className="nav-count">{saved.length}</span>}</button>
        <button className={view === 'practice' ? 'active' : ''} onClick={() => navigate('practice')}><Target size={19} />Entrenamiento</button>
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-label">MÁS ALLÁ DE LA TEORÍA</div>
      <nav className="sidebar-nav secondary-nav" aria-label="Recursos de aprendizaje">
        <button className={view === 'traps' ? 'active' : ''} onClick={() => navigate('traps')}><Zap size={18} />Patrones tácticos</button>
        <button className={view === 'defense' ? 'active' : ''} onClick={() => navigate('defense')}><Shield size={18} />Defensa del Evans</button>
        <button className={view === 'games' ? 'active' : ''} onClick={() => navigate('games')}><Crown size={19} />Partidas clásicas</button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-quote"><span className="quote-rule" /><p>Cada jugada,<br />una intención.</p><span>MENOS MEMORIA. MÁS AJEDREZ.</span></div>
        <div className="study-progress"><div><span>Tu progreso</span><strong>{studiedCount}<span> / {variants.length}</span></strong></div><div className="progress-track"><motion.span animate={{ width: `${studiedCount / variants.length * 100}%` }} transition={{ duration: 0.5 }} /></div><small>de {variants.length} líneas recorridas hasta el final</small></div>
        <button className="help-link" onClick={() => setHelpOpen(true)}><CircleHelp size={17} />Cómo funciona<ArrowRight size={14} /></button>
      </div>
    </aside>

    <div className="main-shell">
      <header className="topbar"><div className="topbar-left"><IconButton label="Abrir menú" onClick={() => setMobileNav(true)} className="mobile-menu-button"><Menu size={21} /></IconButton><BookOpen size={17} /><span>Biblioteca de aperturas</span><ChevronRight size={14} /><strong>Gambito Evans</strong></div><div className="topbar-right"><button className="search-trigger" onClick={() => { setSearchQuery(''); setSearchOpen(true); }}><Search size={16} /><span>Buscar una variante...</span><kbd>/</kbd></button><span className="topbar-divider" /><button className="profile-button" onClick={() => navigate('repertoire')} aria-label="Abrir mi repertorio">E</button></div></header>
      <main className="main-content">
        <motion.section className="page-heading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div><div className="opening-eyebrow"><span className="opening-dot" />APERTURA ITALIANA<span className="eyebrow-divider" /><span>C51 - C52</span></div><h1>Gambito Evans<span className="heading-period">.</span></h1><p>Un peón por la iniciativa. Aprende a convertir el tiempo en ataque.</p></div>
          <button className={`button ${practice ? 'button-outline' : 'button-primary'} practice-cta`} onClick={() => practice ? navigate('explorer') : startExercise()}>{practice ? <ArrowLeft size={17} /> : <Target size={18} />}{practice ? 'Volver al explorador' : 'Practicar apertura'}{!practice && <ArrowRight size={16} />}</button>
        </motion.section>

        <div className="study-tabs" role="tablist" aria-label="Secciones del gambito">{tabItems.map((tab) => <button key={tab.view} role="tab" aria-selected={view === tab.view} onClick={() => navigate(tab.view)} className={view === tab.view ? 'active' : ''}>{tab.icon}{tab.label}{view === tab.view && <motion.span layoutId="active-tab" className="tab-underline" transition={{ type: 'spring', stiffness: 350, damping: 32 }} />}</button>)}<span className="interactive-label"><span />Aprende en el tablero</span></div>

        <div className={`study-workspace ${expandedBoard ? 'board-expanded' : ''}`}>
          <motion.section ref={boardRef} className="board-column" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }} aria-label="Tablero interactivo">
            <div className="board-heading">
              <h2>{boardTitle}</h2>
              <div className="board-heading-right">
                <span className={`turn-pill ${game.turn() === 'w' ? 'is-white' : 'is-black'}`}><span className="pill-dot" /><span>{game.isCheckmate() ? 'Jaque mate' : game.isDraw() ? 'Tablas' : `Juegan ${game.turn() === 'w' ? 'las blancas' : 'las negras'}${game.inCheck() ? ' · jaque' : ''}`}</span></span>
                <div className="side-switch" role="group" aria-label="Elegir el bando desde el que mirar">
                  <button type="button" aria-pressed={!flipped} onClick={() => { setFlipped(false); setPlanSide('white'); }}><span className="side-dot white" />Blancas</button>
                  <button type="button" aria-pressed={flipped} onClick={() => { setFlipped(true); setPlanSide('black'); }}><span className="side-dot black" />Negras</button>
                </div>
              </div>
            </div>
            {practice && <div className={`mobile-exercise-prompt ${feedback === 'correct' ? 'is-correct' : ''}`}><span>{exerciseFinished ? feedback === 'correct' ? '¡Esa es la idea!' : 'La solución' : exercise.title}</span><p>{exerciseFinished ? exercise.explanation : feedback === 'wrong' ? 'Esa jugada es legal, pero no resuelve el objetivo. Vuelve a intentarlo.' : exercise.prompt}</p></div>}
            <div className="board-frame"><ChessBoard game={game} flipped={flipped} onMove={onBoardMove} disabled={practice && exerciseFinished} hintSquare={hintSquare} /><div className="board-dock"><MoveStrip moves={moves} ply={ply} onSelect={jumpTo} disabled={practice} /><div className="board-controls"><IconButton label="Volver a la posición del estudio" onClick={resetStudy}><RotateCcw size={17} /></IconButton><div className="transport-controls"><IconButton label="Primera posición" onClick={() => jumpTo(0)} disabled={practice || ply === 0}><ChevronsLeft size={19} /></IconButton><IconButton label="Jugada anterior (flecha izquierda)" onClick={() => jumpTo(ply - 1)} disabled={practice || ply === 0}><ChevronLeft size={21} /></IconButton><IconButton label={playing ? 'Pausar reproducción' : 'Reproducir la línea'} onClick={togglePlayback} disabled={practice} className="play-button">{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</IconButton><IconButton label="Jugada siguiente (flecha derecha)" onClick={() => jumpTo(ply + 1)} disabled={practice || ply >= moves.length}><ChevronRight size={21} /></IconButton><IconButton label="Última posición" onClick={() => jumpTo(moves.length)} disabled={practice || ply >= moves.length}><ChevronsRight size={19} /></IconButton></div><div className="board-view-controls"><IconButton label="Girar el tablero" onClick={() => setFlipped((current) => !current)}><ArrowDownUp size={17} /></IconButton><IconButton label={expandedBoard ? 'Reducir tablero' : 'Ampliar tablero'} onClick={() => setExpandedBoard((current) => !current)}>{expandedBoard ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</IconButton></div></div></div></div>
            <div className="board-hint"><MousePointer2 size={12} /><span>Mueve las piezas o usa las flechas. La saeta marca la última jugada.</span><span className="board-key-hints"><kbd>←</kbd><kbd>→</kbd></span></div>
            {(freeAnalysis || defenseLine) && <div className="analysis-status"><span>{freeAnalysis ? 'Estás en análisis libre' : 'Viendo la defensa alternativa'}</span><button onClick={resetStudy}>Volver al estudio<RotateCcw size={13} /></button></div>}
            <div className="board-annotation"><span className="annotation-icon"><Lightbulb size={22} strokeWidth={1.5} /></span><div><span className="small-label">{practice ? 'APRENDE HACIENDO' : freeAnalysis ? 'TU PROPIA EXPLORACIÓN' : ply === 7 ? 'LA IDEA DETRÁS DEL SACRIFICIO' : 'LA IDEA DE ESTA POSICIÓN'}</span><h3>{ply === 7 && !practice ? 'Un peón por la iniciativa.' : practice ? exerciseFinished ? 'Entender es recordar.' : 'Mira, piensa, juega.' : ply === 0 ? 'Todo empieza aquí.' : `${Math.ceil(ply / 2)}${ply % 2 === 0 ? '...' : '.'} ${spanishSan(moves[ply - 1] || '')}`}</h3><p>{currentNote}</p></div></div>
          </motion.section>

          {!expandedBoard && <AnimatePresence mode="wait"><motion.section key={`${view}-${lessonId || 'list'}`} className="study-panel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.22 }} aria-label="Contenido de estudio">{renderPanel()}</motion.section></AnimatePresence>}
        </div>
        <footer className="page-footer"><span>Comprende la posición. Confía en tus ideas.</span><button onClick={() => setHelpOpen(true)}>Sobre esta biblioteca<ArrowRight size={12} /></button></footer>
      </main>
    </div>

    <AnimatePresence>{toast && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Check size={17} /><span>{toast}</span><button onClick={() => setToast('')} aria-label="Cerrar aviso"><X size={15} /></button></motion.div>}</AnimatePresence>
    <AnimatePresence>{searchOpen && <Modal title="Encuentra tu próxima línea" onClose={() => setSearchOpen(false)} className="search-modal"><div className="search-input-wrap"><Search size={20} /><input data-autofocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Lasker, f7, gambito rehusado..." aria-label="Buscar variantes, celadas y partidas" /></div><div className="search-results"><span className="small-label">{searchResults.length} RESULTADOS EN LA BIBLIOTECA</span>{searchResults.length ? searchResults.map((item) => <button className="search-result" key={item.id} onClick={() => selectLesson(item)}><span>{item.kind === 'trap' ? <Zap size={18} /> : item.kind === 'game' ? <Crown size={18} /> : <GitBranch size={18} />}</span><span><strong>{item.title}</strong><small>{item.notation}</small></span><ChevronRight size={16} /></button>) : <div className="search-empty"><Search size={26} /><p>No encontramos esa línea.</p><span>Prueba con una defensa, una jugada o un nombre.</span></div>}</div><div className="search-footer"><kbd>ESC</kbd>para cerrar<span>14 variantes · 4 patrones · 2 partidas</span></div></Modal>}</AnimatePresence>
    <AnimatePresence>
      {helpOpen && <Modal title="Menos memoria. Más ajedrez." onClose={() => setHelpOpen(false)}>
        <p className="modal-intro">Evans es tu espacio para entender una apertura, no solo para repetir sus jugadas.</p>
        <div className="help-steps">
          <div><GitBranch size={21} /><section><h3>Explora una idea</h3><p>Elige una variante, avanza con las flechas o reproduce la línea. Puedes hacer movimientos legales para investigar por tu cuenta.</p></section></div>
          <div><Shield size={21} /><section><h3>Mira los dos lados</h3><p>Cada línea explica los planes de ambos bandos y el detalle táctico que no debes pasar por alto.</p></section></div>
          <div><Bookmark size={21} /><section><h3>Construye tu repertorio</h3><p>Guarda variantes, practica los 8 ejercicios y exporta tus líneas comentadas en PGN. El progreso se conserva en este navegador, sin cuenta.</p></section></div>
        </div>
        <div className="keyboard-help"><span><kbd>←</kbd><kbd>→</kbd>Recorrer jugadas</span><span><kbd>Espacio</kbd>Reproducir</span><span><kbd>/</kbd>Buscar</span></div>
        <div className="library-info">
          <h3>Una biblioteca para aprender</h3>
          <p>Incluye 14 variantes principales y alternativas, no todas las ramas teóricas posibles. Las líneas son ejemplos didácticos, no victorias forzadas. No se utiliza un motor de evaluación.</p>
          <p>{libraryErrors.length === 0 ? 'Todas las secuencias de esta biblioteca pasan la validación de movimientos legales de chess.js.' : `Se detectaron ${libraryErrors.length} líneas pendientes de revisión.`}</p>
          <div className="source-links"><a href="https://en.wikipedia.org/wiki/Evans_Gambit" target="_blank" rel="noreferrer">Teoría y nomenclatura<ArrowRight size={12} /></a><a href="https://www.365chess.com/eco/C52_Evans_gambit_Lasker_defence" target="_blank" rel="noreferrer">Defensa Lasker<ArrowRight size={12} /></a></div>
          <p className="art-credit">Piezas adaptadas del conjunto de <a href="https://commons.wikimedia.org/wiki/User:Cburnett" target="_blank" rel="noreferrer">Cburnett</a>, con cambios de color y trazado. <a href="/chesspieces-license.txt" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</p>
        </div>
      </Modal>}
    </AnimatePresence>
    <AnimatePresence>{fenOpen && <Modal title="Copia esta posición" onClose={() => setFenOpen(false)}><p className="modal-intro">Tu navegador no permite copiar automáticamente. Selecciona este FEN y cópialo.</p><input className="fen-input" data-autofocus readOnly value={game.fen()} onFocus={(event) => event.target.select()} aria-label="Posición en formato FEN" /></Modal>}</AnimatePresence>
  </div></MotionConfig>;
}
