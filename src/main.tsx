import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { browserStorage, migrateLegacyKeys } from "./storage";

// Una sola pasada: mueve el repertorio y el progreso de las claves antiguas a las nuevas.
const storage = browserStorage();
if (storage) migrateLegacyKeys(storage);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
