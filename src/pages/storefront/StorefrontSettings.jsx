import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import SectionHeader from "@/components/SectionHeader";
import { useToast } from "@/hooks/ToastContext";
import { fetchAdminSiteSettings, updateSiteSettings } from "@/lib/api/siteSettingsApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { normalizeText } from "@/lib/utils/utils";

const EMPTY_FORM = {
  brandName: "Raven Fold",
  copyrightText: "",
  contact: {
    businessHours: "",
    supportEmail: "",
    supportPhone: "",
    whatsappNumber: "",
  },
  featureFlags: {
    enableReviews: true,
    enableWishlist: true,
    maintenanceMode: false,
    showBlog: false,
    showNavbarSearch: false,
  },
  favicon: {
    alt: "",
    publicId: "",
    url: "",
  },
  logo: {
    alt: "",
    publicId: "",
    url: "",
  },
  seo: {
    description: "",
    title: "",
  },
  socialLinks: [],
};

const toImageForm = (asset) => ({
  alt: asset?.alt || "",
  publicId: asset?.publicId || "",
  url: asset?.url || "",
});

const toFormData = (settings = {}) => ({
  brandName: settings.brandName || EMPTY_FORM.brandName,
  contact: {
    businessHours: settings.contact?.businessHours || "",
    supportEmail: settings.contact?.supportEmail || "",
    supportPhone: settings.contact?.supportPhone || "",
    whatsappNumber: settings.contact?.whatsappNumber || "",
  },
  copyrightText: settings.copyrightText || "",
  favicon: toImageForm(settings.favicon),
  featureFlags: {
    enableReviews: settings.featureFlags?.enableReviews !== false,
    enableWishlist: settings.featureFlags?.enableWishlist !== false,
    maintenanceMode: Boolean(settings.featureFlags?.maintenanceMode),
    showBlog: Boolean(settings.featureFlags?.showBlog),
    showNavbarSearch: Boolean(settings.featureFlags?.showNavbarSearch),
  },
  logo: toImageForm(settings.logo),
  seo: {
    description: settings.seo?.description || "",
    title: settings.seo?.title || "",
  },
  socialLinks: Array.isArray(settings.socialLinks)
    ? settings.socialLinks.map((link) => ({
      isActive: link.isActive !== false,
      label: link.label || "",
      url: link.url || "",
    }))
    : [],
});

const imagePayload = (asset) => {
  const url = normalizeText(asset.url);

  if (!url) {
    return null;
  }

  return {
    alt: normalizeText(asset.alt),
    publicId: normalizeText(asset.publicId),
    url,
  };
};

const buildPayload = (formData) => ({
  brandName: normalizeText(formData.brandName),
  contact: {
    businessHours: normalizeText(formData.contact.businessHours),
    supportEmail: normalizeText(formData.contact.supportEmail),
    supportPhone: normalizeText(formData.contact.supportPhone),
    whatsappNumber: normalizeText(formData.contact.whatsappNumber),
  },
  copyrightText: normalizeText(formData.copyrightText),
  favicon: imagePayload(formData.favicon),
  featureFlags: {
    enableReviews: Boolean(formData.featureFlags.enableReviews),
    enableWishlist: Boolean(formData.featureFlags.enableWishlist),
    maintenanceMode: Boolean(formData.featureFlags.maintenanceMode),
    showBlog: Boolean(formData.featureFlags.showBlog),
    showNavbarSearch: Boolean(formData.featureFlags.showNavbarSearch),
  },
  logo: imagePayload(formData.logo),
  seo: {
    description: normalizeText(formData.seo.description),
    title: normalizeText(formData.seo.title),
  },
  socialLinks: formData.socialLinks
    .map((link) => ({
      isActive: Boolean(link.isActive),
      label: normalizeText(link.label),
      url: normalizeText(link.url),
    }))
    .filter((link) => link.label || link.url),
});

const Panel = ({ children, title }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2, py: 1.5 }}>
      <Typography fontWeight={800} variant="subtitle2">
        {title}
      </Typography>
    </Box>
    <Stack spacing={2} sx={{ p: 2 }}>
      {children}
    </Stack>
  </Paper>
);

