import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LESSON_IDS } from './data/evans.ts';
import {
  migrateLegacyKeys, NAMESPACE, OPENING_ID, readProgress, readStoredIds, storeKey, writeStoredIds,
  type StorageLike,
} from './storage.ts';

function fakeStorage(seed: Record<string, string> = {}): StorageLike & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
    removeItem: (key) => { map.delete(key); },
    dump: () => Object.fromEntries(map),
  };
}

const lessons = new Set(['main', 'lasker', 'no-existe-mas']);

describe('almacenamiento', () => {
  it('construye claves con espacio de nombres por apertura', () => {
    assert.equal(storeKey('italiana', 'saved'), `${NAMESPACE}.italiana.saved`);
    assert.notEqual(storeKey('italiana', 'saved'), storeKey('escocesa', 'saved'));
  });

  it('migra las claves antiguas del Evans sin perder datos', () => {
    const storage = fakeStorage({
      'evans-repertoire-v1': JSON.stringify([LESSON_IDS.lasker]),
      'evans-studied-v1': JSON.stringify([LESSON_IDS.main]),
      'evans-exercises-v1': JSON.stringify(['offer']),
    });
    const migrated = migrateLegacyKeys(storage);

    assert.equal(migrated.length, 3);
    assert.deepEqual(JSON.parse(storage.getItem(storeKey(OPENING_ID, 'saved')) ?? '[]'), [LESSON_IDS.lasker]);
    assert.deepEqual(JSON.parse(storage.getItem(storeKey(OPENING_ID, 'studied')) ?? '[]'), [LESSON_IDS.main]);
    assert.deepEqual(JSON.parse(storage.getItem(storeKey(OPENING_ID, 'solved')) ?? '[]'), ['offer']);
    assert.equal(storage.getItem('evans-repertoire-v1'), null, 'la clave vieja se retira tras copiarla');
  });

  it('es idempotente: la segunda pasada no toca nada', () => {
    const storage = fakeStorage({ 'evans-studied-v1': JSON.stringify([LESSON_IDS.main]) });
    migrateLegacyKeys(storage);
    const after = storage.dump();
    assert.deepEqual(migrateLegacyKeys(storage), []);
    assert.deepEqual(storage.dump(), after);
  });

  it('no pisa un progreso más reciente con una clave vieja', () => {
    const storage = fakeStorage({
      'evans-studied-v1': JSON.stringify([LESSON_IDS.main]),
      [storeKey(OPENING_ID, 'studied')]: JSON.stringify([LESSON_IDS.modern, LESSON_IDS.lasker]),
    });
    migrateLegacyKeys(storage);
    assert.deepEqual(
      JSON.parse(storage.getItem(storeKey(OPENING_ID, 'studied')) ?? '[]'),
      [LESSON_IDS.modern, LESSON_IDS.lasker],
      'manda lo que ya estaba en la clave nueva',
    );
    assert.equal(storage.getItem('evans-studied-v1'), null);
  });

  it('descarta datos corruptos sin lanzar', () => {
    const storage = fakeStorage({ 'evans-studied-v1': '{no es json' });
    assert.deepEqual(migrateLegacyKeys(storage), []);
    assert.equal(storage.getItem('evans-studied-v1'), null);
  });

  it('ignora identificadores que ya no existen en la biblioteca', () => {
    const storage = fakeStorage({ [storeKey(OPENING_ID, 'saved')]: JSON.stringify(['lasker', 'retirada', 'main']) });
    assert.deepEqual(readStoredIds(storage, OPENING_ID, 'saved', lessons), ['lasker', 'main']);
  });

  it('resume el progreso de una apertura sin cargar su contenido', () => {
    const storage = fakeStorage({ [storeKey(OPENING_ID, 'studied')]: JSON.stringify(['main', 'fantasma']) });
    const progress = readProgress(storage, OPENING_ID, lessons);
    assert.deepEqual(progress, { studied: 1, total: 3, ratio: 1 / 3 });
    assert.deepEqual(readProgress(storage, 'escocesa', lessons), { studied: 0, total: 3, ratio: 0 });
  });

  it('funciona sin almacenamiento disponible', () => {
    assert.deepEqual(readStoredIds(null, OPENING_ID, 'saved', lessons), []);
    assert.doesNotThrow(() => writeStoredIds(null, OPENING_ID, 'saved', ['main']));
    assert.deepEqual(readProgress(null, OPENING_ID, lessons), { studied: 0, total: 3, ratio: 0 });
  });

  it('no revienta si el almacenamiento lanza al escribir', () => {
    const hostile: StorageLike = {
      getItem: () => null,
      setItem: () => { throw new Error('modo privado'); },
      removeItem: () => { throw new Error('modo privado'); },
    };
    assert.doesNotThrow(() => writeStoredIds(hostile, OPENING_ID, 'saved', ['main']));
    assert.doesNotThrow(() => migrateLegacyKeys(hostile));
  });
});
