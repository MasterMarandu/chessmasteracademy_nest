import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { games, lessonById, TRUNK } from '../data/evans.ts';
import { buildPgn } from './pgn.ts';

const EVERGREEN = games[0];
const PIANISSIMO = lessonById('giuoco-pianissimo');

describe('exportador PGN', () => {
  it('la línea original conserva sus metadatos y su resultado', () => {
    const pgn = buildPgn(EVERGREEN, EVERGREEN.moves);
    assert.match(pgn, /\[Event "Anderssen vs\. Dufresne"\]/);
    assert.match(pgn, /\[White "Adolf Anderssen"\]/);
    assert.match(pgn, /\[Black "Jean Dufresne"\]/);
    assert.match(pgn, /\[Date "1852"\]/);
    assert.match(pgn, /\[Result "1-0"\]/);
    assert.match(pgn, /\[ECO "C52"\]/);
  });

  it('las notas viajan con la línea como comentarios', () => {
    const pgn = buildPgn(EVERGREEN, EVERGREEN.moves);
    assert.match(pgn, /\{Te1 ocupa la columna del rey negro\.\}/);
  });

  it('el análisis libre no dice que es la línea original', () => {
    const sequence = EVERGREEN.moves.slice(0, 10);
    const pgn = buildPgn(EVERGREEN, sequence);
    assert.match(pgn, /\[Event "Análisis libre a partir de Anderssen vs\. Dufresne"\]/);
    assert.match(pgn, /\[White "Adolf Anderssen"\]/, 'los jugadores son del contexto, no de la secuencia');
    assert.match(pgn, /\[Result "\*"\]/, 'una secuencia truncada no hereda el resultado');
    assert.doesNotMatch(pgn, /\{/, 'sin notas: sólo la línea original las lleva');
  });

  it('sin lección, los metadatos son genéricos y honestos', () => {
    const pgn = buildPgn(null, [...TRUNK, 'b4', 'Bxb4', 'c3']);
    assert.match(pgn, /\[Event "Análisis libre · Apertura Italiana"\]/);
    assert.match(pgn, /\[White "Blancas"\]/);
    assert.match(pgn, /\[Black "Negras"\]/);
    assert.match(pgn, /\[Date "\?\?\?\?\.\?\?\.\?\?"\]/);
    assert.match(pgn, /\[Result "\*"\]/);
    assert.doesNotMatch(pgn, /\[ECO/, 'el ECO sólo se declara donde está verificado');
  });

  it('las líneas italianas no llevan código ECO', () => {
    assert.doesNotMatch(buildPgn(PIANISSIMO, PIANISSIMO.moves), /\[ECO/);
  });

  it('la notación se mantiene en SAN estándar, traducible al español aparte', () => {
    const pgn = buildPgn(EVERGREEN, EVERGREEN.moves);
    assert.match(pgn, /1\. e4 e5 2\. Nf3 Nc6 3\. Bc4 Bc5 4\. b4/);
  });
});