const StorefrontSettings = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [savedFormData, setSavedFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty = useMemo(() => (
    JSON.stringify(buildPayload(formData)) !== JSON.stringify(buildPayload(savedFormData))
  ), [formData, savedFormData]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const settings = await fetchAdminSiteSettings(authToken);
      const nextFormData = toFormData(settings || {});

      setFormData(nextFormData);
      setSavedFormData(nextFormData);
    } catch (err) {
      setError(err.message || "Failed to load storefront settings.");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setField = (section, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [section]: {
        ...currentFormData[section],
        [field]: value,
      },
    }));
  };

  const setRootField = (field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  };

  const setSocialLinkField = (index, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      socialLinks: currentFormData.socialLinks.map((link, linkIndex) => (
        linkIndex === index ? { ...link, [field]: value } : link
      )),
    }));
  };

  const addSocialLink = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      socialLinks: [
        ...currentFormData.socialLinks,
        { isActive: true, label: "", url: "" },
      ],
    }));
  };

  const removeSocialLink = (index) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      socialLinks: currentFormData.socialLinks.filter((_, linkIndex) => linkIndex !== index),
    }));
  };

  const handleSave = async () => {
    const payload = buildPayload(formData);

    if (!payload.brandName) {
      setError("Brand name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await updateSiteSettings(authToken, payload);
      const nextFormData = toFormData(response?.data || null);

      setFormData(nextFormData);
      setSavedFormData(nextFormData);
      toast.success("Storefront settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save storefront settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} />
        <Typography color="text.secondary" variant="body2">
          Loading storefront settings...
        </Typography>
      </Stack>
    );
  }

  return (
    <>
      <SectionHeader title="Storefront Settings" />

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
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
        }}
      >
        <Stack spacing={2}>
          <Panel title="Brand">
            <TextField
              fullWidth
              label="Brand Name"
              required
              value={formData.brandName}
              onChange={(event) => setRootField("brandName", event.target.value)}
            />
            <TextField
              fullWidth
              label="Logo URL"
              value={formData.logo.url}
              onChange={(event) => setField("logo", "url", event.target.value)}
            />
            <TextField
              fullWidth
              label="Logo Alt Text"
              value={formData.logo.alt}
              onChange={(event) => setField("logo", "alt", event.target.value)}
            />
            <TextField
              fullWidth
              label="Favicon URL"
              value={formData.favicon.url}
              onChange={(event) => setField("favicon", "url", event.target.value)}
            />
          </Panel>

          <Panel title="Contact">
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Support Email"
                value={formData.contact.supportEmail}
                onChange={(event) => setField("contact", "supportEmail", event.target.value)}
              />
              <TextField
                fullWidth
                label="Support Phone"
                value={formData.contact.supportPhone}
                onChange={(event) => setField("contact", "supportPhone", event.target.value)}
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="WhatsApp Number"
                value={formData.contact.whatsappNumber}
                onChange={(event) => setField("contact", "whatsappNumber", event.target.value)}
              />
              <TextField
                fullWidth
                label="Business Hours"
                value={formData.contact.businessHours}
                onChange={(event) => setField("contact", "businessHours", event.target.value)}
              />
            </Stack>
          </Panel>

          <Panel title="Social Links">
            {formData.socialLinks.length ? (
              <Stack spacing={1.5}>
                {formData.socialLinks.map((link, index) => (
                  <Stack
                    alignItems={{ xs: "stretch", md: "center" }}
                    direction={{ xs: "column", md: "row" }}
                    key={`${link.label}-${index}`}
                    spacing={1}
                  >
                    <Switch
                      checked={Boolean(link.isActive)}
                      onChange={(event) => setSocialLinkField(index, "isActive", event.target.checked)}
                    />
                    <TextField
                      fullWidth
                      label="Label"
                      size="small"
                      value={link.label}
                      onChange={(event) => setSocialLinkField(index, "label", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="URL"
                      size="small"
                      value={link.url}
                      onChange={(event) => setSocialLinkField(index, "url", event.target.value)}
                    />
                    <Tooltip title="Remove social link">
                      <IconButton color="error" onClick={() => removeSocialLink(index)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" variant="body2">
                No social links configured.
              </Typography>
            )}
            <Button startIcon={<AddIcon />} sx={{ alignSelf: "flex-start" }} onClick={addSocialLink}>
              Add Social Link
            </Button>
          </Panel>

          <Panel title="SEO">
            <TextField
              fullWidth
              label="Default SEO Title"
              value={formData.seo.title}
              onChange={(event) => setField("seo", "title", event.target.value)}
            />
            <TextField
              fullWidth
              label="Default SEO Description"
              multiline
              minRows={3}
              value={formData.seo.description}
              onChange={(event) => setField("seo", "description", event.target.value)}
            />
          </Panel>
        </Stack>

        <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
          <Panel title="Feature Flags">
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.featureFlags.showBlog)}
                  onChange={(event) => setField("featureFlags", "showBlog", event.target.checked)}
                />
              )}
              label="Show blog"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.featureFlags.showNavbarSearch)}
                  onChange={(event) => setField("featureFlags", "showNavbarSearch", event.target.checked)}
                />
              )}
              label="Show navbar search"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.featureFlags.enableReviews)}
                  onChange={(event) => setField("featureFlags", "enableReviews", event.target.checked)}
                />
              )}
              label="Enable reviews"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.featureFlags.enableWishlist)}
                  onChange={(event) => setField("featureFlags", "enableWishlist", event.target.checked)}
                />
              )}
              label="Enable wishlist"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.featureFlags.maintenanceMode)}
                  onChange={(event) => setField("featureFlags", "maintenanceMode", event.target.checked)}
                />
              )}
              label="Maintenance mode"
            />
          </Panel>

          <Panel title="Publishing">
            <Box>
              <Typography fontWeight={700} variant="body2">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Saved settings are available to the storefront API immediately.
              </Typography>
            </Box>
            <Divider />
            <Button
              disabled={saving || !dirty}
              fullWidth
              onClick={handleSave}
              startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
              variant="contained"
            >
              Save Settings
            </Button>
          </Panel>
        </Stack>
      </Box>
    </>
  );
};

export default StorefrontSettings;
