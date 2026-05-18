import { Box, Stack, Typography } from "@mui/material";

const ReadOnlyField = ({ label, value, multiline = false }) => (
  <Box
    sx={{
      borderBottom: "1px solid",
      borderColor: "divider",
      py: 1.25,
      "&:last-of-type": {
        borderBottom: 0,
      },
    }}
  >
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 0.25,
            whiteSpace: multiline ? "pre-wrap" : "nowrap",
            overflow: multiline ? "visible" : "hidden",
            textOverflow: multiline ? "clip" : "ellipsis",
          }}
        >
          {value || "-"}
        </Typography>
      </Box>
    </Stack>
  </Box>
);

export default ReadOnlyField;
