import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider as JotaiProvider } from 'jotai'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <JotaiProvider>
        <App />
      </JotaiProvider>
    </BrowserRouter>
  </StrictMode>
);
