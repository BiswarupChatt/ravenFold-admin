import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

import {
  createLocalImagePreviews,
  formatMoney,
  getDiscountPercent,
  moveArrayItem as moveImage,
  revokeLocalImagePreviews,
  splitCommaSeparatedValues,
  splitLines as splitImageUrls,
} from "@/lib/utils/utils";
import {
  PRODUCT_FORM_SECTION_IDS,
  getProductFormSectionSignature,
} from "../productFormSections";
import ProductAttributesPanel from "./ProductAttributesPanel";
import ProductImageSection from "./ProductImageSection";
import ProductSeoPanel from "./ProductSeoPanel";
import ProductShippingPanel from "./ProductShippingPanel";
import ReadOnlyField from "./ReadOnlyField";
import ProductVariantsPanel from "./ProductVariantsPanel";
import DetailPanel from "./DetailPanel";

const statusColors = {
  active: "success",
  draft: "default",
  inactive: "warning",
};

const getCategoryLabel = (categoryRows, categoryId) => {
  const category = categoryRows.find((item) => item.id === categoryId);

  return category?.name || "-";
};

const ProductDetailsPanel = memo(function ProductDetailsPanel({
  action,
  discountPercent,
  editable,
  formData,
  onChange,
}) {
  return (
    <DetailPanel
      title="Product details"
      action={action}
      accentColor="primary"
    >
      {editable ? (
        <Stack spacing={2}>
          <TextField
            label="Title"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            fullWidth
          />
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={onChange}
            fullWidth
            multiline
            minRows={4}
          />
          <TextField
            label="Short Description"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={onChange}
            fullWidth
            multiline
            minRows={2}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Base Price"
              name="basePrice"
              type="number"
              value={formData.basePrice}
              onChange={onChange}
              required
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              label="Sale Price"
              name="salePrice"
              type="number"
              value={formData.salePrice}
              onChange={onChange}
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={onChange}
              required
              fullWidth
            />
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <ReadOnlyField label="Title" value={formData.name} />
          <ReadOnlyField label="Description" value={formData.description} multiline />
          <ReadOnlyField label="Short Description" value={formData.shortDescription} multiline />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Base Price
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h6" fontWeight={800}>
                  {formatMoney(formData.basePrice)}
                </Typography>
                {discountPercent !== null ? (
                  <Chip label={`${discountPercent}% off`} color="success" size="small" />
                ) : null}
              </Stack>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Sale Price
              </Typography>
              <Typography variant="h6" fontWeight={800} color="success.main">
                {formatMoney(formData.salePrice)}
              </Typography>
            </Box>
          </Stack>
          <ReadOnlyField label="SKU" value={formData.sku} />
        </Stack>
      )}
    </DetailPanel>
  );
});

