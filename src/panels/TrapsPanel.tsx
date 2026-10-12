import { ArrowRight, Info, Target } from 'lucide-react';
import LessonList from './LessonList';
import { FIRST_TRAP_EXERCISE, traps } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from './types';

/** Patrones tácticos: las celadas, con atajo a la práctica sobre el tablero. */
export default function TrapsPanel({ session, ui }: { session: StudySession; ui: StudyUi }) {
  const { startExercise } = session;
  return <>
    <div className="panel-intro"><div className="eyebrow">LA TÁCTICA CAMBIA LA PARTIDA</div><h2>Ve la amenaza antes que tu rival.</h2><p>Cuatro patrones para atacar mejor y no caer en la trampa.</p></div>
    <LessonList items={traps} session={session} ui={ui} />
    <p className="quiet-note"><Info size={15} />Cada celada incluye una explicación y, cuando la posición lo permite, una alternativa defensiva reproducible.</p>
    <button className="button button-outline" onClick={() => startExercise(FIRST_TRAP_EXERCISE)}><Target size={17} />Practicar las celadas<ArrowRight size={16} /></button>
  </>;
}
