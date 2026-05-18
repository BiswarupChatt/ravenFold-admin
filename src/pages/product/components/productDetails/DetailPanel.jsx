import { Box, Stack, Typography } from "@mui/material";

const DetailPanel = ({ title, action, children }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      bgcolor: "background.paper",
      overflow: "hidden",
    }}
  >
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Typography variant="subtitle2" fontWeight={700}>
        {title}
      </Typography>
      {action}
    </Stack>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

export default DetailPanel;
