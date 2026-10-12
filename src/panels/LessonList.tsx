import { motion } from 'framer-motion';
import { ArrowRight, Bookmark, Check, ChevronRight, Crown, Zap } from 'lucide-react';
import type { Lesson } from '../data/evans.ts';
import IconButton from '../components/IconButton';
import SharpnessMeter from '../components/SharpnessMeter';
import type { PanelProps } from './types';

/** Lista de líneas: la usan el explorador, las celadas, las partidas, la defensa y el repertorio. */
export default function LessonList({ items, session, ui, showLevel = true }: PanelProps & { items: Lesson[]; showLevel?: boolean }) {
  const { view, openLesson: selectLesson } = session;
  return <div className="variant-list">{items.map((item, index) => <motion.div className="variant-list-item" key={item.id}
    initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-8px' }}
    transition={{ duration: 0.34, delay: Math.min(index * 0.045, 0.25), ease: 'easeOut' }}>
    <button className={`variant-row ${item.id === 'main' && view === 'explorer' ? 'recommended' : ''}`} onClick={() => selectLesson(item)}>
      <span className={`variant-symbol ${item.kind === 'trap' ? 'tactical' : ''}`}>{item.kind === 'trap' ? <Zap size={19} /> : item.kind === 'game' ? <Crown size={20} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</span>
      <span className="variant-copy"><span className="variant-title">{item.title}{ui.completed.includes(item.id) && <Check size={13} className="completed-tick" />}</span><span className="variant-notation">{item.notation}</span></span>
      <span className="row-meta">
        {item.id === 'main' && view === 'explorer' ? <span className="recommended-cta"><span>Explorar línea<ArrowRight size={12} /></span></span> : showLevel && <span className={`level level-${item.level.toLowerCase()}`}>{item.level}</span>}
        <SharpnessMeter id={item.id} />
      </span>
      <ChevronRight size={16} className="row-chevron" />
    </button>
    {view === 'repertoire' && <IconButton label={`Quitar ${item.title} del repertorio`} onClick={() => ui.toggleSaved(item)}><Bookmark size={17} fill="currentColor" /></IconButton>}
  </motion.div>)}</div>;
}
