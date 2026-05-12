import { Outlet, Navigate } from "react-router-dom";
import { useAtom } from "jotai";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "../../lib/state/atoms/authAtoms";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import PageWrapper from "../../components/PageWrapper";
import { ITEM_ALIGNMENTS } from "../../utils/constants/itemsAlignment";
import { sidebarAlignmentAtom } from "../../lib/state/atoms/settingsAtoms";
import Box from "@mui/material/Box";

const DashboardLayout = () => {
  const [sidebarAlignment] = useAtom(sidebarAlignmentAtom);
  const isLeft = sidebarAlignment === ITEM_ALIGNMENTS.LEFT;
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <Box display="flex" height="100vh" flexDirection="row">
      {isLeft && <Sidebar />}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar isLeft={isLeft} />

        <Box
          component="main"
          sx={{
            flex: 1,
            bgcolor: "background.default",
            color: "text.primary",
            overflow: "auto",
            direction: isLeft ? "ltr" : "rtl",
          }}
        >
          {isLeft ? (
            <PageWrapper>
              <Outlet />
            </PageWrapper>
          ) : (
            <Box sx={{ width: "100%", direction: "ltr" }}>
              <PageWrapper>
                <Outlet />
              </PageWrapper>
            </Box>
          )}
        </Box>
      </Box>

      {!isLeft && <Sidebar />}
    </Box>
  );
};

export default DashboardLayout;
