import { useEffect, useMemo, useRef, useState } from "react";
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
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";

import { splitCommaSeparatedValues } from "@/lib/utils/adminShared";
import ProductAttributesPanel from "./ProductAttributesPanel";
import ProductImageSection from "./ProductImageSection";
import ReadOnlyField from "./ReadOnlyField";
import ProductVariantsPanel from "./ProductVariantsPanel";
import DetailPanel from "./DetailPanel";

const statusColors = {
  active: "success",
  draft: "default",
  inactive: "warning",
};

const splitImageUrls = (value = "") => {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const moveImage = (imageUrls, fromIndex, toIndex) => {
  if (fromIndex === toIndex) {
    return imageUrls;
  }

  const nextImageUrls = [...imageUrls];
  const [movedImage] = nextImageUrls.splice(fromIndex, 1);

  nextImageUrls.splice(toIndex, 0, movedImage);

  return nextImageUrls;
};

const createLocalImagePreviews = (files = []) => {
  return Array.from(files)
    .filter((file) => file.type?.startsWith("image/"))
    .map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${file.size}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
};

const revokeLocalImagePreviews = (previews = []) => {
  previews.forEach((preview) => URL.revokeObjectURL(preview.url));
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getDiscountPercent = (basePrice, salePrice) => {
  const basePriceValue = Number(basePrice);
  const salePriceValue = Number(salePrice);

  if (
    !Number.isFinite(basePriceValue) ||
    !Number.isFinite(salePriceValue) ||
    basePriceValue <= 0 ||
    salePriceValue < 0 ||
    salePriceValue >= basePriceValue
  ) {
    return null;
  }

  return Math.round(((basePriceValue - salePriceValue) / basePriceValue) * 100);
};

const getCategoryLabel = (categoryRows, categoryId) => {
  const category = categoryRows.find((item) => item.id === categoryId);

  return category?.name || "-";
};

const ProductDetailsForm = ({
  open,
  pageMode = false,
  initialEditable,
  formData,
  formError,
  saving,
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
  onEditModeToggle,
  hideSubmitWhenReadOnly = false,
  onSubmit,
}) => {
  const [detailsEditable, setDetailsEditable] = useState(() => initialEditable ?? true);
  const [initialFormSignature, setInitialFormSignature] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [localImagePreviews, setLocalImagePreviews] = useState([]);
  const [localImageUploadFailed, setLocalImageUploadFailed] = useState(false);
  const wasOpenRef = useRef(false);
  const openIdentityRef = useRef("");
  const localImagePreviewsRef = useRef([]);
  const imageUrls = useMemo(() => splitImageUrls(formData.imageUrls), [formData.imageUrls]);
  const tagValues = useMemo(() => splitCommaSeparatedValues(formData.tags), [formData.tags]);
  const attributeRows = useMemo(
    () => (Array.isArray(formData.attributes) ? formData.attributes : []),
    [formData.attributes]
  );
  const visibleAttributeRows = useMemo(() => (
    attributeRows
      .map((attribute) => ({
        name: String(attribute?.name || "").trim(),
        value: String(attribute?.value || "").trim(),
      }))
      .filter((attribute) => attribute.name || attribute.value)
  ), [attributeRows]);
  const currentFormSignature = useMemo(() => JSON.stringify(formData), [formData]);
  const isEditingProduct = Boolean(editingProduct);
  const editable = !isEditingProduct || detailsEditable;
  const busy = saving || uploadingImages;
  const hasUnsavedChanges = open && initialFormSignature !== "" && currentFormSignature !== initialFormSignature;
  const hasQueuedImages = localImagePreviews.length > 0;
  const hasChangesToSave = hasUnsavedChanges || hasQueuedImages;
  const hasFooterWarning = hasChangesToSave;
  const footerWarningLabel = hasQueuedImages
    ? `${localImagePreviews.length} image${localImagePreviews.length === 1 ? "" : "s"} queued for upload`
    : "Unsaved changes";
  const displayName = formData.name || "Untitled product";
  const displayStatus = formData.status || "draft";
  const displayCategory = getCategoryLabel(categoryRows, formData.categoryId);
  const discountPercent = getDiscountPercent(formData.basePrice, formData.salePrice);
  const productIdentity = editingProduct?.id || "new";
  const openIdentity = `${productIdentity}:${initialEditable ?? "auto"}`;

  useEffect(() => {
    if (open && (!wasOpenRef.current || openIdentityRef.current !== openIdentity)) {
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

    if (!open && wasOpenRef.current) {
      setInitialFormSignature("");
      openIdentityRef.current = "";
      setDraggedImageIndex(null);
      setLocalImageUploadFailed(false);
      setLocalImagePreviews((currentPreviews) => {
        revokeLocalImagePreviews(currentPreviews);
        return [];
      });
    }

    wasOpenRef.current = open;
  }, [open, editingProduct, currentFormSignature, initialEditable, openIdentity]);

  useEffect(() => {
    localImagePreviewsRef.current = localImagePreviews;
  }, [localImagePreviews]);

  useEffect(() => {
    return () => revokeLocalImagePreviews(localImagePreviewsRef.current);
  }, []);

  const toggleEditing = () => {
    if (!busy && isEditingProduct) {
      if (onEditModeToggle) {
        onEditModeToggle();
        return;
      }

      setDetailsEditable((currentValue) => !currentValue);
    }
  };

  const renderEditModeToggle = () => {
    if (!isEditingProduct) {
      return null;
    }

    return (
      <Tooltip title={editable ? "View product" : "Edit product"}>
        <span>
          <IconButton
            size="small"
            onClick={toggleEditing}
            disabled={busy}
            aria-label={editable ? "View product" : "Edit product"}
            sx={{ flexShrink: 0 }}
          >
            {editable ? <VisibilityIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  const uploadFilesWithLocalPreviews = async (files) => {
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
  };

  const handleFileInputChange = async (event) => {
    await uploadFilesWithLocalPreviews(event.target.files);
    event.target.value = "";
  };

  const handleUploadDragOver = (event) => {
    if (editable) {
      event.preventDefault();
    }
  };

  const handleUploadDrop = async (event) => {
    event.preventDefault();

    if (!busy && editable) {
      await uploadFilesWithLocalPreviews(event.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index) => {
    const nextImageUrls = [...imageUrls];

    nextImageUrls.splice(index, 1);
    onImagesChange(nextImageUrls);
  };

  const handleMoveImage = (index, offset) => {
    const targetIndex = index + offset;

    if (targetIndex < 0 || targetIndex >= imageUrls.length) {
      return;
    }

    onImagesChange(moveImage(imageUrls, index, targetIndex));
  };

  const handleSetPrimaryImage = (index) => {
    if (index === 0) {
      return;
    }

    onImagesChange(moveImage(imageUrls, index, 0));
  };

  const handleImageDrop = (event, targetIndex) => {
    event.preventDefault();

    if (!editable || draggedImageIndex === null) {
      return;
    }

    onImagesChange(moveImage(imageUrls, draggedImageIndex, targetIndex));
    setDraggedImageIndex(null);
  };

  const handleAddAttribute = () => {
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
  };

  const handleAttributeChange = (index, field, value) => {
    const nextAttributes = attributeRows.map((attribute, attributeIndex) => (
      attributeIndex === index
        ? {
            ...attribute,
            [field]: value,
          }
        : attribute
    ));

    onAttributesChange(nextAttributes);
  };

  const handleRemoveAttribute = (index) => {
    onAttributesChange(attributeRows.filter((_, attributeIndex) => attributeIndex !== index));
  };

  const handleClearClick = () => {
    setLocalImageUploadFailed(false);
    setLocalImagePreviews((currentPreviews) => {
      revokeLocalImagePreviews(currentPreviews);
      return [];
    });
    onClear();
  };

  const productBody = (
    <>
      {!pageMode ? (
        <DialogTitle sx={{ pb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" component="span" fontWeight={700}>
                {isEditingProduct ? "Product Details" : "Add Product"}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
      ) : null}

      <DialogContent
        dividers={!pageMode}
        sx={{
          bgcolor: pageMode ? "transparent" : "background.default",
          p: pageMode ? 0 : undefined,
        }}
      >
        <Stack spacing={2.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Stack spacing={2}>
              <DetailPanel
                title={editable ? "Product details" : displayName}
                action={renderEditModeToggle()}
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
                      minRows={7}
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

              <ProductImageSection
                busy={busy}
                draggedImageIndex={draggedImageIndex}
                editable={editable}
                imageUrls={imageUrls}
                localImagePreviews={localImagePreviews}
                localImageUploadFailed={localImageUploadFailed}
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

              <ProductAttributesPanel
                attributeRows={attributeRows}
                busy={busy}
                editable={editable}
                visibleAttributeRows={visibleAttributeRows}
                onAddAttribute={handleAddAttribute}
                onAttributeChange={handleAttributeChange}
                onRemoveAttribute={handleRemoveAttribute}
              />

              {formData.hasVariants || variantsOpen ? (
                isEditingProduct ? (
                  <ProductVariantsPanel
                    open={open && (formData.hasVariants || variantsOpen)}
                    productId={editingProduct.id}
                    editable={editable}
                    disabled={busy}
                    onVariantsChanged={onVariantsChanged}
                  />
                ) : (
                  <DetailPanel title="Variants">
                    <Alert severity="info">
                      Save the product first, then add variant options and combinations.
                    </Alert>
                  </DetailPanel>
                )
              ) : null}
            </Stack>

            <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
              <DetailPanel title="Status">
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
              </DetailPanel>

              <DetailPanel title="Publishing">
                <Stack spacing={1.25}>
                  {editable ? (
                    <>
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
                    </>
                  ) : (
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label="Online Store" size="small" />
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
                </Stack>
              </DetailPanel>

              <DetailPanel title="Sales">
                <Typography variant="body2" color="text.secondary">
                  No recent sales of this product
                </Typography>
              </DetailPanel>

              <DetailPanel title="Product organization">
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
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: pageMode ? 2 : 3,
          py: 2,
          mt: pageMode ? 2 : 0,
          justifyContent: "space-between",
          bgcolor: "background.paper",
          border: pageMode ? "1px solid" : 0,
          borderColor: "divider",
          borderRadius: pageMode ? 1 : 0,
          position: pageMode ? "sticky" : "static",
          bottom: pageMode ? 16 : "auto",
          zIndex: pageMode ? 2 : "auto",
          boxShadow: pageMode ? 1 : 0,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          {!isEditingProduct ? (
            <Button onClick={handleClearClick} disabled={busy}>
              Clear
            </Button>
          ) : null}
          {hasFooterWarning ? (
            <Chip label={footerWarningLabel} color="warning" variant="outlined" size="small" />
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={busy}>
            {isEditingProduct && !editable ? "Close" : "Cancel"}
          </Button>
          {!hideSubmitWhenReadOnly || editable || !isEditingProduct ? (
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={busy || (isEditingProduct && !hasChangesToSave)}
              startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
            >
              {isEditingProduct ? "Save Changes" : "Create Product"}
            </Button>
          ) : null}
        </Stack>
      </DialogActions>
    </>
  );

  if (pageMode) {
    return (
      <Box>
        {productBody}
      </Box>
    );
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="lg">
      {productBody}
    </Dialog>
  );
};

export default ProductDetailsForm;
