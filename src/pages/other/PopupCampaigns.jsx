import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import ImageUploadField from "@/components/ImageUploadField";
import SectionHeader from "@/components/SectionHeader";
import { useToast } from "@/hooks/ToastContext";
import {
  createPopupCampaign,
  deletePopupCampaign,
  fetchAdminPopupCampaigns,
  updatePopupCampaign,
  updatePopupCampaignStatus,
} from "@/lib/api/popupCampaignApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";

const defaultForm = {
  title: "",
  description: "",
  image: null,
  fallbackLabel: "Limited Offer",
  ctaLabel: "",
  ctaUrl: "",
  showEmailInput: false,
  successMessage: "Thank you for subscribing.",
  isActive: true,
  isDismissible: true,
  displayMode: "ONCE_PER_SESSION",
  repeatAfterDays: 7,
  displayDelaySeconds: 2,
  startDate: "",
  endDate: "",
  priority: 0,
};

const displayModeOptions = [
  { value: "EVERY_REFRESH", label: "Every homepage refresh" },
  { value: "ONCE_PER_SESSION", label: "Once per browser session" },
  { value: "ONCE_PER_VISITOR", label: "Only once per visitor" },
  { value: "ONCE_EVERY_X_DAYS", label: "Once every X days" },
];

const editablePopupCampaignFields = [
  "ctaLabel",
  "ctaUrl",
  "description",
  "displayDelaySeconds",
  "displayMode",
  "endDate",
  "fallbackLabel",
  "image",
  "isActive",
  "isDismissible",
  "priority",
  "repeatAfterDays",
  "showEmailInput",
  "startDate",
  "successMessage",
  "title",
];

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const normalizeForm = (campaign = null) => ({
  ...defaultForm,
  ...(campaign || {}),
  endDate: toDateInput(campaign?.endDate),
  startDate: toDateInput(campaign?.startDate),
});

const buildPopupCampaignPayload = (form) => {
  const payload = Object.fromEntries(
    editablePopupCampaignFields.map((field) => [field, form[field]]),
  );

  return {
    ...payload,
    displayDelaySeconds: Number(form.displayDelaySeconds || 0),
    priority: Number(form.priority || 0),
    repeatAfterDays: Number(form.repeatAfterDays || 1),
  };
};