const ProductSettingsPanel = memo(function ProductSettingsPanel({
  action,
  displayStatus,
  editable,
  formData,
  onChange,
  onHasVariantsChange,
  productStatuses,
}) {
  return (
    <DetailPanel
      title="Product settings"
      action={action}
      accentColor="success"
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
              Status
            </Typography>
            {editable ? (
              <TextField
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={onChange}
                fullWidth
                size="small"
              >
                {productStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Chip
                label={displayStatus}
                color={statusColors[displayStatus] || "default"}
                size="small"
                variant={displayStatus === "draft" ? "outlined" : "filled"}
              />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
              Publishing
          </Typography>
            {editable ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <FormControlLabel
                  control={<Switch checked={formData.isFeatured} onChange={onChange} name="isFeatured" />}
                  label="Featured"
                />
                <FormControlLabel
                  control={(
                    <Switch
                      checked={formData.hasVariants}
                      onChange={onHasVariantsChange}
                      name="hasVariants"
                    />
                  )}
                  label="Has variants"
                />
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={formData.isFeatured ? "Featured" : "Not featured"}
                  color={formData.isFeatured ? "primary" : "default"}
                  size="small"
                  variant={formData.isFeatured ? "filled" : "outlined"}
                />
                <Chip
                  label={formData.hasVariants ? "Has variants" : "No variants"}
                  color={formData.hasVariants ? "primary" : "default"}
                  size="small"
                  variant={formData.hasVariants ? "filled" : "outlined"}
                />
              </Stack>
            )}
          </Box>
        </Stack>
      </Stack>
    </DetailPanel>
  );
});

const ProductOrganizationPanel = memo(function ProductOrganizationPanel({
  action,
  categoryRows,
  displayCategory,
  editable,
  formData,
  getHierarchyColor,
  onChange,
  tagValues,
}) {
  return (
    <DetailPanel
      title="Product organization"
      action={action}
      accentColor="info"
    >
      {editable ? (
        <Stack spacing={2}>
          <TextField
            select
            label="Category"
            name="categoryId"
            value={formData.categoryId}
            onChange={onChange}
            required
            fullWidth
            size="small"
          >
            <MenuItem value="" disabled>
              Select category
            </MenuItem>
            {categoryRows.map((category) => (
              <MenuItem
                key={category.id}
                value={category.id}
                sx={{ pl: 2 + category.depth * 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: getHierarchyColor(category.depth),
                      boxShadow: `0 0 0 3px ${getHierarchyColor(category.depth)}22`,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" noWrap>
                    {category.name}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Slug"
              name="slug"
              value={formData.slug}
              onChange={onChange}
              fullWidth
              size="small"
              helperText="Leave blank to generate it from the name."
            />
            <TextField
              label="Tags"
              name="tags"
              value={formData.tags}
              onChange={onChange}
              fullWidth
              size="small"
              helperText="Separate tags with commas."
            />
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.25}>
          <ReadOnlyField label="Category" value={displayCategory} />
          <ReadOnlyField label="Slug" value={formData.slug} />
          {tagValues.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {tagValues.map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
          ) : (
            <ReadOnlyField label="Tags" value="-" />
          )}
        </Stack>
      )}
    </DetailPanel>
  );
});

const ProductDetailsForm = ({
  initialEditable,
  formData,
  persistedFormData,
  saving,
  savingSection,
  uploadingImages,
  editingProduct,
  categoryRows,
  productStatuses,
  getHierarchyColor,
  variantsOpen,
  onClose,
  onClear,
  onChange,
  onHasVariantsChange,
  onImagesChange,
  onAttributesChange,
  onSelectImageFiles,
  onVariantsChanged,
  imageQueueResetKey,
  hideSubmitWhenReadOnly = false,
  onSubmit,
  onSubmitSection,
}) => {
  const [detailsEditable, setDetailsEditable] = useState(() => initialEditable ?? true);
  const [initialFormSignature, setInitialFormSignature] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [localImagePreviews, setLocalImagePreviews] = useState([]);
  const [localImageUploadFailed, setLocalImageUploadFailed] = useState(false);
  const [actionBarBounds, setActionBarBounds] = useState(null);
  const formRootRef = useRef(null);
  const openIdentityRef = useRef("");
  const formDataRef = useRef(formData);
  const localImagePreviewsRef = useRef([]);
  const savedFormData = persistedFormData || formData;
  formDataRef.current = formData;

  const detailsFormData = useMemo(() => ({
    name: formData.name,
    description: formData.description,
    shortDescription: formData.shortDescription,
    basePrice: formData.basePrice,
    salePrice: formData.salePrice,
    sku: formData.sku,
  }), [
    formData.name,
    formData.description,
    formData.shortDescription,
    formData.basePrice,
    formData.salePrice,
    formData.sku,
  ]);
  const savedDetailsFormData = useMemo(() => ({
    name: savedFormData.name,
    description: savedFormData.description,
    shortDescription: savedFormData.shortDescription,
    basePrice: savedFormData.basePrice,
    salePrice: savedFormData.salePrice,
    sku: savedFormData.sku,
  }), [
    savedFormData.name,
    savedFormData.description,
    savedFormData.shortDescription,
    savedFormData.basePrice,
    savedFormData.salePrice,
    savedFormData.sku,
  ]);
  const settingsFormData = useMemo(() => ({
    status: formData.status,
    isFeatured: formData.isFeatured,
    hasVariants: formData.hasVariants,
  }), [formData.status, formData.isFeatured, formData.hasVariants]);
  const savedSettingsFormData = useMemo(() => ({
    status: savedFormData.status,
    isFeatured: savedFormData.isFeatured,
    hasVariants: savedFormData.hasVariants,
  }), [savedFormData.status, savedFormData.isFeatured, savedFormData.hasVariants]);
  const organizationFormData = useMemo(() => ({
    categoryId: formData.categoryId,
    slug: formData.slug,
    tags: formData.tags,
  }), [formData.categoryId, formData.slug, formData.tags]);
  const savedOrganizationFormData = useMemo(() => ({
    categoryId: savedFormData.categoryId,
    slug: savedFormData.slug,
    tags: savedFormData.tags,
  }), [savedFormData.categoryId, savedFormData.slug, savedFormData.tags]);
  const mediaFormData = useMemo(() => ({
    imageUrls: formData.imageUrls,
  }), [formData.imageUrls]);
  const savedMediaFormData = useMemo(() => ({
    imageUrls: savedFormData.imageUrls,
  }), [savedFormData.imageUrls]);
  const shippingFormData = useMemo(() => ({
    shippingRequiresShipping: formData.shippingRequiresShipping,
    shippingWeightValue: formData.shippingWeightValue,
    shippingWeightUnit: formData.shippingWeightUnit,
    shippingLength: formData.shippingLength,
    shippingWidth: formData.shippingWidth,
    shippingHeight: formData.shippingHeight,
    shippingDimensionUnit: formData.shippingDimensionUnit,
    shippingClass: formData.shippingClass,
    shippingFreeShippingEligible: formData.shippingFreeShippingEligible,
  }), [
    formData.shippingRequiresShipping,
    formData.shippingWeightValue,
    formData.shippingWeightUnit,
    formData.shippingLength,
    formData.shippingWidth,
    formData.shippingHeight,
    formData.shippingDimensionUnit,
    formData.shippingClass,
    formData.shippingFreeShippingEligible,
  ]);
  const savedShippingFormData = useMemo(() => ({
    shippingRequiresShipping: savedFormData.shippingRequiresShipping,
    shippingWeightValue: savedFormData.shippingWeightValue,
    shippingWeightUnit: savedFormData.shippingWeightUnit,
    shippingLength: savedFormData.shippingLength,
    shippingWidth: savedFormData.shippingWidth,
    shippingHeight: savedFormData.shippingHeight,
    shippingDimensionUnit: savedFormData.shippingDimensionUnit,
    shippingClass: savedFormData.shippingClass,
    shippingFreeShippingEligible: savedFormData.shippingFreeShippingEligible,
  }), [
    savedFormData.shippingRequiresShipping,
    savedFormData.shippingWeightValue,
    savedFormData.shippingWeightUnit,
    savedFormData.shippingLength,
    savedFormData.shippingWidth,
    savedFormData.shippingHeight,
    savedFormData.shippingDimensionUnit,
    savedFormData.shippingClass,
    savedFormData.shippingFreeShippingEligible,
  ]);
  const attributesFormData = useMemo(() => ({
    attributes: formData.attributes,
  }), [formData.attributes]);
  const savedAttributesFormData = useMemo(() => ({
    attributes: savedFormData.attributes,
  }), [savedFormData.attributes]);
  const seoFormData = useMemo(() => ({
    seoTitle: formData.seoTitle,
    seoDescription: formData.seoDescription,
    seoKeywords: formData.seoKeywords,
    seoCanonicalUrl: formData.seoCanonicalUrl,
    seoNoIndex: formData.seoNoIndex,
  }), [
    formData.seoTitle,
    formData.seoDescription,
    formData.seoKeywords,
    formData.seoCanonicalUrl,
    formData.seoNoIndex,
  ]);
  const savedSeoFormData = useMemo(() => ({
    seoTitle: savedFormData.seoTitle,
    seoDescription: savedFormData.seoDescription,
    seoKeywords: savedFormData.seoKeywords,
    seoCanonicalUrl: savedFormData.seoCanonicalUrl,
    seoNoIndex: savedFormData.seoNoIndex,
  }), [
    savedFormData.seoTitle,
    savedFormData.seoDescription,
    savedFormData.seoKeywords,
    savedFormData.seoCanonicalUrl,
    savedFormData.seoNoIndex,
  ]);
  const imageUrls = useMemo(() => splitImageUrls(mediaFormData.imageUrls), [mediaFormData.imageUrls]);
  const tagValues = useMemo(() => splitCommaSeparatedValues(organizationFormData.tags), [organizationFormData.tags]);
  const attributeRows = useMemo(
    () => (Array.isArray(attributesFormData.attributes) ? attributesFormData.attributes : []),
    [attributesFormData.attributes]
  );
  const visibleAttributeRows = useMemo(() => (
    attributeRows
      .map((attribute) => ({
        name: String(attribute?.name || "").trim(),
        value: String(attribute?.value || "").trim(),
      }))
      .filter((attribute) => attribute.name || attribute.value)
  ), [attributeRows]);
  const detailsDirty = useMemo(() => (
    getProductFormSectionSignature(detailsFormData, PRODUCT_FORM_SECTION_IDS.DETAILS) !==
      getProductFormSectionSignature(savedDetailsFormData, PRODUCT_FORM_SECTION_IDS.DETAILS)
  ), [detailsFormData, savedDetailsFormData]);
  const settingsDirty = useMemo(() => (
    getProductFormSectionSignature(settingsFormData, PRODUCT_FORM_SECTION_IDS.SETTINGS) !==
      getProductFormSectionSignature(savedSettingsFormData, PRODUCT_FORM_SECTION_IDS.SETTINGS)
  ), [settingsFormData, savedSettingsFormData]);
  const organizationDirty = useMemo(() => (
    getProductFormSectionSignature(organizationFormData, PRODUCT_FORM_SECTION_IDS.ORGANIZATION) !==
      getProductFormSectionSignature(savedOrganizationFormData, PRODUCT_FORM_SECTION_IDS.ORGANIZATION)
  ), [organizationFormData, savedOrganizationFormData]);
  const mediaDirty = useMemo(() => (
    getProductFormSectionSignature(mediaFormData, PRODUCT_FORM_SECTION_IDS.MEDIA) !==
      getProductFormSectionSignature(savedMediaFormData, PRODUCT_FORM_SECTION_IDS.MEDIA)
  ), [mediaFormData, savedMediaFormData]);
  const shippingDirty = useMemo(() => (
    getProductFormSectionSignature(shippingFormData, PRODUCT_FORM_SECTION_IDS.SHIPPING) !==
      getProductFormSectionSignature(savedShippingFormData, PRODUCT_FORM_SECTION_IDS.SHIPPING)
  ), [shippingFormData, savedShippingFormData]);
  const attributesDirty = useMemo(() => (
    getProductFormSectionSignature(attributesFormData, PRODUCT_FORM_SECTION_IDS.ATTRIBUTES) !==
      getProductFormSectionSignature(savedAttributesFormData, PRODUCT_FORM_SECTION_IDS.ATTRIBUTES)
  ), [attributesFormData, savedAttributesFormData]);
  const seoDirty = useMemo(() => (
    getProductFormSectionSignature(seoFormData, PRODUCT_FORM_SECTION_IDS.SEO) !==
      getProductFormSectionSignature(savedSeoFormData, PRODUCT_FORM_SECTION_IDS.SEO)
  ), [seoFormData, savedSeoFormData]);
  const sectionDirtyById = useMemo(() => ({
    [PRODUCT_FORM_SECTION_IDS.DETAILS]: detailsDirty,
    [PRODUCT_FORM_SECTION_IDS.SETTINGS]: settingsDirty,
    [PRODUCT_FORM_SECTION_IDS.ORGANIZATION]: organizationDirty,
    [PRODUCT_FORM_SECTION_IDS.MEDIA]: mediaDirty,
    [PRODUCT_FORM_SECTION_IDS.SHIPPING]: shippingDirty,
    [PRODUCT_FORM_SECTION_IDS.ATTRIBUTES]: attributesDirty,
    [PRODUCT_FORM_SECTION_IDS.SEO]: seoDirty,
  }), [
    detailsDirty,
    settingsDirty,
    organizationDirty,
    mediaDirty,
    shippingDirty,
    attributesDirty,
    seoDirty,
  ]);
  const isEditingProduct = Boolean(editingProduct);
  const editable = !isEditingProduct || detailsEditable;
  const currentFormSignature = useMemo(
    () => (isEditingProduct ? "" : JSON.stringify(formData)),
    [formData, isEditingProduct]
  );
  const hasUnsavedSectionChanges = Object.values(sectionDirtyById).some(Boolean);
  const busy = saving || Boolean(savingSection) || uploadingImages;
  const hasUnsavedChanges = isEditingProduct
    ? hasUnsavedSectionChanges
    : initialFormSignature !== "" && currentFormSignature !== initialFormSignature;
  const hasQueuedImages = localImagePreviews.length > 0;
  const hasChangesToSave = hasUnsavedChanges || hasQueuedImages;
  const hasFooterWarning = hasChangesToSave;
  const showActionBar = !hideSubmitWhenReadOnly || !isEditingProduct || (editable && hasChangesToSave);
  const footerWarningLabel = hasQueuedImages
    ? `${localImagePreviews.length} image${localImagePreviews.length === 1 ? "" : "s"} queued for upload`
    : "Unsaved changes";
  const displayStatus = settingsFormData.status || "draft";
  const displayCategory = getCategoryLabel(categoryRows, organizationFormData.categoryId);
  const discountPercent = getDiscountPercent(detailsFormData.basePrice, detailsFormData.salePrice);
  const productIdentity = editingProduct?.id || "new";
  const openIdentity = `${productIdentity}:${initialEditable ?? "auto"}`;

  useEffect(() => {
    if (openIdentityRef.current !== openIdentity) {
      setDetailsEditable(initialEditable ?? !editingProduct);
      setInitialFormSignature(currentFormSignature);
      openIdentityRef.current = openIdentity;
      setDraggedImageIndex(null);
      setLocalImageUploadFailed(false);
      setLocalImagePreviews((currentPreviews) => {
        revokeLocalImagePreviews(currentPreviews);
        return [];
      });
    }
  }, [editingProduct, currentFormSignature, initialEditable, openIdentity]);

  useEffect(() => {
    localImagePreviewsRef.current = localImagePreviews;
  }, [localImagePreviews]);

  useEffect(() => {
    if (imageQueueResetKey === undefined) {
      return;
    }

    setLocalImageUploadFailed(false);
    setLocalImagePreviews((currentPreviews) => {
      revokeLocalImagePreviews(currentPreviews);
      return [];
    });
  }, [imageQueueResetKey]);

  useEffect(() => {
    return () => revokeLocalImagePreviews(localImagePreviewsRef.current);
  }, []);

  useEffect(() => {
    if (!showActionBar || !formRootRef.current) {
      setActionBarBounds(null);
      return undefined;
    }

    let frameId = 0;

    const updateActionBarBounds = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        const rect = formRootRef.current?.getBoundingClientRect();

        if (!rect) {
          return;
        }

        const left = Math.max(rect.left, 0);
        const width = Math.min(rect.width, window.innerWidth - left);

        setActionBarBounds((currentBounds) => {
          if (
            currentBounds &&
            Math.abs(currentBounds.left - left) < 0.5 &&
            Math.abs(currentBounds.width - width) < 0.5
          ) {
            return currentBounds;
          }

          return { left, width };
        });
      });
    };

    updateActionBarBounds();

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(updateActionBarBounds);

    resizeObserver?.observe(formRootRef.current);
    window.addEventListener("resize", updateActionBarBounds);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateActionBarBounds);
    };
  }, [showActionBar]);

  const getSectionSaveButton = useCallback((sectionId, sectionHasChanges) => {
    if (!isEditingProduct || !editable || !onSubmitSection) {
      return null;
    }

    const isSectionSaving = savingSection === sectionId;

    return (
      <Button
        variant="contained"
        size="small"
        onClick={() => onSubmitSection(sectionId, formDataRef.current)}
        disabled={busy || !sectionHasChanges}
        startIcon={isSectionSaving ? <CircularProgress color="inherit" size={14} /> : <SaveIcon fontSize="small" />}
        sx={{ minWidth: 88, whiteSpace: "nowrap" }}
      >
        Save
      </Button>
    );
  }, [busy, editable, isEditingProduct, onSubmitSection, savingSection]);

  const detailsSaveAction = useMemo(
    () => getSectionSaveButton(PRODUCT_FORM_SECTION_IDS.DETAILS, detailsDirty),
    [detailsDirty, getSectionSaveButton]
  );
  const settingsSaveAction = useMemo(
    () => getSectionSaveButton(PRODUCT_FORM_SECTION_IDS.SETTINGS, settingsDirty),
    [getSectionSaveButton, settingsDirty]
  );
  const organizationSaveAction = useMemo(
    () => getSectionSaveButton(PRODUCT_FORM_SECTION_IDS.ORGANIZATION, organizationDirty),
    [getSectionSaveButton, organizationDirty]
  );
  const mediaSaveAction = useMemo(
    () => getSectionSaveButton(PRODUCT_FORM_SECTION_IDS.MEDIA, mediaDirty || hasQueuedImages),
    [getSectionSaveButton, hasQueuedImages, mediaDirty]
  );
  const shippingSaveAction = useMemo(
    () => getSectionSaveButton(PRODUCT_FORM_SECTION_IDS.SHIPPING, shippingDirty),
    [getSectionSaveButton, shippingDirty]
  );
  const attributesSaveAction = useMemo(
    () => getSectionSaveButton(PRODUCT_FORM_SECTION_IDS.ATTRIBUTES, attributesDirty),
    [attributesDirty, getSectionSaveButton]
  );
  const seoSaveAction = useMemo(
    () => getSectionSaveButton(PRODUCT_FORM_SECTION_IDS.SEO, seoDirty),
    [getSectionSaveButton, seoDirty]
  );

  const uploadFilesWithLocalPreviews = useCallback(async (files) => {
    const fileList = Array.from(files || []);

    if (fileList.length === 0 || !editable) {
      return;
    }

    setLocalImageUploadFailed(false);

    try {
      const selectedImageFiles = await onSelectImageFiles(fileList);
      const nextLocalImagePreviews = createLocalImagePreviews(selectedImageFiles);

      if (nextLocalImagePreviews.length > 0) {
        setLocalImagePreviews((currentPreviews) => [
          ...currentPreviews,
          ...nextLocalImagePreviews,
        ]);
      }
    } catch {
      setLocalImageUploadFailed(false);
    }
  }, [editable, onSelectImageFiles]);

  const handleFileInputChange = useCallback(async (event) => {
    await uploadFilesWithLocalPreviews(event.target.files);
    event.target.value = "";
  }, [uploadFilesWithLocalPreviews]);

  const handleUploadDragOver = useCallback((event) => {
    if (editable) {
      event.preventDefault();
    }
  }, [editable]);

  const handleUploadDrop = useCallback(async (event) => {
    event.preventDefault();

    if (!busy && editable) {
      await uploadFilesWithLocalPreviews(event.dataTransfer.files);
    }
  }, [busy, editable, uploadFilesWithLocalPreviews]);

  const handleRemoveImage = useCallback((index) => {
    const nextImageUrls = [...imageUrls];

    nextImageUrls.splice(index, 1);
    onImagesChange(nextImageUrls);
  }, [imageUrls, onImagesChange]);

  const handleMoveImage = useCallback((index, offset) => {
    const targetIndex = index + offset;

    if (targetIndex < 0 || targetIndex >= imageUrls.length) {
      return;
    }

    onImagesChange(moveImage(imageUrls, index, targetIndex));
  }, [imageUrls, onImagesChange]);

  const handleSetPrimaryImage = useCallback((index) => {
    if (index === 0) {
      return;
    }

    onImagesChange(moveImage(imageUrls, index, 0));
  }, [imageUrls, onImagesChange]);

  const handleImageDrop = useCallback((event, targetIndex) => {
    event.preventDefault();

    if (!editable || draggedImageIndex === null) {
      return;
    }

    onImagesChange(moveImage(imageUrls, draggedImageIndex, targetIndex));
    setDraggedImageIndex(null);
  }, [draggedImageIndex, editable, imageUrls, onImagesChange]);

  const handleAddAttribute = useCallback(() => {
    if (!editable || busy) {
      return;
    }

    onAttributesChange([
      ...attributeRows,
      {
        name: "",
        value: "",
      },
    ]);
  }, [attributeRows, busy, editable, onAttributesChange]);

  const handleAttributeChange = useCallback((index, field, value) => {
    const nextAttributes = attributeRows.map((attribute, attributeIndex) => (
      attributeIndex === index
        ? {
          ...attribute,
          [field]: value,
        }
        : attribute
    ));

    onAttributesChange(nextAttributes);
  }, [attributeRows, onAttributesChange]);

  const handleRemoveAttribute = useCallback((index) => {
    onAttributesChange(attributeRows.filter((_, attributeIndex) => attributeIndex !== index));
  }, [attributeRows, onAttributesChange]);

  const handleClearClick = useCallback(() => {
    setLocalImageUploadFailed(false);
    setLocalImagePreviews((currentPreviews) => {
      revokeLocalImagePreviews(currentPreviews);
      return [];
    });
    onClear();
  }, [onClear]);

  return (
    <Box ref={formRootRef} sx={{ pb: showActionBar ? 8 : 0 }}>
      <Stack spacing={2.5}>
        <Stack spacing={2}>
          <ProductDetailsPanel
            action={detailsSaveAction}
            discountPercent={discountPercent}
            editable={editable}
            formData={detailsFormData}
            onChange={onChange}
          />

          <ProductSettingsPanel
            action={settingsSaveAction}
            displayStatus={displayStatus}
            editable={editable}
            formData={settingsFormData}
            onChange={onChange}
            onHasVariantsChange={onHasVariantsChange}
            productStatuses={productStatuses}
          />

          <ProductOrganizationPanel
            action={organizationSaveAction}
            categoryRows={categoryRows}
            displayCategory={displayCategory}
            editable={editable}
            formData={organizationFormData}
            getHierarchyColor={getHierarchyColor}
            onChange={onChange}
            tagValues={tagValues}
          />

          <ProductImageSection
            busy={busy}
            draggedImageIndex={draggedImageIndex}
            editable={editable}
            imageUrls={imageUrls}
            localImagePreviews={localImagePreviews}
            localImageUploadFailed={localImageUploadFailed}
            saveAction={mediaSaveAction}
            uploadingImages={uploadingImages}
            onFileInputChange={handleFileInputChange}
            onImageDrop={handleImageDrop}
            onMoveImage={handleMoveImage}
            onRemoveImage={handleRemoveImage}
            onSetDraggedImageIndex={setDraggedImageIndex}
            onSetPrimaryImage={handleSetPrimaryImage}
            onUploadDragOver={handleUploadDragOver}
            onUploadDrop={handleUploadDrop}
          />

          <ProductShippingPanel
            busy={busy}
            editable={editable}
            formData={shippingFormData}
            saveAction={shippingSaveAction}
            onChange={onChange}
          />

          <ProductAttributesPanel
            attributeRows={attributeRows}
            busy={busy}
            editable={editable}
            saveAction={attributesSaveAction}
            visibleAttributeRows={visibleAttributeRows}
            onAddAttribute={handleAddAttribute}
            onAttributeChange={handleAttributeChange}
            onRemoveAttribute={handleRemoveAttribute}
          />

          <ProductSeoPanel
            busy={busy}
            editable={editable}
            formData={seoFormData}
            saveAction={seoSaveAction}
            onChange={onChange}
          />

          {settingsFormData.hasVariants || variantsOpen ? (
            isEditingProduct ? (
              <ProductVariantsPanel
                productId={editingProduct.id}
                editable={editable}
                disabled={busy}
                onVariantsChanged={onVariantsChanged}
              />
            ) : (
              <DetailPanel title="Variants" accentColor="secondary">
                <Alert severity="info">
                  Save the product first, then add variant options and combinations.
                </Alert>
              </DetailPanel>
            )
          ) : null}
        </Stack>
      </Stack>

      {showActionBar ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, md: 4 },
            py: 1,
            bgcolor: "background.paper",
            border: "1px solid",
            borderLeft: 0,
            borderRight: 0,
            borderBottom: 0,
            borderColor: "divider",
            borderRadius: 2,
            position: "fixed",
            left: actionBarBounds ? `${actionBarBounds.left}px` : 0,
            bottom: 30,
            width: actionBarBounds ? `${actionBarBounds.width}px` : "100%",
            boxSizing: "border-box",
            zIndex: 10,
            boxShadow: 10,
            gap: 1,
            visibility: actionBarBounds ? "visible" : "hidden",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            {!isEditingProduct ? (
              <Button onClick={handleClearClick} size="small" disabled={busy}>
                Clear
              </Button>
            ) : null}
            {hasFooterWarning ? (
              <Chip label={footerWarningLabel} color="warning" variant="outlined" size="small" />
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <Button onClick={onClose} size="small" disabled={busy}>
              Cancel
            </Button>
            {!isEditingProduct ? (
              <Button
                variant="contained"
                onClick={() => onSubmit(formDataRef.current)}
                size="small"
                disabled={busy}
                startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
                sx={{ minWidth: 128, whiteSpace: "nowrap" }}
              >
                Create Product
              </Button>
            ) : null}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default ProductDetailsForm;
