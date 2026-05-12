import { Outlet, Navigate } from "react-router-dom";
import { Box, Container, Paper, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "../../lib/state/atoms/authAtoms";

const AuthLayout = () => {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 4 }}>
            Admin Panel
          </Typography>
          
          {/* Auth Pages (Login/Signup) will be rendered here */}
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
