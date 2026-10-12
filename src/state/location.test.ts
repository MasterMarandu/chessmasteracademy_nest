import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { allLessons, exercises, LESSON_IDS } from '../data/evans.ts';
import { INITIAL_SESSION } from './session.ts';
import {
  DEFAULT_LOCATION, formatPath, locationFromState, parseUrl, stateFromLocation, type AppLocation,
} from './location.ts';

const known = new Set(allLessons.map((lesson) => lesson.id));
const parse = (url: string) => parseUrl(url, known);

describe('rutas de la aplicación', () => {
  it('escribe y vuelve a leer cada ruta sin pérdida', () => {
    const locations: AppLocation[] = [
      { view: 'explorer', lessonId: null, exerciseIndex: null },
      { view: 'italian', lessonId: null, exerciseIndex: null },
      { view: 'tree', lessonId: LESSON_IDS.lasker, exerciseIndex: null },
      { view: 'traps', lessonId: 'fork-f7', exerciseIndex: null },
      { view: 'defense', lessonId: LESSON_IDS.modern, exerciseIndex: null },
      { view: 'games', lessonId: 'evergreen', exerciseIndex: null },
      { view: 'repertoire', lessonId: null, exerciseIndex: null },
      { view: 'explorer', lessonId: null, exerciseIndex: 3 },
    ];
    for (const location of locations) {
      const path = formatPath(location);
      assert.deepEqual(parse(path), location, `ida y vuelta fallida para ${path}`);
    }
  });

  it('acepta rutas y hashes, con o sin origen', () => {
    const expected: AppLocation = { view: 'traps', lessonId: 'fork-f7', exerciseIndex: null };
    assert.deepEqual(parse('/italiana/celadas/fork-f7'), expected);
    assert.deepEqual(parse('#/italiana/celadas/fork-f7'), expected);
    assert.deepEqual(parse('http://localhost:5173/italiana/celadas/fork-f7'), expected);
    assert.deepEqual(parse('file:///C:/app/dist/index.html#/italiana/celadas/fork-f7'), expected);
    assert.deepEqual(parse('/italiana/celadas/fork-f7?ref=compartido'), expected);
    assert.deepEqual(parse('/italiana/celadas/fork-f7/'), expected, 'la barra final no debe romper la ruta');
    assert.deepEqual(parse('/italiana/celadas/'), { view: 'traps', lessonId: null, exerciseIndex: null }, 'sin lección, la sección se abre igual');
  });

  it('cae en la sección por defecto cuando falta el tramo de sección', () => {
    assert.deepEqual(parse('/'), null);
    assert.deepEqual(parse('/italiana'), DEFAULT_LOCATION);
    assert.deepEqual(parse('/italiana/'), DEFAULT_LOCATION);
  });

  it('ignora una lección desconocida en lugar de romper', () => {
    assert.deepEqual(parse('/italiana/celadas/no-existe'), { view: 'traps', lessonId: null, exerciseIndex: null });
  });

  it('rechaza rutas de otra apertura o de una sección inexistente', () => {
    assert.equal(parse('/escocesa/explorador'), null, 'una apertura sin contenido no debe cargar nada');
    assert.equal(parse('/italiana/inventada'), null);
  });

  it('reconstruye el estado inicial desde el enlace', () => {
    const onLesson = stateFromLocation({ view: 'traps', lessonId: 'fork-f7', exerciseIndex: null });
    assert.equal(onLesson.view, 'traps');
    assert.equal(onLesson.lessonId, 'fork-f7');
    assert.equal(onLesson.ply, allLessons.find((lesson) => lesson.id === 'fork-f7')?.startPly);
    assert.equal(onLesson.mode.kind, 'study');

    const onExercise = stateFromLocation({ view: 'explorer', lessonId: null, exerciseIndex: 2 });
    assert.equal(onExercise.mode.kind, 'practice');
    assert.deepEqual(onExercise.moves, exercises[2].moves);

    assert.deepEqual(stateFromLocation(null), INITIAL_SESSION);
  });

  it('describe el estado actual, incluido el entrenamiento', () => {
    assert.deepEqual(locationFromState(INITIAL_SESSION), { view: 'explorer', lessonId: null, exerciseIndex: null });
    const practice = stateFromLocation({ view: 'explorer', lessonId: null, exerciseIndex: 5 });
    assert.deepEqual(locationFromState(practice), { view: 'explorer', lessonId: null, exerciseIndex: 5 });
    assert.equal(formatPath(locationFromState(practice)), '/italiana/entrenamiento/5');
  });
});