const PopupCampaignDialog = ({ campaign, open, onClose, onSave }) => {
  const [form, setForm] = useState(defaultForm);
  const isEditing = Boolean(campaign?.id);

  useEffect(() => {
    if (open) setForm(normalizeForm(campaign));
  }, [campaign, open]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = () => {
    onSave(buildPopupCampaignPayload(form));
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle>{isEditing ? "Edit Popup Campaign" : "Add Popup Campaign"}</DialogTitle>
      <DialogContent sx={{ bgcolor: "grey.50" }}>
        <Stack spacing={2.25} sx={{ pt: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={800}>Campaign Content</Typography>
                <Typography color="text.secondary" variant="body2">Main copy and action shown to shoppers.</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Title" value={form.title} onChange={(event) => setField("title", event.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={(event) => setField("description", event.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="CTA label" value={form.ctaLabel} onChange={(event) => setField("ctaLabel", event.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="CTA URL" value={form.ctaUrl} onChange={(event) => setField("ctaUrl", event.target.value)} />
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={800}>Image</Typography>
                <Typography color="text.secondary" variant="body2">Optional. If empty, the storefront popup uses a compact text-only layout.</Typography>
              </Box>
              <ImageUploadField
                expectedHeight={1024}
                expectedWidth={900}
                folderKey="storefront"
                label="Popup image"
                previewAspectRatio="900 / 1024"
                value={form.image}
                onChange={(image) => setField("image", image)}
                onRemove={() => setField("image", null)}
              />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={800}>Display Rules</Typography>
                <Typography color="text.secondary" variant="body2">Control when and how often this popup appears.</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField select fullWidth label="Display frequency" value={form.displayMode} onChange={(event) => setField("displayMode", event.target.value)}>
                    {displayModeOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth type="number" label="Repeat after days" value={form.repeatAfterDays} disabled={form.displayMode !== "ONCE_EVERY_X_DAYS"} onChange={(event) => setField("repeatAfterDays", event.target.value)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth type="number" label="Delay seconds" value={form.displayDelaySeconds} onChange={(event) => setField("displayDelaySeconds", event.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth type="date" label="Start date" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth type="date" label="End date" InputLabelProps={{ shrink: true }} value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} />
                </Grid>
              </Grid>
              <Divider />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControlLabel control={<Switch checked={form.isActive} onChange={(event) => setField("isActive", event.target.checked)} />} label="Active" />
                <FormControlLabel control={<Switch checked={form.isDismissible} onChange={(event) => setField("isDismissible", event.target.checked)} />} label="Dismissible" />
                <FormControlLabel control={<Switch checked={form.showEmailInput} onChange={(event) => setField("showEmailInput", event.target.checked)} />} label="Collect email" />
              </Stack>
              {form.showEmailInput ? (
                <TextField
                  fullWidth
                  label="Success message"
                  value={form.successMessage}
                  onChange={(event) => setField("successMessage", event.target.value)}
                />
              ) : null}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>{isEditing ? "Save Changes" : "Create Popup"}</Button>
      </DialogActions>
    </Dialog>
  );
};

const PopupCampaigns = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const loadData = useCallback(async () => {
    if (!authToken) return;
    const campaignResult = await fetchAdminPopupCampaigns(authToken, { limit: 50 });
    setCampaigns(campaignResult.items);
  }, [authToken]);

  useEffect(() => {
    loadData().catch((error) => toast.error(error.message || "Failed to load popup campaigns."));
  }, [loadData, toast]);

  const activeCount = useMemo(() => campaigns.filter((campaign) => campaign.isActive).length, [campaigns]);

  const handleSave = async (payload) => {
    if (editingCampaign?.id) {
      await updatePopupCampaign(authToken, editingCampaign.id, payload);
      toast.success("Popup campaign updated successfully.");
    } else {
      await createPopupCampaign(authToken, payload);
      toast.success("Popup campaign created successfully.");
    }
    setDialogOpen(false);
    setEditingCampaign(null);
    await loadData();
  };

  const handleToggle = async (campaign) => {
    await updatePopupCampaignStatus(authToken, campaign.id, !campaign.isActive);
    toast.success(!campaign.isActive ? "Popup campaign activated." : "Popup campaign deactivated.");
    await loadData();
  };

  const handleDelete = async (campaign) => {
    await deletePopupCampaign(authToken, campaign.id);
    toast.success("Popup campaign deleted successfully.");
    await loadData();
  };

  return (
    <Box>
      <SectionHeader title="Popup Campaigns" />
      <Stack spacing={3}>
        <Paper sx={{ p: 2 }}>
          <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography fontWeight={700}>Campaigns</Typography>
              <Typography color="text.secondary" variant="body2">{activeCount} active campaign{activeCount === 1 ? "" : "s"}</Typography>
            </Box>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => { setEditingCampaign(null); setDialogOpen(true); }}>Add Popup</Button>
          </Stack>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Mode</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Typography fontWeight={700}>{campaign.title}</Typography>
                      <Typography color="text.secondary" variant="caption">{campaign.ctaLabel || "Promotion popup"}</Typography>
                    </TableCell>
                    <TableCell>{displayModeOptions.find((option) => option.value === campaign.displayMode)?.label || campaign.displayMode}</TableCell>
                    <TableCell>{campaign.showEmailInput ? "Collects email" : "Banner only"}</TableCell>
                    <TableCell><Chip color={campaign.isActive ? "success" : "default"} label={campaign.isActive ? "Active" : "Inactive"} size="small" onClick={() => handleToggle(campaign)} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setEditingCampaign(campaign); setDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton color="error" size="small" onClick={() => handleDelete(campaign)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>
      <PopupCampaignDialog campaign={editingCampaign} open={dialogOpen} onClose={() => setDialogOpen(false)} onSave={handleSave} />
    </Box>
  );
};

export default PopupCampaigns;
