import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

// MUI
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Popper from "@mui/material/Popper";
import Grow from "@mui/material/Grow";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";

/**
 * Public API:
 * <DropdownMenu
 *   menuButton={<Button>Menu</Button> OR (open) => <Button>{open ? 'Close' : 'Menu'}</Button>}
 *   items={[{ name, path?, action?, icon?, children?: [...] }]}
 *   customWidth={200} // px
 * />
 */

const DropdownMenu = ({ menuButton, items, customWidth = 200 }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const toggleOpen = () => setOpen((prev) => !prev);
  const closeMenu = useCallback(() => setOpen(false), []);

  // Close on Esc
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <Box ref={anchorRef} sx={{ position: "relative", display: "inline-block", overflow: "visible" }}>
      <Box onClick={toggleOpen} sx={{ cursor: "pointer" }}>
        {typeof menuButton === "function" ? menuButton(open) : menuButton}
      </Box>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: "top left" }}>
            <Paper
              elevation={3}
              sx={{
                width: customWidth,
                bgcolor: "background.paper",
                borderRadius: 1,
              }}
            >
              <ClickAwayListener onClickAway={closeMenu}>
                <List sx={{ py: 0.5 }}>
                  {items.map((item, idx) => (
                    <DropdownMenuItem key={idx} item={item} closeRootMenu={closeMenu} />
                  ))}
                </List>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};

const DropdownMenuItem = ({ item, closeRootMenu }) => {
  const [subOpen, setSubOpen] = useState(false);
  const [placement, setPlacement] = useState("right-start"); // or "left-start"
  const itemRef = useRef(null);
  const subAnchorRef = useRef(null);

  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const Icon = item.icon;

  const decidePlacement = () => {
    const rect = itemRef.current?.getBoundingClientRect();
    if (!rect) return "right-start";
    const submenuWidth = 192; // similar to w-48 in original
    const viewportWidth = window.innerWidth;
    const preferLeft = rect.right + submenuWidth > viewportWidth - 20;
    return preferLeft ? "left-start" : "right-start";
  };

  const toggleSubmenu = (e) => {
    e.stopPropagation();
    if (!hasChildren) return;
    const next = !subOpen;
    if (next) setPlacement(decidePlacement());
    setSubOpen(next);
  };

  const handleClick = (e) => {
    if (hasChildren) {
      toggleSubmenu(e);
      return;
    }
    if (item.action) item.action();
    if (item.path) closeRootMenu();
  };

  // Close submenu on Esc
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSubOpen(false);
    if (subOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [subOpen]);

  const ButtonContent = (
    <ListItemButton
      ref={(node) => {
        itemRef.current = node;
        subAnchorRef.current = node;
      }}
      onClick={handleClick}
      sx={{
        px: 2,
        py: 1,
        borderRadius: 0.75,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {Icon && (
        <ListItemIcon sx={{ minWidth: 28 }}>
          <Icon size={18} />
        </ListItemIcon>
      )}
      <ListItemText
        primary={
          <Typography variant="body2" sx={{ color: "text.primary" }}>
            {item.name}
          </Typography>
        }
      />
      {hasChildren && (
        <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
          {subOpen ? "▲" : "▼"}
        </Typography>
      )}
    </ListItemButton>
  );

  // Render leaf item as Link when path exists
  if (!hasChildren && item.path) {
    return (
      <Box component={Link} to={item.path} onClick={closeRootMenu} sx={{ textDecoration: "none", color: "inherit" }}>
        {ButtonContent}
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      {ButtonContent}

      {hasChildren && (
        <Popper
          open={subOpen}
          anchorEl={subAnchorRef.current}
          placement={placement}
          transition
          style={{ zIndex: 1400 }}
          modifiers={[
            { name: "offset", options: { offset: [0, 0] } }, // snug to the parent
          ]}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              style={{ transformOrigin: placement.startsWith("left") ? "top right" : "top left" }}
            >
              <Paper
                elevation={6}
                sx={{
                  width: 192,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  py: 0.5,
                }}
              >
                <ClickAwayListener onClickAway={() => setSubOpen(false)}>
                  <List sx={{ py: 0.5 }}>
                    {item.children.map((subItem, idx) => (
                      <DropdownMenuItem key={`${subItem.name}-${idx}`} item={subItem} closeRootMenu={closeRootMenu} />
                    ))}
                  </List>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      )}
    </Box>
  );
};

export default DropdownMenu;
