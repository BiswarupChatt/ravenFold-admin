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
import { fetchAdminHomePage, updateAdminHomePage } from "@/lib/api/storefrontPageApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { normalizeText } from "@/lib/utils/utils";

const EMPTY_CONTENT = {
  finalCta: { buttonLabel: "", buttonUrl: "", isActive: true, title: "" },
  hero: {
    backgroundImageUrl: "",
    eyebrow: "",
    isActive: true,
    primaryCtaLabel: "",
    primaryCtaUrl: "",
    secondaryCtaLabel: "",
    secondaryCtaUrl: "",
    subtitle: "",
    title: "",
  },
  productSection: {
    buttonLabel: "",
    buttonUrl: "",
    eyebrow: "",
    isActive: true,
    productLimit: 4,
    tabLabel: "",
    title: "",
  },
  promoStrip: { isActive: true, items: [] },
  supportCards: { isActive: true, items: [] },
  testimonial: { author: "", isActive: true, quote: "", rating: 5 },
};

const Panel = ({ children, title }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2, py: 1.5 }}>
      <Typography fontWeight={800} variant="subtitle2">{title}</Typography>
    </Box>
    <Stack spacing={2} sx={{ p: 2 }}>{children}</Stack>
  </Paper>
);

const normalizeContent = (content = {}) => ({
  finalCta: { ...EMPTY_CONTENT.finalCta, ...(content.finalCta || {}) },
  hero: { ...EMPTY_CONTENT.hero, ...(content.hero || {}) },
  productSection: { ...EMPTY_CONTENT.productSection, ...(content.productSection || {}) },
  promoStrip: {
    ...EMPTY_CONTENT.promoStrip,
    ...(content.promoStrip || {}),
    items: Array.isArray(content.promoStrip?.items) ? content.promoStrip.items : [],
  },
  supportCards: {
    ...EMPTY_CONTENT.supportCards,
    ...(content.supportCards || {}),
    items: Array.isArray(content.supportCards?.items) ? content.supportCards.items : [],
  },
  testimonial: { ...EMPTY_CONTENT.testimonial, ...(content.testimonial || {}) },
});

const buildPayload = (content) => ({
  content: {
    finalCta: {
      buttonLabel: normalizeText(content.finalCta.buttonLabel),
      buttonUrl: normalizeText(content.finalCta.buttonUrl),
      isActive: Boolean(content.finalCta.isActive),
      title: normalizeText(content.finalCta.title),
    },
    hero: {
      backgroundImageUrl: normalizeText(content.hero.backgroundImageUrl),
      eyebrow: normalizeText(content.hero.eyebrow),
      isActive: Boolean(content.hero.isActive),
      primaryCtaLabel: normalizeText(content.hero.primaryCtaLabel),
      primaryCtaUrl: normalizeText(content.hero.primaryCtaUrl),
      secondaryCtaLabel: normalizeText(content.hero.secondaryCtaLabel),
      secondaryCtaUrl: normalizeText(content.hero.secondaryCtaUrl),
      subtitle: normalizeText(content.hero.subtitle),
      title: normalizeText(content.hero.title),
    },
    productSection: {
      buttonLabel: normalizeText(content.productSection.buttonLabel),
      buttonUrl: normalizeText(content.productSection.buttonUrl),
      eyebrow: normalizeText(content.productSection.eyebrow),
      isActive: Boolean(content.productSection.isActive),
      productLimit: Number(content.productSection.productLimit || 4),
      tabLabel: normalizeText(content.productSection.tabLabel),
      title: normalizeText(content.productSection.title),
    },
    promoStrip: {
      isActive: Boolean(content.promoStrip.isActive),
      items: content.promoStrip.items.map(normalizeText).filter(Boolean),
    },
    supportCards: {
      isActive: Boolean(content.supportCards.isActive),
      items: content.supportCards.items
        .map((item) => ({
          description: normalizeText(item.description),
          icon: normalizeText(item.icon) || "shield",
          title: normalizeText(item.title),
        }))
        .filter((item) => item.title || item.description),
    },
    testimonial: {
      author: normalizeText(content.testimonial.author),
      isActive: Boolean(content.testimonial.isActive),
      quote: normalizeText(content.testimonial.quote),
      rating: Number(content.testimonial.rating || 5),
    },
  },
  status: "published",
  title: "Homepage",
});

