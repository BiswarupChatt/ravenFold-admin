import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import SidebarMenu from "./components/SidebarMenu";
import { SIDEBAR_ITEMS } from "./components/sidebarConfig";
import useResponsiveView from "../../../../hooks/useResponsiveView";
import CloseIcon from "../../../../assets/icons/CloseIcon";
import MenuIcon from "../../../../assets/icons/MenuIcon";
import { findMenuPathByPathname } from "../../../../utils/methods/mapPathnameToMenuPath";

// MUI imports
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

const OPEN_WIDTH = 256; // Tailwind w-64
const CLOSED_WIDTH = 60; // Tailwind w-15 (custom approx)

const Sidebar = () => {
  const { isDesktop } = useResponsiveView();
  const location = useLocation();

  const [isOpen, setIsSidebarOpen] = useState(false);
  const [activePath, setActivePath] = useState([]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    setIsSidebarOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    const matchedPath = findMenuPathByPathname(SIDEBAR_ITEMS, location.pathname);
    setActivePath(matchedPath ?? []);
  }, [location.pathname]);

  return (
    <Box
      sx={(theme) => ({
        bgcolor: "background.paper",
        color: "text.primary",
        boxShadow: theme.shadows[2],
        height: "100%",
        width: isOpen ? OPEN_WIDTH : CLOSED_WIDTH,
        transition: theme.transitions.create("width", {
          duration: theme.transitions.duration.standard,
        }),
        display: "flex",
        flexDirection: "column",
      })}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 2,
        }}
      >
        {isOpen && (
          <Typography variant="h6" fontWeight={700}>
            Admin Panel
          </Typography>
        )}
        <IconButton
          onClick={toggleSidebar}
          sx={{ ml: "auto" }}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? (
            <CloseIcon />
          ) : (
            <MenuIcon style={{ width: 24, height: 24, color: "#3b82f6" }} />
          )}
        </IconButton>
      </Box>

      {/* Sidebar Items */}
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          px: 1,
          pb: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          overflowY: "auto",
        }}
      >
        {SIDEBAR_ITEMS.map((item) => (
          <SidebarMenu
            key={item.name}
            item={item}
            isOpen={isOpen}
            activePath={activePath}
            setActivePath={setActivePath}
            currentPath={[item.name]}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Sidebar;
