import { ArrowRight, Target } from 'lucide-react';
import { BASE, CENTRE_PLY, COMPROMISED, MAIN_LINE, TEMPO_PLY } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';

/** Ideas y planes: tres conceptos que se llevan al tablero con un clic. */
export default function IdeasPanel({ session }: { session: StudySession }) {
  const { openLesson: selectLesson, showPosition, startExercise } = session;
  return <>
    <div className="panel-intro"><div className="eyebrow">ENTIENDE EL PORQUÉ</div><h2>No es un peón. Es tiempo.</h2><p>Tres ideas que dan sentido a cada movimiento.</p></div>
    <div className="concept-list">
      <button onClick={() => showPosition([...BASE, 'Bxb4', 'c3'], TEMPO_PLY)}><span className="concept-number">01</span><div><h3>Desarrolla con amenazas.</h3><p>c3 ataca al alfil y prepara d4. Una jugada, dos propósitos: así conviertes el peón en tiempos.</p><span>Ver 5. c3 en el tablero<ArrowRight size={14} /></span></div></button>
      <button onClick={() => showPosition(MAIN_LINE.moves, CENTRE_PLY)}><span className="concept-number">02</span><div><h3>Haz del centro tu territorio.</h3><p>Los peones en d4 y e4 abren diagonales y dan espacio a tus piezas. La iniciativa nace en el centro.</p><span>Explorar el centro<ArrowRight size={14} /></span></div></button>
      <button onClick={() => selectLesson(COMPROMISED)}><span className="concept-number">03</span><div><h3>Ataca con todas tus piezas.</h3><p>Db3 y Aa3 presionan f7 y dificultan el enroque. Antes de sacrificar otra vez, termina tu desarrollo.</p><span>Ver el plan de ataque<ArrowRight size={14} /></span></div></button>
    </div>
    <button className="button button-outline" onClick={() => startExercise()}><Target size={16} />Lleva las ideas a la práctica<ArrowRight size={15} /></button>
  </>;
}
