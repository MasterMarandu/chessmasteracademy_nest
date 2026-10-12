import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  allLessons, BASE, baseNotes, exercises, italianLines, TRUNK, variants,
} from './evans.ts';
import { checkMold, MOLD, type MoldContent } from './contract.ts';

const italian: MoldContent = {
  id: 'italiana',
  name: 'Apertura Italiana',
  trunk: TRUNK,
  base: BASE,
  baseNotes,
  lessons: allLessons,
  exercises,
};

describe('molde de contenido', () => {
  it('el contenido publicado cumple el molde', () => {
    const report = checkMold(italian);
    assert.deepEqual(report.problems, [], 'el contenido actual no pasa la puerta de calidad');
    assert.equal(report.ok, true);
  });

  it('cuenta lo que hay, para poder mostrarlo', () => {
    const report = checkMold(italian);
    assert.equal(report.counts.variants, variants.length + italianLines.length);
    assert.equal(report.counts.exercises, exercises.length);
  });

  it('detecta contenido a medias', () => {
    const thin: MoldContent = {
      ...italian,
      lessons: [variants[0]],
      exercises: [exercises[0]],
      baseNotes: { 0: 'solo una nota' },
    };
    const report = checkMold(thin);
    assert.equal(report.ok, false);
    assert.ok(report.problems.some((problem) => problem.startsWith('Variantes:')), 'debe avisar de variantes insuficientes');
    assert.ok(report.problems.some((problem) => problem.startsWith('Celadas:')));
    assert.ok(report.problems.some((problem) => problem.startsWith('Ejercicios:')));
    assert.ok(report.problems.some((problem) => problem.startsWith('Notas del tronco:')));
  });

  it('exige que cada línea explique los dos bandos', () => {
    const silent: MoldContent = {
      ...italian,
      lessons: [{ ...variants[0], whitePlan: '', warning: '   ' }],
    };
    const report = checkMold(silent);
    assert.ok(report.problems.some((problem) => problem.includes('sin plan de blancas')));
    assert.ok(report.problems.some((problem) => problem.includes('sin el detalle que importa')));
  });

  it('exige una defensa real en cada celada', () => {
    const fake = { ...allLessons.find((lesson) => lesson.kind === 'trap')! };
    const report = checkMold({
      ...italian,
      lessons: [{ ...fake, defenseMoves: fake.moves }],
    });
    assert.ok(report.problems.some((problem) => problem.includes('la defensa repite la línea')));
  });

  it('admite la celada de orden de jugadas, que no tiene línea perdedora', () => {
    const order = allLessons.find((lesson) => lesson.orderTrap);
    assert.ok(order, 'debe existir la celada de orden de jugadas');
    assert.equal(order.defenseMoves, undefined);
    const report = checkMold({ ...italian, lessons: [order] });
    assert.ok(!report.problems.some((problem) => problem.includes('sin defensa reproducible')));
  });

  it('exige nota jugada a jugada en cada línea', () => {
    const bare: MoldContent = { ...italian, lessons: [{ ...variants[0], notes: {} }] };
    const report = checkMold(bare);
    assert.ok(report.problems.some((problem) => problem.includes('notas jugada a jugada')));
  });

  it('no deja pasar un ejercicio cuya respuesta es ilegal', () => {
    const broken: MoldContent = { ...italian, exercises: [{ ...exercises[0], answer: 'Dh8' }] };
    const report = checkMold(broken);
    assert.ok(report.problems.some((problem) => problem.includes('no es legal')));
  });

  it('publica los mínimos del molde para que se puedan citar', () => {
    assert.equal(MOLD.variants, 8);
    assert.equal(MOLD.traps, 2);
    assert.equal(MOLD.games, 2);
    assert.equal(MOLD.exercises, 6);
  });
});
