import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";

import ImageUploadField from "@/components/ImageUploadField";
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
  sections: [],
};

const SECTION_DEFINITIONS = [
  { key: "hero", label: "Hero" },
  { key: "promoStrip", label: "Promo Strip" },
  { key: "productSection", label: "Product Section" },
  { key: "testimonial", label: "Testimonial" },
  { key: "supportCards", label: "Support Cards" },
  { key: "finalCta", label: "Final CTA" },
];

const buildDefaultSections = (content = {}) => SECTION_DEFINITIONS.map((section, index) => ({
  id: section.key,
  isActive: content[section.key]?.isActive !== false,
  sortOrder: index,
  type: section.key,
}));

const normalizeSections = (content = {}) => {
  const rawSections = Array.isArray(content.sections) ? content.sections : [];
  const sectionByType = new Map(rawSections.map((section, index) => [
    section.type || section.id,
    {
      id: section.id || section.type,
      isActive: section.isActive !== false,
      sortOrder: Number.isFinite(Number(section.sortOrder)) ? Number(section.sortOrder) : index,
      type: section.type || section.id,
    },
  ]));

  return SECTION_DEFINITIONS
    .map((definition, index) => (
      sectionByType.get(definition.key) || {
        id: definition.key,
        isActive: content[definition.key]?.isActive !== false,
        sortOrder: rawSections.length + index,
        type: definition.key,
      }
    ))
    .sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0))
    .map((section, index) => ({ ...section, sortOrder: index }));
};

const getSectionMeta = (content, type) => (
  (content.sections || []).find((section) => section.type === type) || {
    isActive: content[type]?.isActive !== false,
    sortOrder: SECTION_DEFINITIONS.findIndex((section) => section.key === type),
  }
);

const getOrderedSections = (content = {}) => normalizeSections(content)
  .filter((section) => section.isActive !== false);

const supportIconMap = {
  invoice: ReceiptLongOutlinedIcon,
  shield: ShieldOutlinedIcon,
  shipping: LocalShippingOutlinedIcon,
  support: SupportAgentOutlinedIcon,
};

const Panel = ({ children, title }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", px: 2, py: 1.5 }}>
      <Typography fontWeight={800} variant="subtitle2">{title}</Typography>
    </Box>
    <Stack spacing={2} sx={{ p: 2 }}>{children}</Stack>
  </Paper>
);

const PreviewButton = ({ children }) => (
  <Button
    disableElevation
    size="small"
    sx={{
      bgcolor: "text.primary",
      color: "#ffffff",
      minHeight: 34,
      px: 1.6,
      "&:hover": {
        bgcolor: "primary.main",
      },
    }}
    variant="contained"
  >
    {children}
  </Button>
);

