import { allLessons, exercises, makeGame } from '../data/evans.ts';
import { INITIAL_SESSION, sessionReducer, type SessionState, type View } from './session.ts';

/** La apertura activa. Con el catálogo multi-apertura esto pasará a ser un parámetro. */
export const OPENING_SLUG = 'italiana';

export const SECTION_SLUGS: Record<View, string> = {
  italian: 'italiana',
  explorer: 'explorador',
  tree: 'arbol',
  ideas: 'ideas',
  traps: 'celadas',
  defense: 'defensa',
  repertoire: 'repertorio',
  games: 'partidas',
};
export const PRACTICE_SLUG = 'entrenamiento';

const VIEW_BY_SLUG = new Map<string, View>(
  Object.entries(SECTION_SLUGS).map(([view, slug]) => [slug, view as View]),
);

export interface AppLocation {
  view: View;
  lessonId: string | null;
  exerciseIndex: number | null;
}

export const DEFAULT_LOCATION: AppLocation = { view: 'explorer', lessonId: null, exerciseIndex: null };

/** Ruta canónica: /italiana/celadas/fork-f7 o /italiana/entrenamiento/2 */
export function formatPath(location: AppLocation): string {
  const parts = [OPENING_SLUG];
  if (location.exerciseIndex !== null) parts.push(PRACTICE_SLUG, String(location.exerciseIndex));
  else {
    parts.push(SECTION_SLUGS[location.view]);
    if (location.lessonId) parts.push(location.lessonId);
  }
  return `/${parts.join('/')}`;
}

/**
 * Acepta las dos formas: /italiana/celadas y #/italiana/celadas.
 * La segunda permite abrir el HTML directamente desde disco, donde pushState no está permitido.
 */
export function parseUrl(input: string, knownLessons: Set<string>): AppLocation | null {
  const hash = input.includes('#') ? input.slice(input.indexOf('#') + 1) : '';
  const raw = hash || input.replace(/^[a-z]+:\/\/[^/]+/i, '').split('?')[0];
  const segments = raw.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  if (!segments.length) return null;
  if (segments[0] === OPENING_SLUG) segments.shift();
  if (!segments.length) return DEFAULT_LOCATION;

  if (segments[0] === PRACTICE_SLUG) {
    const index = Number(segments[1] ?? 0);
    const safe = Number.isInteger(index) ? Math.min(Math.max(index, 0), exercises.length - 1) : 0;
    return { view: 'explorer', lessonId: null, exerciseIndex: safe };
  }

  const view = VIEW_BY_SLUG.get(segments[0]);
  if (!view) return null;
  const lessonId = segments[1] && knownLessons.has(segments[1]) ? segments[1] : null;
  return { view, lessonId, exerciseIndex: null };
}

/** Lo que hay que escribir en la barra de direcciones para el estado actual. */
export function locationFromState(state: SessionState): AppLocation {
  if (state.mode.kind === 'practice') {
    return { view: state.view, lessonId: null, exerciseIndex: state.mode.index };
  }
  return { view: state.view, lessonId: state.lessonId, exerciseIndex: null };
}

/** Estado inicial reconstruido desde un enlace: sin parpadeo de la vista por defecto. */
export function stateFromLocation(location: AppLocation | null): SessionState {
  if (!location) return INITIAL_SESSION;
  const base = sessionReducer(INITIAL_SESSION, { type: 'navigate', view: location.view });
  if (location.exerciseIndex !== null) {
    const moves = exercises[location.exerciseIndex].moves;
    return sessionReducer(base, {
      type: 'openPractice', index: location.exerciseIndex, moves,
      side: makeGame(moves).turn() === 'b' ? 'black' : 'white',
    });
  }
  if (location.lessonId) {
    const lesson = allLessons.find((item) => item.id === location.lessonId);
    if (lesson) return sessionReducer(base, { type: 'openLesson', lesson });
  }
  return base;
}

const KNOWN_LESSONS = new Set(allLessons.map((lesson) => lesson.id));

/** Lee la barra de direcciones actual. Devuelve null fuera del navegador (pruebas, SSR). */
export function currentLocation(): AppLocation | null {
  if (typeof window === 'undefined') return null;
  return parseUrl(window.location.href, KNOWN_LESSONS);
}
