import { useEffect, useRef } from 'react';
import { allLessons } from '../data/evans.ts';
import { formatPath, parseUrl, type AppLocation } from '../state/location.ts';
import type { StudySession } from './useStudySession.ts';

const KNOWN_LESSONS = new Set(allLessons.map((lesson) => lesson.id));

/** Abrir el HTML desde disco prohíbe pushState: en ese caso se enruta con hash. */
function useHashRouting() {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}

function readLocation(): AppLocation | null {
  if (typeof window === 'undefined') return null;
  return parseUrl(window.location.href, KNOWN_LESSONS);
}

function writeLocation(path: string) {
  if (typeof window === 'undefined') return;
  if (useHashRouting()) {
    const target = `#${path}`;
    if (window.location.hash !== target) window.location.hash = target;
    return;
  }
  if (window.location.pathname !== path) window.history.pushState(null, '', path);
}

/**
 * Mantiene sincronizados el estado de estudio y la barra de direcciones:
 * cada sección y cada lección tienen enlace propio, y el botón atrás funciona.
 */
export function useUrlRouting(session: StudySession) {
  const { view, lesson, mode, restore } = session;
  const current = { view, lessonId: lesson?.id ?? null, exerciseIndex: mode.kind === 'practice' ? mode.index : null };
  const currentRef = useRef(current);
  currentRef.current = current;
  const restoreRef = useRef(restore);
  useEffect(() => { restoreRef.current = restore; });

  // El estado se refleja en la URL; sólo se escribe si de verdad cambia.
  useEffect(() => {
    const target = formatPath(current);
    const location = readLocation();
    if (location && formatPath(location) === target) return;
    writeLocation(target);
  }, [current.view, current.lessonId, current.exerciseIndex]);

  // La URL manda cuando cambia por el historial del navegador.
  useEffect(() => {
    const apply = () => {
      const location = readLocation();
      if (!location) return;
      if (formatPath(location) === formatPath(currentRef.current)) return;
      restoreRef.current(location);
    };
    apply();
    window.addEventListener('popstate', apply);
    window.addEventListener('hashchange', apply);
    return () => {
      window.removeEventListener('popstate', apply);
      window.removeEventListener('hashchange', apply);
    };
  }, []);
}
