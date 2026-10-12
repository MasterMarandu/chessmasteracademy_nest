import { BookOpen, ChevronRight, Menu, Search } from 'lucide-react';
import IconButton from './IconButton';
import { SECTION_LABELS } from '../state/labels';
import type { StudySession } from '../hooks/useStudySession';

/** Barra superior: miga de pan de la sección, buscador y acceso al repertorio. */
export default function Topbar({ session, onOpenMenu, onOpenSearch }: {
  session: StudySession;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}) {
  const { view, lesson, practice, navigate } = session;
  return <header className="topbar">
    <div className="topbar-left"><IconButton label="Abrir menú" onClick={onOpenMenu} className="mobile-menu-button"><Menu size={21} /></IconButton><BookOpen size={17} /><span>Biblioteca de aperturas</span><ChevronRight size={14} /><strong>{lesson ? lesson.title : practice ? 'Entrenamiento' : SECTION_LABELS[view]}</strong></div>
    <div className="topbar-right"><button className="search-trigger" onClick={onOpenSearch}><Search size={16} /><span>Buscar una variante...</span><kbd>/</kbd></button><span className="topbar-divider" /><button className="profile-button" onClick={() => navigate('repertoire')} aria-label="Abrir mi repertorio">E</button></div>
  </header>;
}
