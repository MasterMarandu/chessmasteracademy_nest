import { motion } from 'framer-motion';
import { ArrowRight, Check, CheckCheck, Crown, Info, Lightbulb, MousePointer2, RotateCcw } from 'lucide-react';
import { exercises, makeGame, spanishSan } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from './types';

/** Entrenamiento: encontrarse con la posición y descubrir la jugada, no memorizarla. */
export default function PracticePanel({ session, ui }: { session: StudySession; ui: StudyUi }) {
  const {
    exercise, exerciseIndex, feedback, showHint, exerciseFinished,
    navigate, startExercise, toggleHint, revealAnswer,
  } = session;
  return <div className="practice-panel">
    <div className="eyebrow">DEL CONOCIMIENTO AL TABLERO</div><h2>Ahora te toca a ti.</h2><p className="panel-subtitle">No memorices la jugada. Descubre la idea.</p>
    <div className="exercise-progress"><span>Ejercicio {exerciseIndex + 1} de {exercises.length}</span><span>{ui.solved.length}/{exercises.length} resueltos</span></div>
    <div className="exercise-dots">{exercises.map((item, index) => <button key={item.id} className={`${index === exerciseIndex ? 'active' : ''} ${ui.solved.includes(item.id) ? 'solved' : ''}`} aria-label={`Ejercicio ${index + 1}: ${item.title}${ui.solved.includes(item.id) ? ', resuelto' : ''}`} onClick={() => startExercise(index)}>{ui.solved.includes(item.id) ? <Check size={13} /> : index + 1}</button>)}</div>
    <div className="exercise-question"><span className="small-label">{makeGame(exercise.moves).turn() === 'w' ? 'JUEGAN BLANCAS' : 'JUEGAN NEGRAS'}</span><h3>{exercise.title}</h3><p>{exercise.prompt}</p></div>
    <div aria-live="polite">
      {feedback === 'wrong' && <div className="exercise-feedback wrong"><Info size={20} /><div><strong>Hay una idea más precisa.</strong><p>La jugada es legal, pero no resuelve este ejercicio. Mira el objetivo y vuelve a intentarlo.</p></div></div>}
      {exerciseFinished && <motion.div className={`exercise-feedback ${feedback === 'correct' ? 'correct' : 'revealed'}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span>{feedback === 'correct' ? <CheckCheck size={23} /> : <Lightbulb size={23} />}</span><div><strong>{feedback === 'correct' ? '¡Esa es la idea!' : 'La jugada que buscábamos'} <span className="answer-san">{spanishSan(exercise.answer)}</span></strong><p>{exercise.explanation}</p>{feedback === 'revealed' && <small>Ver la solución no cuenta como ejercicio resuelto.</small>}</div></motion.div>}
      {showHint && !exerciseFinished && <div className="hint-content"><Lightbulb size={18} /><p>{exercise.hint}</p></div>}
    </div>
    <div className="practice-actions">{exerciseFinished ? <><button className="button button-primary" onClick={() => startExercise(exerciseIndex + 1)}>{exerciseIndex === exercises.length - 1 ? 'Volver a practicar' : 'Siguiente ejercicio'}<ArrowRight size={16} /></button><button className="text-button" onClick={() => startExercise(exerciseIndex)}><RotateCcw size={14} />Reintentar</button></> : <><button className="button button-outline" onClick={toggleHint}><Lightbulb size={16} />{showHint ? 'Ocultar pista' : 'Dame una pista'}</button><button className="text-button" onClick={revealAnswer}>Ver solución</button></>}</div>
    <div className="practice-tip"><MousePointer2 size={17} /><p>Haz clic en una pieza y después en su destino. También puedes arrastrarla.</p></div>
    {ui.solved.length === exercises.length && <div className="all-complete"><Crown size={24} /><h3>Las ideas ya son tuyas.</h3><p>Has resuelto los {exercises.length} ejercicios. Vuelve a las variantes para seguir profundizando.</p><button className="text-button" onClick={() => navigate('explorer')}>Explorar variantes<ArrowRight size={15} /></button></div>}
  </div>;
}
