import { motion } from 'framer-motion';
import { ArrowRight, Bookmark, CircleHelp, Crown, GitBranch, Network, Shield, Target, Zap } from 'lucide-react';
import { KnightMark } from './ChessPiece';
import { areaProps } from '../state/labels';
import { allLessons } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from '../panels/types';

/** Navegación lateral: secciones de estudio, progreso y acceso a la ayuda. */
export default function AppSidebar({ session, ui, open, onOpenHelp }: {
  session: StudySession;
  ui: StudyUi;
  open: boolean;
  onOpenHelp: () => void;
}) {
  const { view, practice, navigate, startExercise } = session;
  const studiedCount = allLessons.filter((item) => ui.completed.includes(item.id)).length;
  const librarySize = allLessons.length;
  return <aside className={`sidebar ${open ? 'is-open' : ''}`}>
    <button className="brand" onClick={() => navigate('explorer')} aria-label="Evans, ir al explorador"><KnightMark /><span><strong>evans<span className="brand-period">.</span></strong><small>CHESS EXPLORER</small></span></button>
    <div className="sidebar-label">TU ESPACIO DE ESTUDIO</div>
    <nav className="sidebar-nav" aria-label="Navegación principal">
      <button {...areaProps('italian', view, practice)} onClick={() => navigate('italian')}><Network size={19} />Apertura Italiana<span className="nav-active-dot" /></button>
      <button {...areaProps(['explorer', 'tree', 'ideas'], view, practice)} onClick={() => navigate('explorer')}><GitBranch size={19} />Explorador<span className="nav-active-dot" /></button>
      <button {...areaProps('repertoire', view, practice)} onClick={() => navigate('repertoire')}><Bookmark size={18} />Mi repertorio{ui.saved.length > 0 && <span className="nav-count">{ui.saved.length}</span>}</button>
      <button className={practice ? 'active' : ''} aria-current={practice ? 'page' : undefined} onClick={() => startExercise()}><Target size={19} />Entrenamiento</button>
    </nav>
    <div className="sidebar-divider" />
    <div className="sidebar-label">MÁS ALLÁ DE LA TEORÍA</div>
    <nav className="sidebar-nav secondary-nav" aria-label="Recursos de aprendizaje">
      <button {...areaProps('traps', view, practice)} onClick={() => navigate('traps')}><Zap size={18} />Patrones tácticos</button>
      <button {...areaProps('defense', view, practice)} onClick={() => navigate('defense')}><Shield size={18} />Defensa del Evans</button>
      <button {...areaProps('games', view, practice)} onClick={() => navigate('games')}><Crown size={19} />Partidas clásicas</button>
    </nav>
    <div className="sidebar-bottom"><div className="sidebar-quote"><span className="quote-rule" /><p>Cada jugada,<br />una intención.</p><span>MENOS MEMORIA. MÁS AJEDREZ.</span></div>
      <div className="study-progress"><div><span>Tu progreso</span><strong>{studiedCount}<span> / {librarySize}</span></strong></div><div className="progress-track"><motion.span animate={{ width: `${studiedCount / librarySize * 100}%` }} transition={{ duration: 0.5 }} /></div><small>{studiedCount} de {librarySize} líneas recorridas</small></div>
      <button className="help-link" onClick={onOpenHelp}><CircleHelp size={17} />Cómo funciona<ArrowRight size={14} /></button>
    </div>
  </aside>;
}
