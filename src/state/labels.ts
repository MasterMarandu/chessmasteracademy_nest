import type { View } from '../state/session.ts';

/** Etiqueta de la miga de pan: dónde estás dentro de la biblioteca. */
export const SECTION_LABELS: Record<View, string> = {
  italian: 'Apertura Italiana', explorer: 'Gambito Evans', tree: 'Árbol de variantes',
  ideas: 'Ideas y planes', traps: 'Patrones tácticos', defense: 'Defensa del Evans',
  repertoire: 'Mi repertorio', games: 'Partidas clásicas',
};

/**
 * Atributos de la entrada de navegación activa. Durante el entrenamiento no hay
 * sección activa detrás: sólo se resalta esa entrada.
 */
export function areaProps(target: View | View[], view: View, practice: boolean) {
  const views = Array.isArray(target) ? target : [target];
  const active = !practice && views.includes(view);
  return { className: active ? 'active' : '', 'aria-current': active ? 'page' as const : undefined };
}
