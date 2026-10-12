import { useMemo, useState } from 'react';
import { ChevronRight, Crown, GitBranch, Search, Zap } from 'lucide-react';
import Modal from './Modal';
import { allLessons, games, italianLines, normalizeSearch, traps, type Lesson } from '../data/evans';

/** Buscador de la biblioteca: filtra por título, subtítulo y notación. */
export default function SearchModal({ onSelect, onClose }: {
  onSelect: (lesson: Lesson) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const needle = normalizeSearch(query);
    return allLessons.filter((item) => normalizeSearch(`${item.title} ${item.subtitle} ${item.notation}`).includes(needle));
  }, [query]);

  return <Modal title="Encuentra tu próxima línea" onClose={onClose} className="search-modal">
    <div className="search-input-wrap"><Search size={20} /><input data-autofocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Giuoco Piano, Lasker, f7..." aria-label="Buscar líneas, celadas y partidas" /></div>
    <div className="search-results"><span className="small-label">{results.length} RESULTADOS EN LA BIBLIOTECA</span>{results.length ? results.map((item) => <button className="search-result" key={item.id} onClick={() => onSelect(item)}><span>{item.kind === 'trap' ? <Zap size={18} /> : item.kind === 'game' ? <Crown size={18} /> : <GitBranch size={18} />}</span><span><strong>{item.title}</strong><small>{item.notation}</small></span><ChevronRight size={16} /></button>) : <div className="search-empty"><Search size={26} /><p>No encontramos esa línea.</p><span>Prueba con una defensa, una jugada o un nombre.</span></div>}</div>
    <div className="search-footer"><kbd>ESC</kbd>para cerrar<span>{allLessons.length} líneas · {italianLines.length} italianas · {traps.length} patrones · {games.length} partidas</span></div>
  </Modal>;
}
