import { Box, Stack, Typography } from "@mui/material";

const DetailPanel = ({ title, action, accentColor = "primary", children }) => (
  <Box
    sx={(theme) => {
      const palette = theme.palette[accentColor] || theme.palette.primary;

      return {
        border: "1px solid",
        borderColor: "divider",
        borderTop: "3px solid",
        borderTopColor: palette.main,
        borderRadius: 1,
        bgcolor: "background.paper",
        overflow: "hidden",
      };
    }}
  >
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      sx={(theme) => {
        const palette = theme.palette[accentColor] || theme.palette.primary;

        return {
          px: 2,
          py: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: `${palette.main}0F`,
        };
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={(theme) => {
            const palette = theme.palette[accentColor] || theme.palette.primary;

            return {
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: palette.main,
              boxShadow: `0 0 0 3px ${palette.main}22`,
              flexShrink: 0,
            };
          }}
        />
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Stack>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

export default DetailPanel;
