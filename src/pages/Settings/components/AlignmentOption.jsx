import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

export const AlignmentOption = ({
  label,
  value,
  currentValue,
  onChange,
  description,
}) => {
  const isActive = currentValue === value;

  return (
    <Paper
      variant="outlined"
      onClick={() => onChange(value)}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderRadius: 2,
        borderColor: isActive
          ? theme.palette.primary.main
          : theme.palette.divider,
        cursor: "pointer",
        transition: "border-color 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.text.secondary,
        },
      })}
    >
      {/* Left section: Radio + text */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Radio
            checked={isActive}
            onChange={() => onChange(value)}
            value={value}
            name={label}
            size="small"
            sx={{
              color: "primary.main",
              "&.Mui-checked": { color: "primary.main" },
            }}
          />
          <Typography
            variant="body1"
            fontWeight={500}
            color="text.primary"
            sx={{ cursor: "pointer" }}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Typography>
        </Box>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, ml: 4 }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {/* Right section: visual icon box */}
      <Box
        sx={(theme) => ({
          ml: 2,
          width: 32,
          height: 32,
          borderRadius: 1,
          border: `2px solid ${isActive
              ? theme.palette.primary.main
              : theme.palette.divider
            }`,
          bgcolor: isActive
            ? theme.palette.primary.main + "1A" // 10% opacity
            : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isActive
            ? theme.palette.primary.main
            : theme.palette.text.secondary,
        })}
      >
        {value === "left" ? (
          <svg
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M17 4a1 1 0 01-1 1h-1.586l-2.293 2.293a1 1 0 01-1.414-1.414L13 3.586V2a1 1 0 012 0v2z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </Box>
    </Paper>
  );
};
