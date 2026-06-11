import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import SectionHeader from "@/components/SectionHeader";

const Review = () => (
  <Stack spacing={2}>
    <SectionHeader title="Review" />
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Review Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This page is not implemented yet.
      </Typography>
    </Paper>
  </Stack>
);

export default Review;
