import LessonList from './LessonList';
import { games } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from './types';

/** Partidas clásicas: el gambito jugado por los maestros, comentado jugada a jugada. */
export default function GamesPanel({ session, ui }: { session: StudySession; ui: StudyUi }) {
  return <>
    <div className="panel-intro"><div className="eyebrow">APRENDE DE LOS MAESTROS</div><h2>Ideas que hicieron historia.</h2><p>Dos partidas completas para ver el gambito en acción.</p></div>
    <LessonList items={games} session={session} ui={ui} showLevel={false} />
    <div className="editorial-note"><span>1852</span><h3>El ajedrez también puede ser arte.</h3><p>Avanza jugada a jugada, observa cómo se coordinan las piezas y descubre el momento en que la iniciativa se convierte en ataque.</p></div>
  </>;
}
