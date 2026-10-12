import type { Lesson } from '../data/evans.ts';
import type { StudySession } from '../hooks/useStudySession.ts';

/** Lo que los paneles necesitan de la aplicación y no forma parte de la sesión de estudio. */
export interface StudyUi {
  saved: string[];
  solved: string[];
  completed: string[];
  toggleSaved: (lesson: Lesson) => void;
  toggleCompleted: (lessonId: string) => void;
  /** Descarga en PGN la línea abierta en el tablero. */
  exportLesson: () => void;
  /** Copia la posición actual al portapapeles (con modal de reserva si el navegador no deja). */
  copyFen: () => void;
  /** Descarga en PGN una colección de líneas: el repertorio guardado. */
  exportRepertoire: (items: Lesson[]) => void;
}

export interface PanelProps {
  session: StudySession;
  ui: StudyUi;
}
