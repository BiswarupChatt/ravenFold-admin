import { Outlet, Navigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "../../lib/state/atoms/authAtoms";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import PageWrapper from "../../components/PageWrapper";
import Box from "@mui/material/Box";

const DashboardLayout = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <Box display="flex" height="100vh" width="100dvw" overflow="hidden" flexDirection="row">
      <Sidebar />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Navbar />

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            bgcolor: "background.default",
            color: "text.primary",
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <PageWrapper>
            <Outlet />
          </PageWrapper>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
