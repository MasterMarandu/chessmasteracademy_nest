import { ArrowRight, Bookmark, Download } from 'lucide-react';
import LessonList from './LessonList';
import { allLessons, type Lesson } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from './types';

/** Mi repertorio: las líneas guardadas en este navegador, exportables en PGN. */
export default function RepertoirePanel({ session, ui }: { session: StudySession; ui: StudyUi }) {
  const { navigate } = session;
  const collection: Lesson[] = allLessons.filter((item) => ui.saved.includes(item.id));
  return <>
    <div className="panel-intro"><div className="eyebrow">TU BIBLIOTECA PERSONAL</div><h2>Las líneas que haces tuyas.</h2><p>Tu repertorio se guarda en este navegador.</p></div>
    {collection.length ? <>
      <LessonList items={collection} session={session} ui={ui} showLevel={false} />
      <button className="button button-outline repertoire-export" onClick={() => ui.exportRepertoire(collection)}><Download size={16} />Exportar repertorio en PGN</button>
    </> : <div className="empty-state"><Bookmark size={35} strokeWidth={1.2} /><h3>Tu próxima buena idea empieza aquí.</h3><p>Abre una variante y pulsa el marcador para guardarla. Así tendrás tus líneas favoritas siempre a mano.</p><button className="button button-primary" onClick={() => navigate('explorer')}>Explorar variantes<ArrowRight size={16} /></button></div>}
  </>;
}
