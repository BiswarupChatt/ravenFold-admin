import { Link } from "react-router-dom";
import DropdownMenu from "../../../../../components/DropdownMenu";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const NavItem = ({ item }) => {
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const renderMenuButton = (isOpen) => (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.5, // Tailwind gap-1
        px: 1.5, // Tailwind px-3
        py: 1,   // Tailwind py-2
        borderRadius: 1, // Tailwind rounded
        width: "100%",
        color: "text.primary",
        transition: theme.transitions.create("background-color", {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          bgcolor: "action.hover", // Tailwind hover:bg-accent
        },
      })}
    >
      {Icon && <Icon size={20} />}
      <Typography variant="body2">{item.name}</Typography>
      {hasChildren && (
        <Typography
          variant="body2"
          sx={{ ml: "auto", fontSize: "0.75rem" }}
        >
          {isOpen ? "▲" : "▼"}
        </Typography>
      )}
    </Box>
  );

  if (hasChildren) {
    return <DropdownMenu menuButton={renderMenuButton} items={item.children} />;
  }

  if (item.path) {
    return (
      <Button
        component={Link}
        to={item.path}
        fullWidth
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 1,
          borderRadius: 1,
          color: "text.primary",
          textTransform: "none",
          justifyContent: "flex-start",
          transition: theme.transitions.create("background-color", {
            duration: theme.transitions.duration.short,
          }),
          "&:hover": {
            bgcolor: "action.hover",
          },
        })}
      >
        {Icon && <Icon size={20} />}
        <Typography variant="body2">{item.name}</Typography>
      </Button>
    );
  }

  if (item.action) {
    return (
      <Button
        onClick={item.action}
        fullWidth
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 1,
          borderRadius: 1,
          textAlign: "left",
          color: "text.primary",
          textTransform: "none",
          justifyContent: "flex-start",
          transition: theme.transitions.create("background-color", {
            duration: theme.transitions.duration.short,
          }),
          "&:hover": {
            bgcolor: "action.hover",
          },
        })}
      >
        {Icon && <Icon size={20} />}
        <Typography variant="body2">{item.name}</Typography>
      </Button>
    );
  }

  return null;
};

export default NavItem;
