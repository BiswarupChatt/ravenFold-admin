import { useMemo } from "react";
import { useRoutes } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { useAtomValue } from "jotai";

import { appRoutes } from "./routes/dashboardRoutes";
import { getTheme } from "./theme/theme";
import { themeAtom } from "./lib/state/atoms/settingsAtoms";
import StateBootstrap from "./lib/state/StateBootstrap";
import { ToastProvider } from "./hooks/ToastContext";

export default function App() {
  const themeMode = useAtomValue(themeAtom);

  const theme = useMemo(() => {
    // Handle cases where themeMode might be an object or undefined
    let mode = 'light'; // default

    if (typeof themeMode === 'string') {
      mode = themeMode;
    } else if (themeMode && typeof themeMode === 'object') {
      // If it's an object, try to extract the value
      mode = themeMode.value || themeMode.theme || 'light';
    }

    return getTheme(mode);
  }, [themeMode]);

  const routes = useRoutes(appRoutes);

  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <StateBootstrap />
        <CssBaseline />
        {routes}
      </ToastProvider>
    </ThemeProvider>
  );
}