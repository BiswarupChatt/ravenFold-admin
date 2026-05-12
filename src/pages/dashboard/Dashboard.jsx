import { Box, Paper, Typography } from "@mui/material";
import SectionHeader from "@/components/SectionHeader";

const Dashboard = () => {
  return (
    <>
      <SectionHeader title="Dashboard" />
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Admin Template
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use this protected dashboard area as the starting point for your admin modules.
          </Typography>
        </Box>
      </Paper>
    </>
  );
};

export default Dashboard;
