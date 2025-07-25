import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app"; // ✅ CORRECTION : Import du bon composant
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Aucun élément avec l'id 'root' trouvé dans index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);