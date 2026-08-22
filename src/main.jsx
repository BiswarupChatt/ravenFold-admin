import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { HashRouter } from "react-router-dom";
import { Provider as JotaiProvider } from 'jotai'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <JotaiProvider>
        <App />
      </JotaiProvider>
    </HashRouter>
  </StrictMode>
);
