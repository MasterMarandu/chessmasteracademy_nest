import { ArrowRight, Shield } from 'lucide-react';
import LessonList from './LessonList';
import { DECLINED, LASKER, MODERN } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from './types';

/** Defensa del Evans: los tres principios y las respuestas para jugar con negras. */
export default function DefensePanel({ session, ui }: { session: StudySession; ui: StudyUi }) {
  const { navigate, toggleShowAll } = session;
  return <>
    <div className="panel-intro"><div className="eyebrow">AL OTRO LADO DEL TABLERO</div><h2>Defiende con una idea clara.</h2><p>No necesitas conservar el peón. Necesitas recuperar el tiempo.</p></div>
    <div className="defense-principles"><div><span>01</span><p><strong>Tu rey va primero.</strong> Desarrolla y enroca antes de aceptar otro peón.</p></div><div><span>02</span><p><strong>Devuelve para ganar tiempo.</strong> Simplifica cuando la iniciativa blanca crezca.</p></div><div><span>03</span><p><strong>Responde en el centro.</strong> Prepara ...d5 en vez de defenderte pasivamente.</p></div></div>
    <div className="list-heading"><h3>Tres caminos para empezar</h3><Shield size={16} /></div>
    <LessonList items={[LASKER, MODERN, DECLINED]} session={session} ui={ui} showLevel={false} />
    <button className="show-all-button" onClick={() => { navigate('explorer'); toggleShowAll(); }}>Ver todas las respuestas<ArrowRight size={15} /></button>
  </>;
}
