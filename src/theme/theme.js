import { createTheme } from "@mui/material/styles";

export const getTheme = (mode = "light") =>
    createTheme({
        palette: {
            mode,
            ...(mode === "light"
                ? {
                    background: { default: "#f9fafb", paper: "#ffffff" },
                    primary: { main: "#3b82f6" },
                    secondary: { main: "#6366f1" },
                }
                : {
                    background: { default: "#0f172a", paper: "#1e293b" },
                    primary: { main: "#60a5fa" },
                    secondary: { main: "#818cf8" },
                }),
        },
        shape: { borderRadius: 8 },
        typography: {
            fontFamily: `"Inter", "Roboto", "Helvetica", "Arial", sans-serif`,
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                    },
                },
            },
        },
    });
