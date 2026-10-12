import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, Crown, GitBranch, Info, RotateCcw, Zap } from 'lucide-react';
import { allLessons, games, sharpness, spanishSan, type Lesson } from '../data/evans';

interface TreeNode {
  san: string;
  ply: number;
  path: string[];
  children: TreeNode[];
  tags: { id: string; title: string; kind: Lesson['kind'] }[];
}

interface Entry { id: string; title: string; kind: Lesson['kind']; moves: string[] }

function buildTree(): TreeNode {
  const root: TreeNode = { san: '', ply: 0, path: [], children: [], tags: [] };
  const entries: Entry[] = allLessons.filter((lesson) => lesson.kind !== 'game').flatMap((lesson) => [
    { id: lesson.id, title: lesson.title, kind: lesson.kind, moves: lesson.moves },
    ...(lesson.defenseMoves
      ? [{ id: `${lesson.id}-def`, title: 'La defensa', kind: 'variant' as const, moves: lesson.defenseMoves }]
      : []),
  ]);

  for (const entry of entries) {
    let node = root;
    entry.moves.forEach((san, index) => {
      let next = node.children.find((child) => child.san === san);
      if (!next) {
        next = { san, ply: index + 1, path: [...node.path, san], children: [], tags: [] };
        node.children.push(next);
      }
      node = next;
      if (index === entry.moves.length - 1 && !node.tags.some((tag) => tag.title === entry.title)) {
        node.tags.push({ id: entry.id, title: entry.title, kind: entry.kind });
      }
    });
  }
  return root;
}

export default function VariationTree({ moves, ply, onSelect }: {
  moves: string[];
  ply: number;
  onSelect: (path: string[], nodePly: number) => void;
}) {
  const tree = useMemo(buildTree, []);
  const activeKey = moves.slice(0, ply).join('/');
  const ancestors = useMemo(() => {
    const set = new Set<string>(['']);
    for (let index = 1; index <= Math.min(ply, moves.length); index += 1) set.add(moves.slice(0, index).join('/'));
    return set;
  }, [moves, ply]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['']));

  useEffect(() => {
    setExpanded((current) => {
      const next = new Set(current);
      ancestors.forEach((key) => next.add(key));
      return next;
    });
  }, [ancestors]);

  const toggle = useCallback((key: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const lineCount = allLessons.filter((lesson) => lesson.kind !== 'game').length;

  const renderNodes = (node: TreeNode, depth: number): ReactNode => node.children.map((child) => {
    const key = child.path.join('/');
    const isCurrent = key === activeKey;
    const onPath = ancestors.has(key);
    const branches = child.children.length;
    const open = expanded.has(key);
    const heat = child.tags.reduce((max, tag) => Math.max(max, sharpness[tag.id] ?? 0), 0);
    return (
      <li key={key} className="tree-node">
        <div className={`tree-row${onPath ? ' on-path' : ''}${isCurrent ? ' current' : ''}`}>
          <span className="tree-indent" style={{ width: `${depth * 10}px` }} aria-hidden="true" />
          {child.ply % 2 === 1 && <span className="tree-number">{(child.ply + 1) / 2}.</span>}
          <button type="button" className="tree-move" onClick={() => onSelect(child.path, child.ply)}
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={`Jugada ${spanishSan(child.san)}. Cargar esa línea en el tablero.`}>
            {spanishSan(child.san)}
          </button>
          {heat >= 4 && <span className={`tree-heat heat-${heat}`} title={`Agudeza ${heat} de 5`} aria-label={`Agudeza ${heat} de 5`} />}
          {child.tags.map((tag) => (
            <button type="button" key={tag.id} className={`tree-tag ${tag.kind}`} onClick={() => onSelect(child.path, child.ply)} title={tag.title}>
              {tag.kind === 'trap' ? <Zap size={10} /> : tag.kind === 'game' ? <Crown size={10} /> : <GitBranch size={10} />}
              <span>{tag.title}</span>
            </button>
          ))}
          {branches > 0 && (
            <button type="button" className="tree-toggle" aria-expanded={open}
              aria-label={`${open ? 'Ocultar' : 'Mostrar'} ${branches} continuación${branches === 1 ? '' : 'es'} después de ${spanishSan(child.san)}`}
              onClick={() => toggle(key)}>
              <span>{branches}</span><ChevronRight size={11} className={open ? 'is-open' : ''} />
            </button>
          )}
        </div>
        {branches > 0 && open && <ul className="tree-children">{renderNodes(child, depth + 1)}</ul>}
      </li>
    );
  });

  return (
    <div className="tree-panel">
      <div className="tree-head">
        <div>
          <div className="eyebrow">TODO EL GAMBITO EN UN MAPA</div>
          <h3>El árbol de variantes</h3>
        </div>
        <button type="button" className="text-button" onClick={() => onSelect([], 0)}><RotateCcw size={13} />Desde el inicio</button>
      </div>
      <p className="tree-help"><Info size={14} />Toca una jugada para llevarla al tablero. Los números indican cuántas continuaciones hay guardadas en esa casilla y el punto marca las líneas más agudas.</p>
      <div className="tree-current">
        <span className="small-label">LÍNEA ACTUAL</span>
        {ply === 0 ? <em>Posición inicial</em> : (
          <span className="tree-current-line">
            {moves.slice(0, ply).map((move, index) => <b key={index} className={index % 2 === 0 ? 'w' : 'b'}>{spanishSan(move)}</b>)}
          </span>
        )}
      </div>
      <ul className="tree-root">
        <li className="tree-node">
          <div className={`tree-row root-row${ply === 0 ? ' current' : ''}`}>
            <button type="button" className="tree-start" onClick={() => onSelect([], 0)}>Posición inicial · 1. e4 e5 2. Cf3 Cc6 3. Ac4 Ac5 4. b4</button>
          </div>
          <ul className="tree-children root-children">{renderNodes(tree, 0)}</ul>
        </li>
      </ul>
      <div className="tree-footer">
        <GitBranch size={14} />
        <span>{lineCount} líneas cargadas</span>
        <em>Las {games.length} partidas clásicas se estudian aparte.</em>
      </div>
    </div>
  );
}