const HomepageBuilder = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [savedContent, setSavedContent] = useState(EMPTY_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty = useMemo(() => (
    JSON.stringify(buildPayload(content)) !== JSON.stringify(buildPayload(savedContent))
  ), [content, savedContent]);

  const loadHomePage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const page = await fetchAdminHomePage(authToken);
      const nextContent = normalizeContent(page?.content || {});
      setContent(nextContent);
      setSavedContent(nextContent);
    } catch (err) {
      setError(err.message || "Failed to load homepage.");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadHomePage();
  }, [loadHomePage]);

  const setSectionField = (section, field, value) => {
    setContent((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  };

  const setListItem = (section, index, value) => {
    setContent((current) => ({
      ...current,
      [section]: {
        ...current[section],
        items: current[section].items.map((item, itemIndex) => (itemIndex === index ? value : item)),
      },
    }));
  };

  const addListItem = (section, value) => {
    setContent((current) => ({
      ...current,
      [section]: { ...current[section], items: [...current[section].items, value] },
    }));
  };

  const removeListItem = (section, index) => {
    setContent((current) => ({
      ...current,
      [section]: {
        ...current[section],
        items: current[section].items.filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  };

  const handleSave = async () => {
    const payload = buildPayload(content);

    setSaving(true);
    setError("");

    try {
      const response = await updateAdminHomePage(authToken, payload);
      const nextContent = normalizeContent(response?.data?.content || {});
      setContent(nextContent);
      setSavedContent(nextContent);
      toast.success("Homepage saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save homepage.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} />
        <Typography color="text.secondary" variant="body2">Loading homepage builder...</Typography>
      </Stack>
    );
  }

  return (
    <>
      <SectionHeader title="Homepage Builder" />
      {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" } }}>
        <Stack spacing={2}>
          <Panel title="Hero">
            <FormControlLabel control={<Switch checked={content.hero.isActive} onChange={(event) => setSectionField("hero", "isActive", event.target.checked)} />} label="Show hero" />
            <TextField fullWidth label="Eyebrow" value={content.hero.eyebrow} onChange={(event) => setSectionField("hero", "eyebrow", event.target.value)} />
            <TextField fullWidth label="Title" value={content.hero.title} onChange={(event) => setSectionField("hero", "title", event.target.value)} />
            <TextField fullWidth label="Subtitle" multiline minRows={2} value={content.hero.subtitle} onChange={(event) => setSectionField("hero", "subtitle", event.target.value)} />
            <TextField fullWidth label="Background Image URL" value={content.hero.backgroundImageUrl} onChange={(event) => setSectionField("hero", "backgroundImageUrl", event.target.value)} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField fullWidth label="Primary CTA Label" value={content.hero.primaryCtaLabel} onChange={(event) => setSectionField("hero", "primaryCtaLabel", event.target.value)} />
              <TextField fullWidth label="Primary CTA URL" value={content.hero.primaryCtaUrl} onChange={(event) => setSectionField("hero", "primaryCtaUrl", event.target.value)} />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField fullWidth label="Secondary CTA Label" value={content.hero.secondaryCtaLabel} onChange={(event) => setSectionField("hero", "secondaryCtaLabel", event.target.value)} />
              <TextField fullWidth label="Secondary CTA URL" value={content.hero.secondaryCtaUrl} onChange={(event) => setSectionField("hero", "secondaryCtaUrl", event.target.value)} />
            </Stack>
          </Panel>

          <Panel title="Promo Strip">
            <FormControlLabel control={<Switch checked={content.promoStrip.isActive} onChange={(event) => setSectionField("promoStrip", "isActive", event.target.checked)} />} label="Show promo strip" />
            {content.promoStrip.items.map((item, index) => (
              <Stack direction="row" spacing={1} key={`${item}-${index}`}>
                <TextField fullWidth label={`Promo item ${index + 1}`} size="small" value={item} onChange={(event) => setListItem("promoStrip", index, event.target.value)} />
                <Tooltip title="Remove"><IconButton color="error" onClick={() => removeListItem("promoStrip", index)}><DeleteOutlineIcon /></IconButton></Tooltip>
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} sx={{ alignSelf: "flex-start" }} onClick={() => addListItem("promoStrip", "")}>Add Promo Item</Button>
          </Panel>

          <Panel title="Product Section">
            <FormControlLabel control={<Switch checked={content.productSection.isActive} onChange={(event) => setSectionField("productSection", "isActive", event.target.checked)} />} label="Show product section" />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField fullWidth label="Tab Label" value={content.productSection.tabLabel} onChange={(event) => setSectionField("productSection", "tabLabel", event.target.value)} />
              <TextField fullWidth label="Product Limit" type="number" value={content.productSection.productLimit} onChange={(event) => setSectionField("productSection", "productLimit", event.target.value)} />
            </Stack>
            <TextField fullWidth label="Eyebrow" value={content.productSection.eyebrow} onChange={(event) => setSectionField("productSection", "eyebrow", event.target.value)} />
            <TextField fullWidth label="Title" value={content.productSection.title} onChange={(event) => setSectionField("productSection", "title", event.target.value)} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField fullWidth label="Button Label" value={content.productSection.buttonLabel} onChange={(event) => setSectionField("productSection", "buttonLabel", event.target.value)} />
              <TextField fullWidth label="Button URL" value={content.productSection.buttonUrl} onChange={(event) => setSectionField("productSection", "buttonUrl", event.target.value)} />
            </Stack>
          </Panel>

          <Panel title="Testimonial">
            <FormControlLabel control={<Switch checked={content.testimonial.isActive} onChange={(event) => setSectionField("testimonial", "isActive", event.target.checked)} />} label="Show testimonial" />
            <TextField fullWidth label="Quote" multiline minRows={3} value={content.testimonial.quote} onChange={(event) => setSectionField("testimonial", "quote", event.target.value)} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField fullWidth label="Author" value={content.testimonial.author} onChange={(event) => setSectionField("testimonial", "author", event.target.value)} />
              <TextField fullWidth label="Rating" type="number" value={content.testimonial.rating} onChange={(event) => setSectionField("testimonial", "rating", event.target.value)} />
            </Stack>
          </Panel>

          <Panel title="Support Cards">
            <FormControlLabel control={<Switch checked={content.supportCards.isActive} onChange={(event) => setSectionField("supportCards", "isActive", event.target.checked)} />} label="Show support cards" />
            {content.supportCards.items.map((item, index) => (
              <Paper key={`${item.title}-${index}`} variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                    <TextField fullWidth label="Title" size="small" value={item.title} onChange={(event) => setListItem("supportCards", index, { ...item, title: event.target.value })} />
                    <TextField fullWidth label="Icon" size="small" helperText="shield, shipping, invoice, support" value={item.icon} onChange={(event) => setListItem("supportCards", index, { ...item, icon: event.target.value })} />
                    <IconButton color="error" onClick={() => removeListItem("supportCards", index)}><DeleteOutlineIcon /></IconButton>
                  </Stack>
                  <TextField fullWidth label="Description" size="small" value={item.description} onChange={(event) => setListItem("supportCards", index, { ...item, description: event.target.value })} />
                </Stack>
              </Paper>
            ))}
            <Button startIcon={<AddIcon />} sx={{ alignSelf: "flex-start" }} onClick={() => addListItem("supportCards", { description: "", icon: "shield", title: "" })}>Add Support Card</Button>
          </Panel>

          <Panel title="Final CTA">
            <FormControlLabel control={<Switch checked={content.finalCta.isActive} onChange={(event) => setSectionField("finalCta", "isActive", event.target.checked)} />} label="Show final CTA" />
            <TextField fullWidth label="Title" value={content.finalCta.title} onChange={(event) => setSectionField("finalCta", "title", event.target.value)} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField fullWidth label="Button Label" value={content.finalCta.buttonLabel} onChange={(event) => setSectionField("finalCta", "buttonLabel", event.target.value)} />
              <TextField fullWidth label="Button URL" value={content.finalCta.buttonUrl} onChange={(event) => setSectionField("finalCta", "buttonUrl", event.target.value)} />
            </Stack>
          </Panel>
        </Stack>

        <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
          <Panel title="Publishing">
            <Typography fontWeight={700} variant="body2">{dirty ? "Unsaved changes" : "All changes saved"}</Typography>
            <Typography color="text.secondary" variant="caption">Homepage changes go live immediately after save.</Typography>
            <Divider />
            <Button disabled={saving || !dirty} fullWidth onClick={handleSave} startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null} variant="contained">
              Save Homepage
            </Button>
          </Panel>
        </Stack>
      </Box>
    </>
  );
};

export default HomepageBuilder;
