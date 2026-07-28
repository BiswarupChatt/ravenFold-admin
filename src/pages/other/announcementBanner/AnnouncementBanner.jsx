import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import DataTable from "@/components/DataTable";
import SectionHeader from "@/components/SectionHeader";
import {
  createAnnouncementBanner,
  deleteAnnouncementBanner,
  fetchAdminAnnouncementBanners,
  updateAnnouncementBanner,
  updateAnnouncementBannerStatus,
} from "@/lib/api/announcementBannerApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  DEFAULT_PAGINATION,
  DEFAULT_TABLE_PARAMS,
  formatDateTime,
  normalizeText,
} from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";

const VARIANT_OPTIONS = [
  { value: "DEFAULT", label: "Default" },
  { value: "SALE", label: "Sale" },
  { value: "INFO", label: "Info" },
  { value: "WARNING", label: "Warning" },
  { value: "FESTIVE", label: "Festive" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const TITLE_CHARACTER_LIMIT = 32;
const MESSAGE_CHARACTER_LIMIT = 90;
const CTA_LABEL_CHARACTER_LIMIT = 18;
const CHARACTER_LIMIT_BY_FIELD = {
  ctaLabel: CTA_LABEL_CHARACTER_LIMIT,
  message: MESSAGE_CHARACTER_LIMIT,
  title: TITLE_CHARACTER_LIMIT,
};

const EMPTY_FORM = {
  backgroundColor: "",
  ctaLabel: "",
  ctaUrl: "",
  endDate: "",
  isActive: true,
  message: "",
  placement: "TOP_NAVBAR",
  priority: "0",
  startDate: "",
  textColor: "",
  title: "",
  variant: "DEFAULT",
};

const formatDateTimeInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (datePart) => String(datePart).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const humanizeValue = (value = "") => (
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ")
);

const getCharacterCount = (value = "") => Array.from(String(value || "")).length;

const getCharacterLimitText = (value, limit) => `${getCharacterCount(value)} / ${limit} characters`;

const getCharacterLimitError = (value, limit, fieldLabel) => (
  getCharacterCount(value) > limit ? `${fieldLabel} must be ${limit} characters or fewer.` : ""
);

const limitTextByCharacters = (value = "", limit = 0) => {
  if (!limit) {
    return value;
  }

  return Array.from(String(value)).slice(0, limit).join("");
};

const toFormData = (banner = {}) => ({
  backgroundColor: banner.backgroundColor || "",
  ctaLabel: banner.ctaLabel || "",
  ctaUrl: banner.ctaUrl || "",
  endDate: formatDateTimeInput(banner.endDate),
  isActive: banner.isActive !== false,
  message: banner.message || "",
  placement: banner.placement || "TOP_NAVBAR",
  priority: banner.priority === null || banner.priority === undefined ? "0" : String(banner.priority),
  startDate: formatDateTimeInput(banner.startDate),
  textColor: banner.textColor || "",
  title: banner.title || "",
  variant: banner.variant || "DEFAULT",
});

const buildPayload = (formData) => ({
  backgroundColor: normalizeText(formData.backgroundColor),
  ctaLabel: normalizeText(formData.ctaLabel),
  ctaUrl: normalizeText(formData.ctaUrl),
  endDate: normalizeText(formData.endDate) || null,
  isActive: Boolean(formData.isActive),
  message: normalizeText(formData.message),
  placement: "TOP_NAVBAR",
  priority: Number(formData.priority || 0),
  startDate: normalizeText(formData.startDate) || null,
  textColor: normalizeText(formData.textColor),
  title: normalizeText(formData.title),
  variant: normalizeText(formData.variant) || "DEFAULT",
});

const getPreviewColors = (formData) => {
  if (formData.backgroundColor || formData.textColor) {
    return {
      backgroundColor: formData.backgroundColor || "#1e2952",
      color: formData.textColor || "#ffffff",
    };
  }

  const variants = {
    DEFAULT: { backgroundColor: "#1e2952", color: "#ffffff" },
    FESTIVE: { backgroundColor: "#7f1d1d", color: "#fff7ed" },
    INFO: { backgroundColor: "#0f766e", color: "#ffffff" },
    SALE: { backgroundColor: "#d9461f", color: "#ffffff" },
    WARNING: { backgroundColor: "#92400e", color: "#fff7ed" },
  };

  return variants[formData.variant] || variants.DEFAULT;
};

function AnnouncementBannerDialog({
  editingBanner,
  formData,
  formError,
  open,
  saving,
  onChange,
  onClear,
  onClose,
  onSubmit,
}) {
  const previewColors = getPreviewColors(formData);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editingBanner ? "Edit Announcement Banner" : "Add Announcement Banner"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Box
            sx={{
              ...previewColors,
              alignItems: "center",
              display: "grid",
              gap: { xs: 1, md: 1.5 },
              gridTemplateColumns: "1fr",
              minHeight: { xs: 52, md: 44 },
              px: 2,
              py: { xs: 0.75, md: 0.5 },
            }}
          >
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                gap: { xs: 1, md: 1.25 },
                justifyContent: { xs: formData.ctaLabel ? "space-between" : "center", md: "center" },
                minWidth: 0,
                textAlign: { xs: "left", md: "center" },
                width: "100%",
              }}
            >
              <Box
                sx={{
                  alignItems: { xs: "flex-start", md: "center" },
                  display: "flex",
                  flex: { xs: formData.ctaLabel ? "1 1 auto" : "0 1 auto", md: "0 1 auto" },
                  flexDirection: { xs: "column", md: "row" },
                  gap: { xs: 0.25, md: 1 },
                  maxWidth: formData.ctaLabel ? { xs: "calc(100% - 112px)", md: "100%" } : "100%",
                  minWidth: 0,
                }}
              >
                {formData.title ? (
                  <Typography
                    component="span"
                    sx={{
                      color: "inherit",
                      fontSize: { xs: "0.78rem", md: "0.86rem" },
                      fontWeight: 800,
                      lineHeight: 1.25,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formData.title}
                  </Typography>
                ) : null}

                <Typography
                  component="span"
                  sx={{
                    color: "inherit",
                    fontSize: { xs: "0.78rem", md: "0.86rem" },
                    fontWeight: 600,
                    lineHeight: 1.25,
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: { xs: "normal", md: "nowrap" },
                  }}
                >
                  {formData.message || "Your announcement message will preview here."}
                </Typography>
              </Box>

              {formData.ctaLabel ? (
                <Button
                  size="small"
                  sx={{
                    borderColor: "currentColor",
                    borderRadius: 999,
                    color: "inherit",
                    flexShrink: 0,
                    minHeight: 30,
                    px: { xs: 1.4, md: 1.75 },
                    whiteSpace: "nowrap",
                  }}
                  variant="outlined"
                >
                  {formData.ctaLabel}
                </Button>
              ) : null}
            </Box>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              autoFocus
              fullWidth
              label="Title"
              name="title"
              helperText={getCharacterLimitText(formData.title, TITLE_CHARACTER_LIMIT)}
              value={formData.title}
              onChange={onChange}
            />
            <TextField
              select
              fullWidth
              label="Variant"
              name="variant"
              value={formData.variant}
              onChange={onChange}
            >
              {VARIANT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Message"
            name="message"
            required
            helperText={getCharacterLimitText(formData.message, MESSAGE_CHARACTER_LIMIT)}
            value={formData.message}
            onChange={onChange}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="CTA Label"
              name="ctaLabel"
              placeholder="Shop now"
              helperText={getCharacterLimitText(formData.ctaLabel, CTA_LABEL_CHARACTER_LIMIT)}
              value={formData.ctaLabel}
              onChange={onChange}
            />
            <TextField
              fullWidth
              label="CTA URL"
              name="ctaUrl"
              placeholder="/shop"
              value={formData.ctaUrl}
              onChange={onChange}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="Start Date"
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={onChange}
            />
            <TextField
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="End Date"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={onChange}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              inputProps={{ step: 1 }}
              label="Priority"
              name="priority"
              type="number"
              value={formData.priority}
              onChange={onChange}
            />
            <TextField
              fullWidth
              label="Background Color"
              name="backgroundColor"
              placeholder="#1e2952"
              value={formData.backgroundColor}
              onChange={onChange}
            />
            <TextField
              fullWidth
              label="Text Color"
              name="textColor"
              placeholder="#ffffff"
              value={formData.textColor}
              onChange={onChange}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.isActive)}
                  name="isActive"
                  onChange={onChange}
                />
              )}
              label="Active"
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        {!editingBanner ? (
          <Button disabled={saving} onClick={onClear}>
            Clear
          </Button>
        ) : null}
        <Button disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disableElevation
          disabled={saving}
          onClick={onSubmit}
          startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
          variant="contained"
        >
          {editingBanner ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const AnnouncementBanner = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [banners, setBanners] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const queryParams = useMemo(() => {
    const params = {
      ...tableParams,
    };

    if (statusFilter !== "all") {
      params.isActive = statusFilter;
    }

    return params;
  }, [statusFilter, tableParams]);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const bannerList = await fetchAdminAnnouncementBanners(authToken, queryParams);

      setBanners(bannerList.items);
      setPagination(bannerList.pagination);
    } catch (err) {
      setError(err.message || "Failed to load announcement banners.");
      setBanners([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, queryParams, tableParams.limit, tableParams.page]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setFormData(toFormData(banner));
    setFormError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingBanner(null);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;
    const nextValue = type === "checkbox"
      ? checked
      : limitTextByCharacters(value, CHARACTER_LIMIT_BY_FIELD[name]);

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: nextValue,
    }));
  };

  const handleSubmit = async () => {
    const payload = buildPayload(formData);
    const characterLimitError = (
      getCharacterLimitError(payload.title, TITLE_CHARACTER_LIMIT, "Title")
      || getCharacterLimitError(payload.message, MESSAGE_CHARACTER_LIMIT, "Message")
      || getCharacterLimitError(payload.ctaLabel, CTA_LABEL_CHARACTER_LIMIT, "CTA label")
    );

    if (!payload.message) {
      setFormError("Message is required.");
      return;
    }

    if (characterLimitError) {
      setFormError(characterLimitError);
      return;
    }

    if (!Number.isInteger(payload.priority)) {
      setFormError("Priority must be an integer.");
      return;
    }

    if (payload.startDate && payload.endDate && new Date(payload.startDate) > new Date(payload.endDate)) {
      setFormError("End date must be greater than or equal to start date.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingBanner) {
        await updateAnnouncementBanner(authToken, editingBanner.id, payload);
        toast.success("Announcement banner updated successfully.");
      } else {
        await createAnnouncementBanner(authToken, payload);
        toast.success("Announcement banner created successfully.");
        setFormData(EMPTY_FORM);
      }

      setDialogOpen(false);
      setEditingBanner(null);
      await loadBanners();
    } catch (err) {
      setFormError(err.message || "Failed to save announcement banner.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (banner) => {
    const nextIsActive = !banner.isActive;

    setStatusUpdatingId(banner.id);
    setError("");

    try {
      await updateAnnouncementBannerStatus(authToken, banner.id, nextIsActive);
      toast.success(nextIsActive ? "Announcement banner activated successfully." : "Announcement banner deactivated successfully.");
      await loadBanners();
    } catch (err) {
      setError(err.message || "Failed to update announcement banner status.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleDelete = async () => {
    if (!deletingBanner) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteAnnouncementBanner(authToken, deletingBanner.id);
      toast.success("Announcement banner deleted successfully.");
      setDeletingBanner(null);
      await loadBanners();
    } catch (err) {
      setError(err.message || "Failed to delete announcement banner.");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: "Banner",
      minWidth: 320,
      render: (banner) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {banner.title || banner.message}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {banner.title ? banner.message : "No title"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "CTA",
      minWidth: 180,
      render: (banner) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2">{banner.ctaLabel || "-"}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {banner.ctaUrl || "No link"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Style",
      minWidth: 150,
      render: (banner) => (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              px: 1,
              py: 0.25,
            }}
          >
            <Typography variant="caption">
              {humanizeValue(banner.variant)}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      header: "Schedule",
      minWidth: 210,
      render: (banner) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2">
            {banner.startDate ? formatDateTime(banner.startDate) : "Starts immediately"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {banner.endDate ? `Ends ${formatDateTime(banner.endDate)}` : "No expiry"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Priority",
      minWidth: 100,
      render: (banner) => (
        <Typography variant="body2" fontWeight={700}>
          {Number(banner.priority || 0)}
        </Typography>
      ),
    },
    {
      header: "Status",
      minWidth: 150,
      render: (banner) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={banner.isActive ? "Active" : "Inactive"}
            color={banner.isActive ? "success" : "default"}
            size="small"
            variant={banner.isActive ? "filled" : "outlined"}
          />
          {statusUpdatingId === banner.id ? (
            <CircularProgress size={18} />
          ) : (
            <Switch
              checked={Boolean(banner.isActive)}
              size="small"
              onChange={() => handleToggleStatus(banner)}
            />
          )}
        </Stack>
      ),
    },
    {
      align: "right",
      header: "Actions",
      minWidth: 120,
      render: (banner) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit announcement banner">
            <IconButton size="small" onClick={() => handleOpenEdit(banner)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete announcement banner">
            <span>
              <IconButton
                color="error"
                disabled={deletingBanner?.id === banner.id}
                size="small"
                onClick={() => setDeletingBanner(banner)}
              >
                {deletingBanner?.id === banner.id ? <CircularProgress color="inherit" size={16} /> : <DeleteOutlineIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <SectionHeader title="Announcement Banners" />

      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: "100%", minWidth: 0, borderRadius: 2, overflow: "hidden" }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Top Banner Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage manually configured messages shown above the storefront navbar.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setTableParams((currentParams) => ({ ...currentParams, page: 1 }));
              }}
              sx={{ minWidth: { xs: "100%", sm: 160 } }}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Button startIcon={<AddIcon />} variant="contained" onClick={handleOpenCreate}>
              Add Banner
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}

          <DataTable
            columns={columns}
            emptyMessage="No announcement banners found."
            error={error}
            getRowId={(row) => row.id}
            loading={loading}
            loadingMessage="Loading announcement banners..."
            minWidth={1230}
            pagination={{
              ...pagination,
              onPageChange: (nextPage) => {
                setTableParams((currentParams) => ({
                  ...currentParams,
                  page: nextPage,
                }));
              },
              onRowsPerPageChange: (nextLimit) => {
                setTableParams((currentParams) => ({
                  ...currentParams,
                  limit: nextLimit,
                  page: 1,
                }));
              },
            }}
            rows={banners}
          />
        </Box>
      </Paper>

      <AnnouncementBannerDialog
        editingBanner={editingBanner}
        formData={formData}
        formError={formError}
        open={dialogOpen}
        saving={saving}
        onChange={handleFormChange}
        onClear={() => {
          setFormData(EMPTY_FORM);
          setFormError("");
        }}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      <Dialog open={Boolean(deletingBanner)} onClose={() => setDeletingBanner(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Announcement Banner</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            Delete {deletingBanner?.title || deletingBanner?.message || "this announcement banner"}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setDeletingBanner(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deleting}
            onClick={handleDelete}
            startIcon={deleting ? <CircularProgress color="inherit" size={16} /> : null}
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AnnouncementBanner;
