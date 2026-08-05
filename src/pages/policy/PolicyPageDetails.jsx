import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";

import RichTextEditor from "@/components/richTextEditor/RichTextEditor";
import {
  createPolicy,
  fetchAdminPolicy,
  fetchPolicyVersions,
  publishPolicy,
  restorePolicyVersion,
  updatePolicy,
} from "@/lib/api/policyPageApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { formatDateTime, normalizeText } from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import ROUTES from "@/routes/routes";
import { isEditorHtmlEmpty, normalizeEditorHtml } from "@/components/richTextEditor/editorHtml";

const EMPTY_FORM = {
  title: "",
  slug: "",
  contentHtml: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  showInFooter: false,
  footerLabel: "",
  footerSortOrder: "0",
};

const POLICY_STATUSES = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const createSlug = (value = "") => (
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
);

const policyToFormData = (policy = {}) => ({
  title: policy.title || "",
  slug: policy.slug || "",
  contentHtml: policy.contentHtml || "",
  status: policy.status || "draft",
  seoTitle: policy.seo?.title || "",
  seoDescription: policy.seo?.description || "",
  showInFooter: Boolean(policy.showInFooter),
  footerLabel: policy.footerLabel || "",
  footerSortOrder: String(policy.footerSortOrder ?? 0),
});

const buildPayload = (formData) => ({
  title: normalizeText(formData.title),
  slug: createSlug(formData.slug || formData.title),
  contentHtml: normalizeEditorHtml(formData.contentHtml),
  status: formData.status || "draft",
  showInFooter: Boolean(formData.showInFooter),
  footerLabel: normalizeText(formData.footerLabel),
  footerSortOrder: formData.footerSortOrder === "" ? 0 : Number(formData.footerSortOrder),
  seo: {
    title: normalizeText(formData.seoTitle),
    description: normalizeText(formData.seoDescription),
  },
});

const getSignature = (formData) => JSON.stringify(buildPayload(formData));

const Panel = ({ children, title }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" fontWeight={800}>
        {title}
      </Typography>
    </Box>
    <Stack spacing={2} sx={{ p: 2 }}>
      {children}
    </Stack>
  </Paper>
);

