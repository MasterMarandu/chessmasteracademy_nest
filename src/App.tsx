import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { ArrowLeft, ArrowRight, GitBranch, Lightbulb, ListTree, Network, Shield, Target, Zap } from 'lucide-react';
import AppSidebar from './components/AppSidebar';
import BoardColumn from './components/BoardColumn';
import FenModal from './components/FenModal';
import HelpModal from './components/HelpModal';
import SearchModal from './components/SearchModal';
import ToastView from './components/Toast';
import Topbar from './components/Topbar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useStudySession } from './hooks/useStudySession';
import { useToast } from './hooks/useToast';
import { useUrlRouting } from './hooks/useUrlRouting';
import { buildPgn, downloadFile } from './lib/pgn';
import PanelRouter from './panels/PanelRouter';
import { allLessons, exercises, type Lesson } from './data/evans';
import { currentLocation, stateFromLocation } from './state/location';
import { areaProps } from './state/labels';
import type { View } from './state/session';
import { browserStorage, OPENING_ID, readStoredIds, writeStoredIds, type Slot } from './storage';
import type { StudyUi } from './panels/types';

// Los identificadores guardados se validan contra la biblioteca: si una línea
// desaparece, su marca no se queda en el almacenamiento para siempre.
const LESSON_IDS_SET = new Set(allLessons.map((lesson) => lesson.id));
const EXERCISE_IDS_SET = new Set(exercises.map((exercise) => exercise.id));

function useStoredList(slot: Slot, valid: Set<string>) {
  const storage = browserStorage();
  const [value, setValue] = useState<string[]>(() => readStoredIds(storage, OPENING_ID, slot, valid));
  useEffect(() => { writeStoredIds(storage, OPENING_ID, slot, value); }, [storage, slot, value]);
  return [value, setValue] as const;
}

