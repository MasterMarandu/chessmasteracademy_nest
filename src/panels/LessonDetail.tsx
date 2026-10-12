import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bookmark, Check, CheckCheck, Copy, Download, Info, Play, Shield, Zap } from 'lucide-react';
import IconButton from '../components/IconButton';
import SharpnessMeter from '../components/SharpnessMeter';
import { sharpness, sharpnessLabel, spanishSan } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';
import type { StudyUi } from './types';

/** Ficha de una línea: planes de ambos bandos, el detalle que importa y la continuación. */
export default function LessonDetail({ session, ui }: { session: StudySession; ui: StudyUi }) {
  const {
    view, lesson, moves, ply, planSide, setPlanSide, jumpTo, loadDefense, navigate, isMode,
  } = session;
  if (!lesson) return null;
  const defenseLine = isMode('defense');
  const whiteDefender = lesson.kind === 'trap' && lesson.defendingSide === 'white';
  const attackingPlan = whiteDefender ? lesson.blackPlan : lesson.whitePlan;
  const defendingPlan = whiteDefender ? lesson.whitePlan : lesson.blackPlan;
  return <div>
    <div className="detail-topline"><button className="back-link" onClick={() => navigate(view)}><ArrowLeft size={15} />{view === 'italian' ? 'La apertura italiana' : view === 'repertoire' ? 'Mi repertorio' : lesson.kind === 'trap' ? 'Todas las celadas' : lesson.kind === 'game' ? 'Partidas clásicas' : 'Todas las variantes'}</button><span className={`level level-${lesson.level.toLowerCase()}`}>{lesson.level}</span></div>
    <div className="detail-title-row"><h2>{lesson.title}</h2><IconButton label={ui.saved.includes(lesson.id) ? 'Quitar del repertorio' : 'Guardar en mi repertorio'} onClick={() => ui.toggleSaved(lesson)} className={ui.saved.includes(lesson.id) ? 'is-saved' : ''}><Bookmark size={21} fill={ui.saved.includes(lesson.id) ? 'currentColor' : 'none'} /></IconButton></div>
    <div className="detail-meta"><p className="detail-notation">{lesson.notation}</p><p className="detail-sharp"><span>Agudeza</span><SharpnessMeter id={lesson.id} size="lg" /><em>{sharpnessLabel(sharpness[lesson.id] ?? 3)}</em></p></div>
    <p className="detail-description">{lesson.description}</p>
    <div className="plan-switch" role="group" aria-label="Plan por bando">
      <button aria-pressed={planSide === 'white'} className={planSide === 'white' ? 'active' : ''} onClick={() => setPlanSide('white')}>{whiteDefender ? <Zap size={14} /> : <span className="side-dot white" />}{whiteDefender ? 'La idea táctica' : 'Plan de blancas'}</button>
      <button aria-pressed={planSide === 'black'} className={planSide === 'black' ? 'active' : ''} onClick={() => setPlanSide('black')}><Shield size={14} />Cómo defenderte</button>
    </div>
    <AnimatePresence mode="wait"><motion.div key={planSide} className="plan-content" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <h3>{planSide === 'white' ? whiteDefender ? 'Reconoce la amenaza.' : 'Juega con un propósito.' : whiteDefender ? 'Evita la trampa con blancas.' : 'Neutraliza la iniciativa.'}</h3>
      <p>{planSide === 'white' ? attackingPlan : defendingPlan}</p>
      {planSide === 'black' && lesson.defenseMoves && <button className="text-button" onClick={loadDefense}><Play size={14} />Ver la defensa en el tablero<ArrowRight size={14} /></button>}
    </motion.div></AnimatePresence>
    <div className="watch-out"><span><Info size={17} /></span><div><h4>El detalle que importa</h4><p>{lesson.warning}</p></div></div>
    <div className="continuation-heading"><h3>{defenseLine ? 'La defensa alternativa' : 'La continuación'}</h3><span>Haz clic para explorar</span></div>
    <div className="detail-moves">{moves.map((move, index) => <span key={index} className="detail-move-wrap">{index % 2 === 0 && <span className="move-number">{Math.floor(index / 2) + 1}.</span>}<button onClick={() => jumpTo(index + 1)} className={ply === index + 1 ? 'active' : ''}>{spanishSan(move)}</button></span>)}</div>
    <div className="detail-actions"><button className="button button-outline" onClick={() => ui.toggleCompleted(lesson.id)}>{ui.completed.includes(lesson.id) ? <CheckCheck size={17} /> : <Check size={17} />}{ui.completed.includes(lesson.id) ? 'Estudiada' : 'Marcar como estudiada'}</button><IconButton label="Descargar esta línea en PGN" onClick={ui.exportLesson}><Download size={18} /></IconButton><IconButton label="Copiar posición FEN" onClick={ui.copyFen}><Copy size={17} /></IconButton></div>
    {lesson.source && <a className="source-link" href={lesson.source} target="_blank" rel="noreferrer">Consultar la fuente<ArrowRight size={12} /></a>}
  </div>;
}
