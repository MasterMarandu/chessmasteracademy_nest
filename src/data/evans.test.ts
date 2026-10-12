import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Chess } from 'chess.js';
import {
  allLessons, BASE, baseNotes, exercises, games, libraryErrors,
  makeGame, normalizeSearch, sharpness, sharpnessLabel, spanishSan, traps, variants,
  type Lesson,
} from './evans.ts';

const LESSON_KINDS = ['variant', 'trap', 'game'];
const FAMILIES = ['accepted', 'declined', 'other'];
const LEVELS = ['Esencial', 'Intermedia', 'Avanzada'];

function replay(moves: string[]): Chess {
  const game = new Chess();
  moves.forEach((move, index) => {
    assert.doesNotThrow(() => game.move(move), `jugada ilegal en el ply ${index + 1}: ${move}`);
  });
  return game;
}

describe('biblioteca de líneas', () => {
  it('no acumula errores en su propia validación de módulo', () => {
    assert.deepEqual(libraryErrors, []);
  });

  it('reproduce todas las líneas y defensas alternativas', () => {
    for (const lesson of allLessons) {
      replay(lesson.moves);
      if (lesson.defenseMoves) replay(lesson.defenseMoves);
    }
  });

  it('empieza cada variante y celada desde la posición del gambito', () => {
    for (const lesson of [...variants, ...traps]) {
      const opening = lesson.moves.slice(0, BASE.length).join(' ');
      assert.equal(opening, BASE.join(' '), `${lesson.id} no arranca desde la posición base`);
    }
  });

  it('mantiene identificadores únicos', () => {
    const ids = allLessons.map((lesson) => lesson.id);
    assert.equal(new Set(ids).size, ids.length);
    const exerciseIds = exercises.map((exercise) => exercise.id);
    assert.equal(new Set(exerciseIds).size, exerciseIds.length);
  });

  it('respeta los valores permitidos de tipo, familia y nivel', () => {
    for (const lesson of allLessons) {
      assert.ok(LESSON_KINDS.includes(lesson.kind), `${lesson.id}: kind inválido`);
      assert.ok(FAMILIES.includes(lesson.family), `${lesson.id}: family inválida`);
      assert.ok(LEVELS.includes(lesson.level), `${lesson.id}: level inválido`);
    }
    assert.ok(variants.every((lesson) => lesson.kind === 'variant'));
    assert.ok(traps.every((lesson) => lesson.kind === 'trap'));
    assert.ok(games.every((lesson) => lesson.kind === 'game'));
  });

  it('sitúa startPly dentro de la línea', () => {
    for (const lesson of allLessons) {
      assert.ok(lesson.startPly >= 0 && lesson.startPly <= lesson.moves.length,
        `${lesson.id}: startPly ${lesson.startPly} fuera de [0, ${lesson.moves.length}]`);
    }
  });

  it('sólo comenta posiciones que existen', () => {
    const withinBounds = (lesson: Lesson, notes: Record<number, string>) => {
      for (const key of Object.keys(notes)) {
        const ply = Number(key);
        assert.ok(Number.isInteger(ply) && ply >= 0 && ply <= lesson.moves.length,
          `${lesson.id}: la nota ${ply} está fuera de [0, ${lesson.moves.length}]`);
      }
    };
    for (const lesson of allLessons) withinBounds(lesson, lesson.notes);
    for (const key of Object.keys(baseNotes)) {
      assert.ok(Number(key) <= BASE.length, `baseNotes: la nota ${key} supera la posición base`);
    }
  });

  it('declara defensas alternativas legales y distintas de la línea principal', () => {
    let declared = 0;
    for (const trap of traps) {
      const defense = trap.defenseMoves;
      if (!defense) continue;
      declared += 1;
      replay(defense);
      assert.notEqual(defense.join(' '), trap.moves.join(' '), `${trap.id}: la defensa repite la línea principal`);
    }
    assert.ok(declared > 0, 'ninguna celada ofrece una defensa alternativa');
  });

  it('asigna una agudeza de 1 a 5 a cada lección', () => {
    for (const lesson of allLessons) {
      const value = sharpness[lesson.id];
      assert.ok(Number.isInteger(value) && value >= 1 && value <= 5, `${lesson.id}: agudeza ${value}`);
      assert.ok(sharpnessLabel(value).length > 0);
    }
    assert.equal(Object.keys(sharpness).length, allLessons.length, 'hay entradas de agudeza sin lección');
  });
});

describe('motivos tácticos verificados', () => {
  it('remata con mate las líneas anunciadas como mate', () => {
    for (const id of ['poisoned-rook', 'evergreen']) {
      const lesson = allLessons.find((item) => item.id === id);
      assert.ok(lesson, `falta la lección ${id}`);
      assert.ok(makeGame(lesson.moves).isCheckmate(), `${id}: la línea no termina en mate`);
    }
  });

  it('mantiene el peón de c3 clavado hasta que las blancas enrocan', () => {
    const line = [...BASE, 'Bxb4', 'c3', 'Ba5', 'd4', 'exd4'];
    const pinned = makeGame(line);
    assert.ok(!pinned.moves().includes('cxd4'), 'cxd4 no debería ser legal con el rey en e1');
    pinned.move('O-O');
    pinned.move('d6');
    assert.ok(pinned.moves().includes('cxd4'), 'el enroque debe habilitar cxd4');
  });

  it('confirma el mate que Fine no llegó a ver', () => {
    const finale = [...games[1].moves, 'Qxg3', 'Bf6#'];
    assert.ok(makeGame(finale).isCheckmate());
  });

  it('resuelve cada ejercicio con una jugada legal de quien mueve', () => {
    for (const exercise of exercises) {
      const position = makeGame(exercise.moves);
      const mover = position.turn();
      const answer = position.move(exercise.answer);
      assert.equal(answer.color, mover, `${exercise.id}: la respuesta no la juega quien tiene el turno`);
      assert.ok(position.history().length === exercise.moves.length + 1);
    }
  });
});

describe('utilidades', () => {
  it('respeta el ply solicitado', () => {
    assert.equal(makeGame(BASE, 0).history().length, 0);
    assert.equal(makeGame(BASE, 4).history().length, 4);
    assert.equal(makeGame(BASE).turn(), 'b');
  });

  it('traduce la notación algebraica al español', () => {
    assert.equal(spanishSan('Nf3'), 'Cf3');
    assert.equal(spanishSan('Qxd8+'), 'Dxd8+');
    assert.equal(spanishSan('Bxf7+'), 'Axf7+');
    assert.equal(spanishSan('Rxe7+'), 'Txe7+');
    assert.equal(spanishSan('O-O'), 'O-O');
  });

  it('normaliza la búsqueda sin acentos ni mayúsculas', () => {
    assert.equal(normalizeSearch('Defensa Clásica'), 'defensa clasica');
    assert.equal(normalizeSearch('Mieses'), normalizeSearch('MIESES'));
  });
});
