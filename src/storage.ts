export const NAMESPACE = 'chessx';

export type Slot = 'saved' | 'studied' | 'solved';

/** Apertura activa. Con el catálogo multi-apertura, esto llegará por parámetro. */
export const OPENING_ID = 'italiana';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Claves del producto anterior, acopladas al Evans. Se migran una vez. */
const LEGACY_KEYS: [string, Slot][] = [
  ['evans-repertoire-v1', 'saved'],
  ['evans-studied-v1', 'studied'],
  ['evans-exercises-v1', 'solved'],
];

export const storeKey = (openingId: string, slot: Slot) => `${NAMESPACE}.${openingId}.${slot}`;

/** En algunos modos de privacidad, hasta leer `localStorage` lanza. */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

interface StoredList { present: boolean; ids: string[] }

/** Distingue "no hay clave" de "hay algo ilegible": lo segundo se descarta, no se conserva. */
function readArray(storage: StorageLike, key: string): StoredList {
  let raw: string | null = null;
  try { raw = storage.getItem(key); } catch { return { present: false, ids: [] }; }
  if (raw === null) return { present: false, ids: [] };
  try {
    const parsed: unknown = JSON.parse(raw);
    return {
      present: true,
      ids: Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [],
    };
  } catch {
    return { present: true, ids: [] };
  }
}

/**
 * Mueve el progreso y el repertorio guardados con las claves antiguas a las nuevas.
 * Sólo borra la clave vieja después de copiarla, y nunca pisa contenido más reciente.
 */
export function migrateLegacyKeys(storage: StorageLike, openingId = OPENING_ID): string[] {
  const migrated: string[] = [];
  for (const [legacyKey, slot] of LEGACY_KEYS) {
    const legacy = readArray(storage, legacyKey);
    if (!legacy.present) continue;
    const target = storeKey(openingId, slot);
    const existing = readArray(storage, target);
    try {
      if (legacy.ids.length > 0 && existing.ids.length === 0) {
        storage.setItem(target, JSON.stringify(legacy.ids));
        migrated.push(legacyKey);
      }
      storage.removeItem(legacyKey);
    } catch { /* sin almacenamiento disponible: no hay nada que migrar */ }
  }
  return migrated;
}

/** Lee una lista guardada descartando identificadores que ya no existen en la biblioteca. */
export function readStoredIds(
  storage: StorageLike | null, openingId: string, slot: Slot, valid: Set<string>,
): string[] {
  if (!storage) return [];
  return readArray(storage, storeKey(openingId, slot)).ids.filter((id) => valid.has(id));
}

export function writeStoredIds(
  storage: StorageLike | null, openingId: string, slot: Slot, ids: readonly string[],
): void {
  if (!storage) return;
  try {
    storage.setItem(storeKey(openingId, slot), JSON.stringify(ids));
  } catch { /* el estudio sigue funcionando sin persistencia */ }
}

export interface OpeningProgress {
  studied: number;
  total: number;
  ratio: number;
}

/** Resumen barato para el selector de aperturas: no necesita cargar el contenido. */
export function readProgress(
  storage: StorageLike | null, openingId: string, valid: Set<string>,
): OpeningProgress {
  const studied = readStoredIds(storage, openingId, 'studied', valid).length;
  const total = valid.size;
  return { studied, total, ratio: total === 0 ? 0 : studied / total };
}
