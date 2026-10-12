import { ArrowRight, Info, RotateCcw } from 'lucide-react';
import { games, italianLines, spanishSan, traps, TRUNK, variants } from '../data/evans';
import type { StudySession } from '../hooks/useStudySession';

/** El tronco común: el Giuoco Piano y las ramas que salen de esa posición. */
export default function ItalianPanel({ session }: { session: StudySession }) {
  const { openLesson: selectLesson, navigate, reset: resetStudy } = session;
  const trunkLine = TRUNK.map((move, index) => `${index % 2 === 0 ? `${index / 2 + 1}.` : ''}${spanishSan(move)}`).join(' ');
  return <>
    <div className="panel-intro"><div className="eyebrow">EL TRONCO COMÚN</div><h2>Giuoco Piano: la casa del Evans.</h2><p>Todo empieza en 1. e4 e5 2. Cf3 Cc6 3. Ac4 Ac5. Desde esa posición, las blancas deciden el carácter de la partida.</p></div>
    <div className="italian-trunk"><span className="small-label">POSICIÓN DEL TRONCO</span><strong>{trunkLine}</strong></div>
    <div className="list-heading"><h3>Tres caminos desde la misma posición</h3><span>{italianLines.length + 1} ramas</span></div>
    <div className="italian-map">
      {italianLines.map((line) => <button key={line.id} className="italian-branch" onClick={() => selectLesson(line)}>
        <span className="italian-branch-move">{`4. ${spanishSan(line.moves[TRUNK.length])}`}</span>
        <strong>{line.title}</strong>
        <p>{line.subtitle}</p>
        <em>Estudiar la línea<ArrowRight size={12} /></em>
      </button>)}
      <button className="italian-branch is-gambit" onClick={() => navigate('explorer')}>
        <span className="italian-branch-move">4. b4</span>
        <strong>Gambito Evans</strong>
        <p>El peón se entrega a cambio de tiempo y centro. Es el corazón de esta biblioteca: {variants.length} variantes, {traps.length} celadas y {games.length} partidas clásicas.</p>
        <em>Ir al explorador del Evans<ArrowRight size={12} /></em>
      </button>
    </div>
    <p className="quiet-note"><Info size={15} />c3 y d3 conservan el material y discuten el centro; b4 lo entrega a cambio de desarrollo. Ninguna es mejor en abstracto: son estilos distintos, y cada una pide un plan diferente.</p>
    <button className="button button-outline" onClick={resetStudy}><RotateCcw size={16} />Volver al tronco en el tablero</button>
  </>;
}
