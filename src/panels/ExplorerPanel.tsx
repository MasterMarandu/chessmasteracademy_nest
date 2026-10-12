import { ArrowRight, ChevronDown, Info, Shield } from 'lucide-react';
import LessonList from './LessonList';
import { DECLINED, LASKER, MODERN, variants } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from './types';

/** Explorador del Evans: variantes filtradas por familia e invitación a la defensa. */
export default function ExplorerPanel({ session, ui }: { session: StudySession; ui: StudyUi }) {
  const { family, showAll, setFamily, toggleShowAll, openLesson: selectLesson, navigate } = session;
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
