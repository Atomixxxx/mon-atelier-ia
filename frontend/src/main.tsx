import React from "react";
import ReactDOM from "react-dom/client";
import ModernAtelierIA from "./App"; // <-- Respecte la casse exacte du fichier
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Aucun élément avec l'id 'root' trouvé dans index.html");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ModernAtelierIA />
  </React.StrictMode>
);
