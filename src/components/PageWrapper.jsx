import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";

export default function PageWrapper({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        minWidth: 0,
        bgcolor: "background.default",
        py: 2,
        overflowX: "hidden",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          px: 2,
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            bgcolor: "background.paper",
            borderRadius: 2,
            px: 3,
            py: 4,
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}
