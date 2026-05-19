import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  initialEditable,
  formData,
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
  const [actionBarBounds, setActionBarBounds] = useState(null);
  const formRootRef = useRef(null);
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
  const hasUnsavedChanges = initialFormSignature !== "" && currentFormSignature !== initialFormSignature;
  const hasQueuedImages = localImagePreviews.length > 0;
  const hasChangesToSave = hasUnsavedChanges || hasQueuedImages;
  const hasFooterWarning = hasChangesToSave;
  const showActionBar = !hideSubmitWhenReadOnly || editable || !isEditingProduct;
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

  return (
    <Box ref={formRootRef} sx={{ pb: showActionBar ? 8 : 0 }}>
      <Stack spacing={2.5}>
        <Stack spacing={2}>
          <DetailPanel
            title={editable ? "Product details" : displayName}
            action={renderEditModeToggle()}
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

          <DetailPanel title="Product settings" accentColor="success">
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

          <DetailPanel title="Product organization" accentColor="info">
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

          <ProductShippingPanel
            busy={busy}
            editable={editable}
            formData={formData}
            onChange={onChange}
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

          <ProductSeoPanel
            busy={busy}
            editable={editable}
            formData={formData}
            onChange={onChange}
          />

          {formData.hasVariants || variantsOpen ? (
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

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button onClick={onClose} size="small" disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={onSubmit}
              size="small"
              disabled={busy || (isEditingProduct && !hasChangesToSave)}
              startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
              sx={{ minWidth: 128, whiteSpace: "nowrap" }}
            >
              {isEditingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default ProductDetailsForm;
