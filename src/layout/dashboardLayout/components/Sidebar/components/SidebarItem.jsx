import { Link, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const SidebarItem = ({ item, isOpen, expanded, onToggle }) => {
  const location = useLocation();
  const isActive = item.path && location.pathname === item.path;
  const Icon = item.icon;

  const baseStyles = (theme) => ({
    display: "flex",
    alignItems: "center",
    px: 1.5,
    py: 1,
    borderRadius: 1,
    textDecoration: "none",
    color: "text.primary",
    transition: theme.transitions.create(["background-color", "color", "width"], {
      duration: theme.transitions.duration.short,
    }),
    "&:hover": {
      bgcolor: "action.hover",
    },
    width: isOpen ? "100%" : 40,
    minWidth: isOpen ? "auto" : 40,
    height: isOpen ? "auto" : 40,
    justifyContent: isOpen ? "flex-start" : "center",
    overflow: "hidden",
  });

  return item.path ? (
    <Button
      component={Link}
      to={item.path}
      onClick={onToggle}
      sx={(theme) => ({
        ...baseStyles(theme),
        textTransform: "none",
        my: 0.5,
        // ✅ Keep highlight only for active items (unchanged)
        bgcolor: isActive ? "action.selected" : "transparent",
        fontWeight: isActive ? 600 : 400,
      })}
      fullWidth={isOpen} // ✅ changed from `fullWidth` to `fullWidth={isOpen}`
    >
      {Icon && <Icon size={20} />}
      {isOpen && (
        <Typography variant="body2" sx={{ ml: 1.5 }}>
          {item.name}
        </Typography>
      )}
    </Button>
  ) : (
    <Button
      onClick={onToggle}
      sx={(theme) => ({
        ...baseStyles(theme),
        textTransform: "none",
        bgcolor: expanded ? "action.selected" : "transparent",
      })}
      fullWidth={isOpen} // ✅ changed here too
    >
      {Icon && <Icon size={20} />}
      {isOpen && (
        <Typography variant="body2" sx={{ ml: 1.5 }}>
          {item.name}
        </Typography>
      )}
      {isOpen && item.children && (
        <Typography variant="caption" sx={{ ml: "auto", fontSize: "0.75rem" }}>
          {expanded ? "▲" : "▶"}
        </Typography>
      )}
    </Button>
  );
};

export default SidebarItem;