const PolicyPageDetails = ({ mode = "edit" }) => {
  const { policyId } = useParams();
  const authToken = useAtomValue(authTokenAtom);
  const navigate = useNavigate();
  const toast = useToast();
  const isCreateMode = mode === "create";
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [savedFormData, setSavedFormData] = useState(EMPTY_FORM);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState("");

  const dirty = useMemo(() => (
    getSignature(formData) !== getSignature(savedFormData)
  ), [formData, savedFormData]);

  const loadPolicy = useCallback(async () => {
    if (isCreateMode) {
      setPolicy(null);
      setFormData(EMPTY_FORM);
      setSavedFormData(EMPTY_FORM);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loadedPolicy = await fetchAdminPolicy(authToken, policyId);
      const nextFormData = policyToFormData(loadedPolicy);

      setPolicy(loadedPolicy);
      setFormData(nextFormData);
      setSavedFormData(nextFormData);
    } catch (err) {
      setError(err.message || "Failed to load policy.");
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, [authToken, isCreateMode, policyId]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const setField = (field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
      ...(field === "title" && !currentFormData.slug ? { slug: createSlug(value) } : {}),
    }));
  };

  const handleBack = () => {
    if (dirty && !window.confirm("Discard unsaved policy changes?")) {
      return;
    }

    navigate(ROUTES.POLICY_PAGES);
  };

  const validatePayload = (payload) => {
    if (!payload.title) {
      return "Title is required.";
    }

    if (!payload.slug) {
      return "Slug is required.";
    }

    if (payload.status === "published" && isEditorHtmlEmpty(payload.contentHtml)) {
      return "Policy content is required before publishing.";
    }

    if (!Number.isFinite(payload.footerSortOrder)) {
      return "Footer sort order must be a valid number.";
    }

    return "";
  };

  const savePolicy = async () => {
    const payload = buildPayload(formData);
    const validationError = validatePayload(payload);

    if (validationError) {
      setError(validationError);
      return null;
    }

    setSaving(true);
    setError("");

    try {
      const shouldPublishAfterSave = policy?.id
        && policy.status !== "published"
        && payload.status === "published";
      const savePayload = shouldPublishAfterSave
        ? { ...payload, status: "draft" }
        : payload;
      const response = policy?.id
        ? await updatePolicy(authToken, policy.id, savePayload)
        : await createPolicy(authToken, payload);
      let savedPolicy = response?.data || null;

      if (shouldPublishAfterSave) {
        const publishResponse = await publishPolicy(authToken, savedPolicy.id);

        savedPolicy = publishResponse?.data || savedPolicy;
      }

      const nextFormData = policyToFormData(savedPolicy);

      setPolicy(savedPolicy);
      setFormData(nextFormData);
      setSavedFormData(nextFormData);
      toast.success(savedPolicy?.status === "published" ? "Policy published successfully." : "Policy saved successfully.");

      if (isCreateMode && savedPolicy?.id) {
        navigate(`${ROUTES.POLICY_PAGES}/${savedPolicy.id}/edit`, { replace: true });
      }

      return savedPolicy;
    } catch (err) {
      setError(err.message || "Failed to save policy.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const openVersions = async () => {
    if (!policy?.id) {
      return;
    }

    setVersionsOpen(true);
    setVersionsLoading(true);

    try {
      setVersions(await fetchPolicyVersions(authToken, policy.id));
    } catch (err) {
      toast.error(err.message || "Failed to load policy versions.");
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!policy?.id || !window.confirm("Restore this version as the latest policy version?")) {
      return;
    }

    setRestoringVersionId(versionId);

    try {
      const response = await restorePolicyVersion(authToken, policy.id, versionId);
      const restoredPolicy = response?.data || null;
      const nextFormData = policyToFormData(restoredPolicy);

      setPolicy(restoredPolicy);
      setFormData(nextFormData);
      setSavedFormData(nextFormData);
      setVersions(await fetchPolicyVersions(authToken, policy.id));
      toast.success("Policy version restored successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to restore policy version.");
    } finally {
      setRestoringVersionId("");
    }
  };

  const savePanel = (
    <Panel title="Save Changes">
      <Box>
        <Typography variant="body2" fontWeight={700}>
          {dirty ? "Unsaved changes" : "All changes saved"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Status changes apply when you save.
        </Typography>
      </Box>
      <Button
        disabled={saving || !dirty}
        fullWidth
        onClick={() => savePolicy()}
        startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
        variant="contained"
      >
        Save
      </Button>
    </Panel>
  );

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} />
        <Typography color="text.secondary" variant="body2">
          Loading policy...
        </Typography>
      </Stack>
    );
  }

  if (!isCreateMode && !policy) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ alignSelf: "flex-start" }}>
          Policy Pages
        </Button>
        <Alert severity="error">{error || "Policy not found."}</Alert>
      </Stack>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 1320, mx: "auto" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <IconButton aria-label="Back to policy pages" onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h5" fontWeight={800}>
                  {isCreateMode ? "Add Policy" : `Edit ${policy.title}`}
                </Typography>
                {!isCreateMode ? (
                  <Chip
                    color={policy.status === "published" ? "success" : "default"}
                    label={policy.status === "published" ? "Published" : "Draft"}
                    size="small"
                  />
                ) : null}
              </Stack>
              {!isCreateMode ? (
                <Typography color="text.secondary" variant="body2">
                  Version {policy.version} updated {formatDateTime(policy.updatedAt)}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {!isCreateMode ? (
              <Button startIcon={<HistoryIcon />} onClick={openVersions} variant="outlined">
                Versions
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}

        <Box
          sx={{
            alignItems: "flex-start",
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
          }}
        >
          <Stack spacing={2}>
            <Panel title="Policy Content">
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  disabled={saving}
                  fullWidth
                  label="Title"
                  required
                  value={formData.title}
                  onChange={(event) => setField("title", event.target.value)}
                />
                <TextField
                  disabled={saving || policy?.isSystemPolicy}
                  fullWidth
                  helperText={policy?.isSystemPolicy ? "System policy slugs cannot be changed." : "Public URL slug."}
                  label="Slug"
                  required
                  value={formData.slug}
                  onChange={(event) => setField("slug", createSlug(event.target.value))}
                />
              </Stack>

              <RichTextEditor
                disabled={saving}
                error={formData.status === "published" && isEditorHtmlEmpty(formData.contentHtml) ? "Content is required before publishing." : ""}
                onChange={(html) => setField("contentHtml", html)}
                placeholder="Write the policy content..."
                value={formData.contentHtml}
              />
            </Panel>
          </Stack>

          <Stack
            spacing={2}
            sx={{
              position: { lg: "sticky" },
              top: { lg: 16 },
              width: "100%",
            }}
          >
            <Panel title="Publishing">
              <TextField
                disabled={saving}
                fullWidth
                helperText={formData.status === "published" ? "Published policies are live immediately after saving." : "Draft policies are hidden from customers."}
                label="Status"
                select
                size="small"
                value={formData.status}
                onChange={(event) => setField("status", event.target.value)}
              >
                {POLICY_STATUSES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Panel>

            <Panel title="Footer">
              <FormControlLabel
                control={(
                  <Switch
                    checked={Boolean(formData.showInFooter)}
                    disabled={saving}
                    onChange={(event) => setField("showInFooter", event.target.checked)}
                  />
                )}
                label="Show in footer"
              />
              <TextField
                disabled={saving || !formData.showInFooter}
                fullWidth
                helperText="Leave blank to use the policy title."
                inputProps={{ maxLength: 60 }}
                label="Footer visible text"
                size="small"
                value={formData.footerLabel}
                onChange={(event) => setField("footerLabel", event.target.value)}
              />
              <TextField
                disabled={saving || !formData.showInFooter}
                fullWidth
                inputProps={{ step: 1 }}
                label="Footer sort order"
                size="small"
                type="number"
                value={formData.footerSortOrder}
                onChange={(event) => setField("footerSortOrder", event.target.value)}
              />
            </Panel>

            <Panel title="SEO">
              <TextField
                disabled={saving}
                fullWidth
                inputProps={{ maxLength: 70 }}
                label="SEO Title"
                size="small"
                value={formData.seoTitle}
                onChange={(event) => setField("seoTitle", event.target.value)}
              />
              <TextField
                disabled={saving}
                fullWidth
                inputProps={{ maxLength: 180 }}
                label="SEO Description"
                multiline
                minRows={3}
                size="small"
                value={formData.seoDescription}
                onChange={(event) => setField("seoDescription", event.target.value)}
              />
            </Panel>

            {savePanel}
          </Stack>
        </Box>
      </Box>

      <Dialog open={versionsOpen} onClose={() => setVersionsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Policy Versions</DialogTitle>
        <DialogContent dividers>
          {versionsLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography color="text.secondary" variant="body2">
                Loading versions...
              </Typography>
            </Stack>
          ) : versions.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No previous versions yet.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {versions.map((version) => (
                <Paper key={version.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                    <Box>
                      <Typography fontWeight={700}>Version {version.version}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {version.title} - {version.status} - {formatDateTime(version.createdAt)}
                      </Typography>
                    </Box>
                    <Button
                      disabled={Boolean(restoringVersionId)}
                      onClick={() => handleRestoreVersion(version.id)}
                      startIcon={restoringVersionId === version.id ? <CircularProgress color="inherit" size={14} /> : null}
                      size="small"
                      variant="outlined"
                    >
                      Restore
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PolicyPageDetails;
