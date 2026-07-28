import { getNavItems } from "./components/navConfig";
import NavItem from "./components/NavItem";
import { themeAtom } from "../../../../lib/state/atoms/settingsAtoms";
import { THEME_OPTIONS } from "../../../../utils/constants/themeOptions";

import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { useAtom } from "jotai";
import { useLogout } from "../../../../hooks/useLogout";

const Navbar = () => {
  const [theme, setTheme] = useAtom(themeAtom);
  const logout = useLogout();
  const isDarkMode = theme === THEME_OPTIONS.DARK;
  const navItems = getNavItems(logout);
  const themeToggleLabel = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? THEME_OPTIONS.LIGHT : THEME_OPTIONS.DARK);
  };

  return (
    <AppBar
      position="static"
      elevation={2}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        boxShadow: (theme) => theme.shadows[0],
        height: 64,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          px: 3,
          height: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            gap: 1.5,
            justifyContent: "flex-end",
          }}
        >
          <Tooltip title={themeToggleLabel}>
            <IconButton
              aria-label={themeToggleLabel}
              color="inherit"
              onClick={handleThemeToggle}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                height: 40,
                width: 40,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              {isDarkMode ? <WbSunnyRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {navItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