const HomepagePreview = ({ content, viewport }) => {
  const isMobile = viewport === "mobile";
  const previewWidth = isMobile ? 390 : 1180;
  const hero = content.hero || EMPTY_CONTENT.hero;
  const promoStrip = content.promoStrip || EMPTY_CONTENT.promoStrip;
  const productSection = content.productSection || EMPTY_CONTENT.productSection;
  const testimonial = content.testimonial || EMPTY_CONTENT.testimonial;
  const supportCards = content.supportCards || EMPTY_CONTENT.supportCards;
  const finalCta = content.finalCta || EMPTY_CONTENT.finalCta;
  const renderSection = (type) => {
    if (type === "hero" && hero.isActive) {
      return (
        <Box
          key="hero"
          sx={{
            alignItems: "stretch",
            backgroundImage: [
              "linear-gradient(90deg, rgba(247, 244, 239, 0.98) 0%, rgba(247, 244, 239, 0.9) 34%, rgba(247, 244, 239, 0.34) 62%, rgba(247, 244, 239, 0.06) 100%)",
              hero.backgroundImageUrl ? `url(${hero.backgroundImageUrl})` : "",
            ].filter(Boolean).join(", "),
            backgroundPosition: isMobile ? "62% center" : "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            display: "flex",
            minHeight: isMobile ? 520 : 620,
            px: isMobile ? 2.5 : 7,
          }}
        >
          <Stack justifyContent="center" spacing={2.5} sx={{ maxWidth: isMobile ? 330 : 680, py: isMobile ? 6 : 9 }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 650, textTransform: "uppercase" }}>
              {hero.eyebrow}
            </Typography>
            <Typography component="h1" sx={{ fontSize: isMobile ? "3rem" : "6rem", fontWeight: 500, lineHeight: 0.94 }}>
              {hero.title}
            </Typography>
            <Typography sx={{ color: "#5f6368", fontSize: isMobile ? "0.98rem" : "1.08rem", lineHeight: 1.6, maxWidth: 520 }}>
              {hero.subtitle}
            </Typography>
            <Stack direction={isMobile ? "column" : "row"} spacing={1.5}>
              <PreviewButton>{hero.primaryCtaLabel}</PreviewButton>
              <Button size="small" variant="text">{hero.secondaryCtaLabel}</Button>
            </Stack>
          </Stack>
        </Box>
      );
    }

    if (type === "promoStrip" && promoStrip.isActive && promoStrip.items.length) {
      return (
        <Box key="promoStrip" sx={{ borderBottom: "1px solid #e6dfd5", overflow: "hidden", py: 1.5 }}>
          <Stack direction="row" spacing={3} sx={{ px: 2, whiteSpace: "nowrap" }}>
            {promoStrip.items.map((item, index) => (
              <Stack alignItems="center" direction="row" key={`${item}-${index}`} spacing={1.5}>
                <Typography sx={{ fontSize: "0.84rem", fontWeight: 650 }}>{item}</Typography>
                <BoltOutlinedIcon sx={{ color: "#5f6368", fontSize: 18 }} />
              </Stack>
            ))}
          </Stack>
        </Box>
      );
    }

    if (type === "productSection" && productSection.isActive) {
      return (
        <Box key="productSection" sx={{ px: isMobile ? 2.5 : 7, py: isMobile ? 5 : 7 }}>
          <Stack spacing={3}>
            <Box sx={{ alignItems: isMobile ? "flex-start" : "flex-end", display: "grid", gap: 2, gridTemplateColumns: isMobile ? "1fr" : "1fr auto" }}>
              <Stack spacing={1}>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 600 }}>{productSection.eyebrow}</Typography>
                <Typography component="h2" sx={{ fontSize: isMobile ? "2.2rem" : "3.2rem", fontWeight: 500, lineHeight: 1 }}>
                  {productSection.title}
                </Typography>
              </Stack>
              <PreviewButton>{productSection.buttonLabel}</PreviewButton>
            </Box>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}>
              {Array.from({ length: Math.min(Number(productSection.productLimit || 4), isMobile ? 2 : 4) }).map((_, index) => (
                <Box key={index} sx={{ bgcolor: "#ffffff", border: "1px solid #e6dfd5", minHeight: isMobile ? 180 : 260 }}>
                  <Box sx={{ bgcolor: "#ebe4d9", height: isMobile ? 118 : 185 }} />
                  <Stack spacing={0.6} sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 750 }}>Product preview</Typography>
                    <Typography color="text.secondary" variant="caption">Raven Fold</Typography>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Stack>
        </Box>
      );
    }

    if (type === "testimonial" && testimonial.isActive) {
      return (
        <Box key="testimonial" sx={{ bgcolor: "#ffffff", px: isMobile ? 2.5 : 7, py: isMobile ? 5 : 7, textAlign: "center" }}>
          <Stack alignItems="center" spacing={2}>
            <FormatQuoteRoundedIcon sx={{ color: "#d9461f", fontSize: 48 }} />
            <Typography component="h2" sx={{ fontSize: isMobile ? "1.75rem" : "2.7rem", fontWeight: 450, lineHeight: 1.25 }}>
              "{testimonial.quote}"
            </Typography>
            <Stack alignItems="center" spacing={0.75}>
              <Stack direction="row" spacing={0.35}>
                {Array.from({ length: Math.round(testimonial.rating || 5) }).map((_, index) => (
                  <StarRoundedIcon key={index} sx={{ color: "#e19a00", fontSize: 18 }} />
                ))}
              </Stack>
              <Typography sx={{ fontWeight: 650 }}>{testimonial.author}</Typography>
            </Stack>
          </Stack>
        </Box>
      );
    }

    if (type === "supportCards" && supportCards.isActive && supportCards.items.length) {
      return (
        <Box key="supportCards" sx={{ px: isMobile ? 2.5 : 7, py: isMobile ? 4 : 5 }}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)" }}>
            {supportCards.items.map(({ description, icon, title }) => {
              const Icon = supportIconMap[icon] || ShieldOutlinedIcon;

              return (
                <Stack alignItems="center" key={`${title}-${icon}`} spacing={1.2} sx={{ border: "1px solid #e6dfd5", minHeight: 190, p: 2.5, textAlign: "center" }}>
                  <Icon sx={{ color: "#d9461f", fontSize: 32 }} />
                  <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
                  <Typography sx={{ color: "#5f6368", fontSize: "0.9rem", lineHeight: 1.5 }}>{description}</Typography>
                </Stack>
              );
            })}
          </Box>
        </Box>
      );
    }

    if (type === "finalCta" && finalCta.isActive) {
      return (
        <Box key="finalCta" sx={{ px: isMobile ? 2.5 : 7, pb: isMobile ? 5 : 7 }}>
          <Box sx={{ alignItems: "center", borderTop: "1px solid #e6dfd5", display: "grid", gap: 2, gridTemplateColumns: isMobile ? "1fr" : "1fr auto", pt: 3 }}>
            <Typography component="h2" sx={{ fontSize: isMobile ? "2rem" : "3.1rem", fontWeight: 650, lineHeight: 1 }}>
              {finalCta.title}
            </Typography>
            <PreviewButton>{finalCta.buttonLabel}</PreviewButton>
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box
      sx={{
        bgcolor: "grey.100",
        display: "flex",
        justifyContent: "center",
        minHeight: 420,
        overflow: "auto",
        p: { xs: 1, md: 2 },
      }}
    >
      <Box
        sx={{
          bgcolor: "#f7f4ef",
          boxShadow: 3,
          color: "#18181b",
          display: "flex",
          flexDirection: "column",
          maxWidth: "100%",
          overflow: "hidden",
          width: previewWidth,
        }}
      >
        {getOrderedSections(content).map((section) => renderSection(section.type))}
      </Box>
    </Box>
  );
};

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
  sections: normalizeSections(content),
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
    sections: normalizeSections(content).map((section, index) => ({
      id: normalizeText(section.id) || section.type,
      isActive: Boolean(section.isActive),
      sortOrder: index,
      type: normalizeText(section.type),
    })),
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewViewport, setPreviewViewport] = useState("desktop");
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

  const moveSection = (type, direction) => {
    setContent((current) => {
      const sections = normalizeSections(current);
      const currentIndex = sections.findIndex((section) => section.type === type);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sections.length) {
        return current;
      }

      const nextSections = [...sections];
      const [section] = nextSections.splice(currentIndex, 1);
      nextSections.splice(nextIndex, 0, section);

      return {
        ...current,
        sections: nextSections.map((nextSection, index) => ({ ...nextSection, sortOrder: index })),
      };
    });
  };

  const toggleBuilderSection = (type, isActive) => {
    setContent((current) => ({
      ...current,
      sections: normalizeSections(current).map((section) => (
        section.type === type ? { ...section, isActive } : section
      )),
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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <SectionHeader title="Homepage Builder" />
        <Button
          startIcon={<VisibilityIcon />}
          variant="outlined"
          onClick={() => setPreviewOpen(true)}
        >
          Preview
        </Button>
      </Stack>
      {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert> : null}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" } }}>
        <Stack spacing={2}>
          <Panel title="Hero">
            <FormControlLabel control={<Switch checked={content.hero.isActive} onChange={(event) => setSectionField("hero", "isActive", event.target.checked)} />} label="Show hero" />
            <TextField fullWidth label="Eyebrow" value={content.hero.eyebrow} onChange={(event) => setSectionField("hero", "eyebrow", event.target.value)} />
            <TextField fullWidth label="Title" value={content.hero.title} onChange={(event) => setSectionField("hero", "title", event.target.value)} />
            <TextField fullWidth label="Subtitle" multiline minRows={2} value={content.hero.subtitle} onChange={(event) => setSectionField("hero", "subtitle", event.target.value)} />
            <ImageUploadField
              disabled={saving}
              expectedHeight={900}
              expectedWidth={1920}
              folderKey="storefront"
              helperText="Used as the homepage first-screen background."
              label="Hero Background Image"
              previewAspectRatio="32 / 15"
              value={{ url: content.hero.backgroundImageUrl }}
              onChange={(asset) => setSectionField("hero", "backgroundImageUrl", asset.url)}
              onRemove={() => setSectionField("hero", "backgroundImageUrl", "")}
            />
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
          <Panel title="Section Order">
            <Typography color="text.secondary" variant="caption">
              Reorder and show/hide homepage sections.
            </Typography>
            <Stack spacing={1}>
              {normalizeSections(content).map((section, index, sections) => {
                const sectionLabel = SECTION_DEFINITIONS.find((definition) => definition.key === section.type)?.label || section.type;

                return (
                  <Paper key={section.type} variant="outlined" sx={{ p: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap variant="body2">{sectionLabel}</Typography>
                        <Typography color="text.secondary" variant="caption">Position {index + 1}</Typography>
                      </Box>
                      <Switch
                        checked={section.isActive !== false}
                        size="small"
                        onChange={(event) => toggleBuilderSection(section.type, event.target.checked)}
                      />
                      <Tooltip title="Move up">
                        <span>
                          <IconButton disabled={index === 0} size="small" onClick={() => moveSection(section.type, -1)}>
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton disabled={index === sections.length - 1} size="small" onClick={() => moveSection(section.type, 1)}>
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Panel>

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

      <Dialog
        fullWidth
        maxWidth="xl"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        <DialogTitle>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography fontWeight={800} variant="h6">Homepage Preview</Typography>
              <Typography color="text.secondary" variant="body2">
                Preview uses the current unsaved builder values.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant={previewViewport === "desktop" ? "contained" : "outlined"}
                onClick={() => setPreviewViewport("desktop")}
              >
                Desktop
              </Button>
              <Button
                size="small"
                variant={previewViewport === "mobile" ? "contained" : "outlined"}
                onClick={() => setPreviewViewport("mobile")}
              >
                Mobile
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <HomepagePreview content={content} viewport={previewViewport} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HomepageBuilder;