export default function App() {
  const [mobileNav, setMobileNav] = useState(false);
  const [saved, setSaved] = useStoredList('saved', LESSON_IDS_SET);
  const [completed, setCompleted] = useStoredList('studied', LESSON_IDS_SET);
  const [solved, setSolved] = useStoredList('solved', EXERCISE_IDS_SET);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fenOpen, setFenOpen] = useState(false);
  const { toast, notify, dismiss } = useToast();

  // El enlace de la barra de direcciones manda en el primer render: sin parpadeo de vista.
  const [initialSession] = useState(() => stateFromLocation(currentLocation()));

  // Toda la sesión de estudio vive en el reducer: modos excluyentes, lado y orientación.
  const session = useStudySession({
    initial: initialSession,
    onLineCompleted: (id) => setCompleted((current) => current.includes(id) ? current : [...current, id]),
    onExerciseSolved: (id) => setSolved((current) => current.includes(id) ? current : [...current, id]),
    onToast: notify,
  });
  useUrlRouting(session);

  const {
    view, lesson, moves, ply, game, practice, expandedBoard,
    navigate, openLesson: selectLesson, startExercise, jumpTo, togglePlayback, toggleExpanded,
  } = session;

  function toggleSaved(item: Lesson) {
    const removing = saved.includes(item.id);
    setSaved((current) => removing ? current.filter((id) => id !== item.id) : [...current, item.id]);
    notify('ok', removing
      ? 'Variante eliminada de tu repertorio.'
      : 'Guardada en tu repertorio. Puedes volver a ella cuando quieras.');
  }

  function exportStudy() {
    downloadFile(buildPgn(lesson, moves), `evans-${lesson?.id || 'analisis'}.pgn`);
    notify('ok', 'Archivo PGN preparado para descargar.');
  }

  async function copyFen() {
    try { await navigator.clipboard.writeText(game.fen()); notify('ok', 'Posición FEN copiada al portapapeles.'); }
    catch { setFenOpen(true); }
  }

  function exportRepertoire(items: Lesson[]) {
    downloadFile(items.map((item) => buildPgn(item, item.moves)).join('\n\n'), 'mi-repertorio-evans.pgn');
  }

  const ui: StudyUi = {
    saved, solved, completed,
    toggleSaved,
    toggleCompleted: (id) => setCompleted((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    exportLesson: exportStudy,
    copyFen,
    exportRepertoire,
  };

  useKeyboardShortcuts({
    practice, searchOpen, helpOpen, fenOpen, expandedBoard,
    ply, totalPly: moves.length,
    jumpTo, togglePlayback, toggleExpanded,
    closeAuxiliary: () => { setHelpOpen(false); setFenOpen(false); },
    toggleSearch: () => setSearchOpen((current) => !current),
    openSearch: () => setSearchOpen(true),
    closeAll: () => { setSearchOpen(false); setHelpOpen(false); setFenOpen(false); setMobileNav(false); },
  });

  function openSearchResult(item: Lesson) {
    selectLesson(item);
    setSearchOpen(false);
  }

  const tabItems: { view: View; label: string; icon: ReactNode }[] = [
    { view: 'italian', label: 'Italiana', icon: <Network size={16} /> },
    { view: 'explorer', label: 'Explorador', icon: <GitBranch size={16} /> },
    { view: 'tree', label: 'Árbol', icon: <ListTree size={16} /> },
    { view: 'ideas', label: 'Ideas y planes', icon: <Lightbulb size={16} /> },
    { view: 'traps', label: 'Celadas', icon: <Zap size={16} /> },
    { view: 'defense', label: 'Defensa', icon: <Shield size={16} /> },
  ];

  return <MotionConfig reducedMotion="user"><div className="app-shell">
    <a className="skip-link" href="#main">Saltar al contenido</a>
    {mobileNav && <button className="sidebar-scrim" onClick={() => setMobileNav(false)} aria-label="Cerrar menú" />}
    <AppSidebar session={session} ui={ui} open={mobileNav} onOpenHelp={() => setHelpOpen(true)} />

    <div className="main-shell">
      <Topbar session={session} onOpenMenu={() => setMobileNav(true)} onOpenSearch={() => setSearchOpen(true)} />
      <main className="main-content" id="main">
        <motion.section className="page-heading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div><div className="opening-eyebrow"><span className="opening-dot" />APERTURA ITALIANA<span className="eyebrow-divider" /><span>C51 - C52</span></div><h1>Gambito Evans<span className="heading-period">.</span></h1><p>Un peón por la iniciativa. Aprende a convertir el tiempo en ataque.</p></div>
          <button className={`button ${practice ? 'button-outline' : 'button-primary'} practice-cta`} onClick={() => practice ? navigate('explorer') : startExercise()}>{practice ? <ArrowLeft size={17} /> : <Target size={18} />}{practice ? 'Volver al explorador' : 'Practicar apertura'}{!practice && <ArrowRight size={16} />}</button>
        </motion.section>

        <nav className="study-tabs" aria-label="Secciones de estudio">{tabItems.map((tab) => <button key={tab.view} {...areaProps(tab.view, view, practice)} onClick={() => navigate(tab.view)}>{tab.icon}{tab.label}{view === tab.view && <motion.span layoutId="active-tab" className="tab-underline" transition={{ type: 'spring', stiffness: 350, damping: 32 }} />}</button>)}<span className="interactive-label"><span />Aprende en el tablero</span></nav>

        <div className={`study-workspace ${expandedBoard ? 'board-expanded' : ''}`}>
          <BoardColumn session={session} />

          {!expandedBoard && <AnimatePresence mode="wait"><motion.section key={`${view}-${lesson?.id ?? 'list'}`} className="study-panel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.22 }} aria-label="Contenido de estudio"><PanelRouter session={session} ui={ui} /></motion.section></AnimatePresence>}
        </div>
        <footer className="page-footer"><span>Comprende la posición. Confía en tus ideas.</span><button onClick={() => setHelpOpen(true)}>Sobre esta biblioteca<ArrowRight size={12} /></button></footer>
      </main>
    </div>

    <ToastView toast={toast} onDismiss={dismiss} />

    <AnimatePresence>{searchOpen && <SearchModal onSelect={openSearchResult} onClose={() => setSearchOpen(false)} />}</AnimatePresence>
    <AnimatePresence>{helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}</AnimatePresence>
    <AnimatePresence>{fenOpen && <FenModal fen={game.fen()} onClose={() => setFenOpen(false)} />}</AnimatePresence>
  </div></MotionConfig>;
}
