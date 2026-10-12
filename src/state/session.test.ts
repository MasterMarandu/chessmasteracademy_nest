import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lessonById, LESSON_IDS, TRUNK, BASE } from '../data/evans.ts';
import { INITIAL_SESSION, isFlipped, isPractice, sessionReducer, type SessionState } from './session.ts';

const lasker = lessonById(LESSON_IDS.lasker);
const main = lessonById(LESSON_IDS.main);

const run = (state: SessionState, ...actions: Parameters<typeof sessionReducer>[1][]) =>
  actions.reduce(sessionReducer, state);

describe('sesión de estudio', () => {
  it('arranca en el explorador, con el tablero desde las blancas', () => {
    assert.equal(INITIAL_SESSION.view, 'explorer');
    assert.equal(INITIAL_SESSION.mode.kind, 'study');
    assert.equal(isFlipped(INITIAL_SESSION), false);
  });

  it('al abrir una lección limpia la orientación manual anterior', () => {
    // El fallo original: venías de una línea negra y la siguiente seguía del revés.
    const rotated = run(INITIAL_SESSION, { type: 'rotate' });
    assert.equal(isFlipped(rotated), true, 'girar el tablero lo pone del revés');

    const opened = run(rotated, { type: 'openLesson', lesson: lasker, side: 'black' });
    assert.equal(opened.orientation, null, 'abrir una lección descarta el giro manual');
    assert.equal(opened.studySide, 'black', 'las tarjetas de defensa la estudian con negras');
    assert.equal(isFlipped(opened), true);

    const backToWhite = run(opened, { type: 'openLesson', lesson: main });
    assert.equal(backToWhite.studySide, 'white');
    assert.equal(isFlipped(backToWhite), false, 'una línea de blancas vuelve a orientar el tablero');
  });

  it('girar el tablero no miente sobre el lado de estudio', () => {
    const rotated = run(INITIAL_SESSION, { type: 'rotate' });
    assert.equal(rotated.studySide, 'white', 'el lado de estudio no cambia al girar');
    assert.equal(rotated.planSide, 'white', 'el plan mostrado tampoco cambia');
    assert.equal(isFlipped(rotated), true);

    const unrotated = run(rotated, { type: 'rotate' });
    assert.equal(unrotated.orientation, null);
    assert.equal(isFlipped(unrotated), false, 'volver a pulsar devuelve la orientación de estudio');
  });

  it('elegir lado sincroniza estudio, orientación y plan', () => {
    const state = run(INITIAL_SESSION, { type: 'rotate' }, { type: 'chooseSide', side: 'black' });
    assert.equal(state.studySide, 'black');
    assert.equal(state.orientation, null);
    assert.equal(state.planSide, 'black');
  });

  it('el árbol y las ideas conservan la línea abierta', () => {
    const studying = run(INITIAL_SESSION, { type: 'openLesson', lesson: lasker });
    const tree = run(studying, { type: 'navigate', view: 'tree' });
    assert.equal(tree.lessonId, lasker.id, 'el árbol mantiene la lección');
    assert.deepEqual(tree.moves, lasker.moves);

    const ideas = run(tree, { type: 'navigate', view: 'ideas' });
    assert.equal(ideas.lessonId, lasker.id);

    const explorer = run(ideas, { type: 'navigate', view: 'explorer' });
    assert.equal(explorer.lessonId, null, 'el explorador sí vuelve a la lista');
    assert.deepEqual(explorer.moves, BASE);
  });

  it('entrar en la sección italiana parte del tronco, no del gambito', () => {
    const state = run(INITIAL_SESSION, { type: 'navigate', view: 'italian' });
    assert.deepEqual(state.moves, TRUNK);
    assert.equal(state.ply, TRUNK.length);
  });

  it('la sección de defensa se estudia con negras', () => {
    const state = run(INITIAL_SESSION, { type: 'navigate', view: 'defense' });
    assert.equal(state.studySide, 'black');
    assert.equal(isFlipped(state), true);
  });

  it('los modos son excluyentes: explorar abandona la defensa alternativa', () => {
    // Antes podían convivir defenseLine y freeAnalysis a la vez.
    const defending = run(INITIAL_SESSION, {
      type: 'loadDefense', moves: main.defenseMoves ?? main.moves, ply: 12, side: 'black',
    });
    assert.equal(defending.mode.kind, 'defense');

    const exploring = run(defending, { type: 'exploreFreely', moves: [...defending.moves, 'd5'], ply: 13 });
    assert.equal(exploring.mode.kind, 'free');
    assert.equal(exploring.mode.kind === 'free' && exploring.mode.origin.ply, 12, 'guarda el punto de retorno');
  });

  it('el análisis libre recuerda el origen aunque se encadenen jugadas', () => {
    const lesson = run(INITIAL_SESSION, { type: 'openLesson', lesson: main });
    const first = run(lesson, { type: 'exploreFreely', moves: [...lesson.moves, 'd5'], ply: lesson.ply + 1 });
    const second = run(first, { type: 'exploreFreely', moves: [...first.moves, 'Na5'], ply: first.ply + 1 });
    assert.equal(second.mode.kind === 'free' && second.mode.origin.moves.length, lesson.moves.length);
    assert.equal(second.mode.kind === 'free' && second.mode.origin.lessonId, main.id);
  });

  it('la práctica no permite reproducir ni girar por su cuenta', () => {
    const practice = run(INITIAL_SESSION, {
      type: 'openPractice', index: 0, moves: [...BASE, 'Bxb4'], side: 'white',
    });
    assert.ok(isPractice(practice));
    assert.equal(practice.studySide, 'white');
    assert.equal(run(practice, { type: 'togglePlayback' }).playing, false, 'sin reproducción en el entrenamiento');
    assert.equal(run(practice, { type: 'toggleHint' }).mode.kind === 'practice'
      && (run(practice, { type: 'toggleHint' }).mode as { hint: boolean }).hint, true);
  });

  it('resolver un ejercicio fija el resultado y retira la pista', () => {
    const practice = run(INITIAL_SESSION, { type: 'openPractice', index: 2, moves: BASE, side: 'white' });
    const hinted = run(practice, { type: 'toggleHint' });
    const solved = run(hinted, { type: 'practiceCorrect', moves: [...BASE, 'b4'], ply: BASE.length + 1 });
    assert.equal(solved.mode.kind === 'practice' && solved.mode.feedback, 'correct');
    assert.equal(solved.mode.kind === 'practice' && solved.mode.hint, false);
    assert.equal(solved.ply, BASE.length + 1);

    const wrong = run(practice, { type: 'practiceWrong' });
    assert.equal(wrong.mode.kind === 'practice' && wrong.mode.feedback, 'wrong');
    assert.deepEqual(wrong.moves, practice.moves, 'un fallo no mueve la posición');

    const revealed = run(practice, { type: 'revealAnswer', moves: [...BASE, 'b4'], ply: BASE.length + 1 });
    assert.equal(revealed.mode.kind === 'practice' && revealed.mode.feedback, 'revealed');
  });

  it('avanzar, retroceder y reproducir respetan los límites', () => {
    const lesson = run(INITIAL_SESSION, { type: 'openLesson', lesson: main });
    const atEnd = run(lesson, { type: 'jumpTo', ply: 999 });
    assert.equal(atEnd.ply, main.moves.length);
    assert.equal(run(lesson, { type: 'jumpTo', ply: -5 }).ply, 0);

    const restarted = run(atEnd, { type: 'togglePlayback' });
    assert.equal(restarted.ply, 0);
    assert.equal(restarted.playing, true);
    assert.equal(run(restarted, { type: 'pause' }).playing, false);

    const ticking = run({ ...atEnd, playing: true }, { type: 'tick' }, { type: 'tick' });
    assert.equal(ticking.ply, main.moves.length, 'la reproducción se detiene al final');

    const advanced = run(lesson, { type: 'advance', san: main.moves[lesson.ply] });
    assert.equal(advanced.ply, lesson.ply + 1);
    assert.equal(advanced.playing, false);
  });

  it('filtrar variantes repliega la lista completa', () => {
    const expanded = run(INITIAL_SESSION, { type: 'toggleShowAll' });
    assert.equal(expanded.showAll, true);
    const filtered = run(expanded, { type: 'setFamily', family: 'declined' });
    assert.equal(filtered.family, 'declined');
    assert.equal(filtered.showAll, false);
  });

  it('volver a la posición del estudio restaura la línea y el modo', () => {
    const lesson = run(INITIAL_SESSION, { type: 'openLesson', lesson: main });
    const exploring = run(lesson, { type: 'exploreFreely', moves: [...lesson.moves, 'd5'], ply: lesson.ply + 1 });
    const restored = run(exploring, { type: 'reset', moves: main.moves, ply: main.startPly });
    assert.equal(restored.mode.kind, 'study');
    assert.equal(restored.ply, main.startPly);
    assert.deepEqual(restored.moves, main.moves);
  });
});
