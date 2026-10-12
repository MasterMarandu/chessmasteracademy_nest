import type { Lesson } from '../data/evans.ts';
import type { StudySession } from '../hooks/useStudySession.ts';

/** Lo que los paneles necesitan de la aplicación y no forma parte de la sesión de estudio. */
export interface StudyUi {
  saved: string[];
  solved: string[];
  completed: string[];
  toggleSaved: (lesson: Lesson) => void;
  toggleCompleted: (lessonId: string) => void;
  notify: (tone: 'ok' | 'error', text: string) => void;
  closeSearch: () => void;
}

export interface PanelProps {
  session: StudySession;
  ui: StudyUi;
}
