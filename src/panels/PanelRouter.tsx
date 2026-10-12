import PracticePanel from './PracticePanel';
import TreePanel from './TreePanel';
import LessonDetail from './LessonDetail';
import ItalianPanel from './ItalianPanel';
import ExplorerPanel from './ExplorerPanel';
import TrapsPanel from './TrapsPanel';
import GamesPanel from './GamesPanel';
import RepertoirePanel from './RepertoirePanel';
import DefensePanel from './DefensePanel';
import IdeasPanel from './IdeasPanel';
import type { PanelProps } from './types';

/**
 * Qué panel ocupa la zona de estudio. El orden refleja la prioridad de la
 * aplicación: el entrenamiento manda sobre todo, y una línea abierta sobre
 * la lista de su sección.
 */
export default function PanelRouter({ session, ui }: PanelProps) {
  if (session.practice) return <PracticePanel session={session} ui={ui} />;
  if (session.view === 'tree') return <TreePanel session={session} />;
  if (session.lesson) return <LessonDetail session={session} ui={ui} />;
  switch (session.view) {
    case 'italian': return <ItalianPanel session={session} />;
    case 'explorer': return <ExplorerPanel session={session} ui={ui} />;
    case 'traps': return <TrapsPanel session={session} ui={ui} />;
    case 'games': return <GamesPanel session={session} ui={ui} />;
    case 'repertoire': return <RepertoirePanel session={session} ui={ui} />;
    case 'defense': return <DefensePanel session={session} ui={ui} />;
    default: return <IdeasPanel session={session} />;
  }
}
