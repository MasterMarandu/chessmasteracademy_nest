import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { failed: boolean }

// Sin backend, una excepción de render dejaría la pantalla en blanco y la sesión perdida.
// Aquí se convierte en un aviso con salida: el repertorio y el progreso viven en localStorage.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fallo de la interfaz de estudio', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="crash-state" role="alert">
      <h1>Algo se rompió en esta pantalla.</h1>
      <p>Tu repertorio, tus ejercicios resueltos y tu progreso siguen guardados en este navegador. Reiniciar la aplicación debería bastar para continuar.</p>
      <button className="button button-primary" onClick={() => window.location.reload()}>Reiniciar la aplicación</button>
    </div>;
  }
}
