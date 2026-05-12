import { getNavItems } from "./components/navConfig";
import NavItem from "./components/NavItem";
import { ITEM_ALIGNMENTS } from "../../../../utils/constants/itemsAlignment";
import { navitemAlignmentsAtom } from "../../../../lib/state/atoms/settingsAtoms";

import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { useAtom } from "jotai";
import { useLogout } from "../../../../hooks/useLogout";

const Navbar = () => {
  const [navitemAlignments] = useAtom(navitemAlignmentsAtom);
  const alignLeft = navitemAlignments === ITEM_ALIGNMENTS.LEFT;
  const logout = useLogout();

  const navItems = getNavItems(logout);

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
            gap: 2,
            justifyContent: alignLeft ? "flex-start" : "flex-end",
          }}
        >
          {navItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
