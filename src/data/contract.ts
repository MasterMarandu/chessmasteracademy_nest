import { makeGame, type Exercise, type Lesson } from './evans.ts';

/**
 * El "molde Evans": lo que hace que una apertura sea un curso y no una lista de jugadas.
 * Es la puerta de calidad que debe pasar cualquier contenido nuevo antes de publicarse.
 */
export const MOLD = {
  variants: 8,
  traps: 2,
  games: 2,
  exercises: 6,
  baseNotes: 5,
  notesPerLine: 3,
} as const;

export interface MoldContent {
  id: string;
  name: string;
  trunk: string[];
  base: string[];
  baseNotes: Record<number, string>;
  lessons: Lesson[];
  exercises: Exercise[];
}

export interface MoldReport {
  id: string;
  name: string;
  ok: boolean;
  problems: string[];
  counts: { variants: number; traps: number; games: number; exercises: number };
}

const filled = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0;

/** Comprueba un bloque de contenido completo contra el molde. No lanza: informa. */
export function checkMold(content: MoldContent): MoldReport {
  const problems: string[] = [];
  const variants = content.lessons.filter((lesson) => lesson.kind === 'variant');
  const traps = content.lessons.filter((lesson) => lesson.kind === 'trap');
  const games = content.lessons.filter((lesson) => lesson.kind === 'game');

  const short = (label: string, have: number, need: number) => {
    if (have < need) problems.push(`${label}: ${have} de ${need} mínimas`);
  };
  short('Variantes', variants.length, MOLD.variants);
  short('Celadas', traps.length, MOLD.traps);
  short('Partidas comentadas', games.length, MOLD.games);
  short('Ejercicios', content.exercises.length, MOLD.exercises);

  if (content.baseNotes === undefined || Object.keys(content.baseNotes).length < MOLD.baseNotes) {
    problems.push(`Notas del tronco: ${Object.keys(content.baseNotes ?? {}).length} de ${MOLD.baseNotes} mínimas`);
  }
  if (content.base.slice(0, content.trunk.length).join(' ') !== content.trunk.join(' ')) {
    problems.push('La línea de presentación no arranca desde el tronco');
  }

  const notesIn = (lesson: Lesson) => Object.values(lesson.notes ?? {}).filter(filled).length;
  for (const lesson of content.lessons) {
    const where = `${lesson.title}`;
    if (!filled(lesson.title) || !filled(lesson.subtitle) || !filled(lesson.notation)) {
      problems.push(`${where}: falta título, subtítulo o notación`);
    }
    if (!filled(lesson.description)) problems.push(`${where}: sin descripción`);
    if (!filled(lesson.whitePlan)) problems.push(`${where}: sin plan de blancas`);
    if (!filled(lesson.blackPlan)) problems.push(`${where}: sin plan de negras`);
    if (!filled(lesson.warning)) problems.push(`${where}: sin el detalle que importa`);
    if (notesIn(lesson) < MOLD.notesPerLine) {
      problems.push(`${where}: ${notesIn(lesson)} notas jugada a jugada (mínimo ${MOLD.notesPerLine})`);
    }
    if (lesson.kind === 'trap' && !lesson.orderTrap) {
      const defense = lesson.defenseMoves;
      if (!defense?.length) problems.push(`${where}: celada sin defensa reproducible`);
      else if (defense.join(' ') === lesson.moves.join(' ')) problems.push(`${where}: la defensa repite la línea`);
    }
    if (lesson.kind === 'game' && !lesson.players) problems.push(`${where}: partida sin jugadores`);
  }

  for (const exercise of content.exercises) {
    if (!filled(exercise.prompt) || !filled(exercise.hint) || !filled(exercise.explanation)) {
      problems.push(`Ejercicio ${exercise.title}: falta enunciado, pista o explicación`);
    }
    try { makeGame([...exercise.moves, exercise.answer]); }
    catch { problems.push(`Ejercicio ${exercise.title}: la respuesta no es legal en esa posición`); }
  }

  return {
    id: content.id,
    name: content.name,
    ok: problems.length === 0,
    problems,
    counts: { variants: variants.length, traps: traps.length, games: games.length, exercises: content.exercises.length },
  };
}
