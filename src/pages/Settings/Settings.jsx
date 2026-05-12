import { useAtom } from "jotai";

import {
  sidebarAlignmentAtom,
  navitemAlignmentsAtom,
  themeAtom,
} from "../../lib/state/atoms/settingsAtoms.js";

import { LineBreaker } from "../../components/LineBreaker";
import { ITEM_ALIGNMENTS } from "../../utils/constants/itemsAlignment";
import { THEME_OPTIONS } from "../../utils/constants/themeOptions";

// Icons
import MenuIcon from "../../assets/icons/MenuIcon";
import MoonIcon from "../../assets/icons/MoonIcon";
import FastForward from "../../assets/icons/FastForward";

// MUI
import {
  Box,
  Typography,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider,
} from "@mui/material";

import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import SectionSubHeader from "@/components/SectionSubHeader.jsx";

function PreviewPill({ color, label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
      <Typography variant="body2" color="text.secondary">
        {label}{" "}
        <Typography component="strong" variant="body2" color="text.primary">
          {value}
        </Typography>
      </Typography>
    </Stack>
  );
}

export default function Settings() {
  const [sidebarAlignment, setSidebarAlignment] = useAtom(sidebarAlignmentAtom);
  const [navitemAlignments, setNavitemAlignments] = useAtom(navitemAlignmentsAtom);
  const [theme, setTheme] = useAtom(themeAtom);

  const handleSidebarChange = (_, alignment) => {
    if (alignment) setSidebarAlignment(alignment);
  };

  const handleNavitemChange = (_, alignment) => {
    if (alignment) setNavitemAlignments(alignment);
  };

  const handleThemeToggle = (e) => {
    const checked = e.target.checked;
    setTheme(checked ? THEME_OPTIONS.DARK : THEME_OPTIONS.LIGHT);
  };

  return (
    <Box>
      {/* Intro Text */}
      <Typography variant="body2" sx={{ mb: 1 }}>
        Customize your experience below.
      </Typography>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Adjust layout, theme, and language preferences.
      </Typography>

      {/* Compact Preview */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
          <PreviewPill color="#3b82f6" label="Sidebar" value={sidebarAlignment} />
          <PreviewPill color="#22c55e" label="Navigation" value={navitemAlignments} />
          <PreviewPill color="#a855f7" label="Theme" value={theme} />
        </Stack>
      </Paper>

      <LineBreaker />

      <Stack spacing={3} sx={{ mt: 2 }}>
        {/* Theme */}
        <Box>
          <SectionSubHeader
            icon={<MoonIcon />}
            bg="#F3E8FF"
            title="Theme"
            description="Switch between light and dark mode."
          />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                {theme === THEME_OPTIONS.DARK ? <MoonIcon /> : <WbSunnyRoundedIcon fontSize="small" />}
                <Typography variant="body2" color="text.secondary">
                  {theme === THEME_OPTIONS.DARK
                    ? "Dark mode is active"
                    : "Light mode is active"}
                </Typography>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={theme === THEME_OPTIONS.DARK}
                    onChange={handleThemeToggle}
                    inputProps={{ "aria-label": "theme-toggle" }}
                  />
                }
                label={theme === THEME_OPTIONS.DARK ? "Dark" : "Light"}
                labelPlacement="start"
              />
            </Stack>
          </Paper>
        </Box>

        <Divider />

        {/* Sidebar Alignment */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <SectionSubHeader
            icon={<MenuIcon style={{ width: 24, height: 24, color: "#3b82f6" }} />}
            bg="#DBEAFE"
            title="Sidebar Alignment"
            description="Choose where the sidebar appears."
          />

          <ToggleButtonGroup
            exclusive
            value={sidebarAlignment}
            onChange={handleSidebarChange}
            size="small"
            color="primary"
            sx={{
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                px: 2,
                py: 1,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton value={ITEM_ALIGNMENTS.LEFT} aria-label="sidebar-left">
              <Tooltip title="Sidebar on the left" placement="top">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormatAlignLeftIcon />
                  <Typography variant="body2">Left</Typography>
                </Stack>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value={ITEM_ALIGNMENTS.RIGHT} aria-label="sidebar-right">
              <Tooltip title="Sidebar on the right" placement="top">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormatAlignRightIcon />
                  <Typography variant="body2">Right</Typography>
                </Stack>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* Navbar Items Alignment */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <SectionSubHeader
            icon={<FastForward />}
            bg="#DCFCE7"
            title="Navigation Alignment"
            description="Set the alignment of navigation items."
          />

          <ToggleButtonGroup
            exclusive
            value={navitemAlignments}
            onChange={handleNavitemChange}
            size="small"
            color="primary"
            sx={{
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                px: 2,
                py: 1,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton value={ITEM_ALIGNMENTS.LEFT} aria-label="nav-left">
              <Tooltip title="Navigation items on the left" placement="top">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormatAlignLeftIcon fontSize="small" />
                  <Typography variant="body2">Left</Typography>
                </Stack>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value={ITEM_ALIGNMENTS.RIGHT} aria-label="nav-right">
              <Tooltip title="Navigation items on the right" placement="top">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormatAlignRightIcon fontSize="small" />
                  <Typography variant="body2">Right</Typography>
                </Stack>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>
    </Box>
  );
}
