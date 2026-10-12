import { ArrowRight } from 'lucide-react';
import SharpnessMeter from '../components/SharpnessMeter';
import VariationTree from '../components/VariationTree';
import type { StudySession } from '../hooks/useStudySession';

/** Árbol de variantes: toda la apertura en un mapa, con la ficha de la línea abierta. */
export default function TreePanel({ session }: { session: StudySession }) {
  const { lesson, moves, ply, openTreeLine: selectFromTree, navigate } = session;
  return <>
    <VariationTree moves={moves} ply={ply} onSelect={selectFromTree} />
    {lesson && <div className="tree-lesson-note">
      <div><span className="small-label">FICHA VINCULADA</span><h4>{lesson.title}</h4><p>{lesson.subtitle}</p></div>
      <div className="tree-lesson-side">
        <SharpnessMeter id={lesson.id} size="lg" />
        <button className="text-button" onClick={() => navigate(lesson.kind === 'trap' ? 'traps' : lesson.kind === 'game' ? 'games' : 'explorer')}>Abrir la ficha completa<ArrowRight size={13} /></button>
      </div>
    </div>}
  </>;
}
