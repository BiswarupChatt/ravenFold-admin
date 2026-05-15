import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";

export default function PageWrapper({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: 2,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          px:  2,
        }}
      >
        <Box
          sx={{
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
