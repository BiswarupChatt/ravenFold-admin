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
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

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

const splitTags = (value = "") => {
  return value
    .split(",")
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

const DetailPanel = ({ title, action, children }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      bgcolor: "background.paper",
      overflow: "hidden",
    }}
  >
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Typography variant="subtitle2" fontWeight={700}>
        {title}
      </Typography>
      {action}
    </Stack>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

const ReadOnlyField = ({ label, value, multiline = false }) => (
  <Box
    sx={{
      borderBottom: "1px solid",
      borderColor: "divider",
      py: 1.25,
      "&:last-of-type": {
        borderBottom: 0,
      },
    }}
  >
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 0.25,
            whiteSpace: multiline ? "pre-wrap" : "nowrap",
            overflow: multiline ? "visible" : "hidden",
            textOverflow: multiline ? "clip" : "ellipsis",
          }}
        >
          {value || "-"}
        </Typography>
      </Box>
    </Stack>
  </Box>
);

const AddEditViewProductModal = ({
  open,
  formData,
  formError,
  saving,
  uploadingImages,
  editingProduct,
  categoryRows,
  productStatuses,
  getHierarchyColor,
  onClose,
  onClear,
  onChange,
  onImagesChange,
  onUploadImages,
  onSubmit,
}) => {
  const [detailsEditable, setDetailsEditable] = useState(true);
  const [initialFormSignature, setInitialFormSignature] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [localImagePreviews, setLocalImagePreviews] = useState([]);
  const [localImageUploadFailed, setLocalImageUploadFailed] = useState(false);
  const wasOpenRef = useRef(false);
  const imageUrls = useMemo(() => splitImageUrls(formData.imageUrls), [formData.imageUrls]);
  const tagValues = useMemo(() => splitTags(formData.tags), [formData.tags]);
  const currentFormSignature = useMemo(() => JSON.stringify(formData), [formData]);
  const isEditingProduct = Boolean(editingProduct);
  const editable = !isEditingProduct || detailsEditable;
  const busy = saving || uploadingImages;
  const hasUnsavedChanges = open && initialFormSignature !== "" && currentFormSignature !== initialFormSignature;
  const hasFooterWarning = hasUnsavedChanges || localImagePreviews.length > 0;
  const footerWarningLabel = localImagePreviews.length > 0 && localImageUploadFailed
    ? "Images not uploaded"
    : "Unsaved changes";
  const primaryImage = imageUrls[0] || localImagePreviews[0]?.url || "";
  const displayName = formData.name || "Untitled product";
  const displayStatus = formData.status || "draft";
  const displayCategory = getCategoryLabel(categoryRows, formData.categoryId);
  const discountPercent = getDiscountPercent(formData.basePrice, formData.salePrice);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDetailsEditable(!editingProduct);
      setInitialFormSignature(currentFormSignature);
      setDraggedImageIndex(null);
      setLocalImageUploadFailed(false);
      setLocalImagePreviews([]);
    }

    wasOpenRef.current = open;

    if (!open) {
      setInitialFormSignature("");
    }
  }, [open, editingProduct, currentFormSignature]);

  useEffect(() => {
    return () => revokeLocalImagePreviews(localImagePreviews);
  }, [localImagePreviews]);

  const toggleEditing = () => {
    if (!busy && isEditingProduct) {
      setDetailsEditable((currentValue) => !currentValue);
    }
  };

  const uploadFilesWithLocalPreviews = async (files) => {
    const fileList = Array.from(files || []);

    if (fileList.length === 0 || !editable) {
      return;
    }

    const nextLocalImagePreviews = createLocalImagePreviews(fileList);

    setLocalImageUploadFailed(false);
    setLocalImagePreviews(nextLocalImagePreviews);

    try {
      await onUploadImages(fileList);
      setLocalImagePreviews([]);
    } catch {
      setLocalImageUploadFailed(nextLocalImagePreviews.length > 0);
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

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="span" fontWeight={700}>
              {isEditingProduct ? "Product Details" : "Add Product"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {isEditingProduct ? displayName : "Create a catalog product with images, pricing, and metadata."}
            </Typography>
          </Box>

          {isEditingProduct ? (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={editable ? <VisibilityIcon/> : <EditIcon />}
                onClick={toggleEditing}
                disabled={busy}
              >
                {editable ? "View" : "Edit"}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "background.default" }}>
        <Stack spacing={2.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 0.85fr) minmax(0, 1.15fr)" },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            <Stack spacing={1.5}>
              <Box
                onDragOver={handleUploadDragOver}
                onDrop={handleUploadDrop}
                sx={{
                  border: "1px solid",
                  borderColor: primaryImage ? "divider" : "primary.light",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    aspectRatio: "4 / 5",
                    bgcolor: "action.hover",
                  }}
                >
                  {primaryImage ? (
                    <Box
                      component="img"
                      src={primaryImage}
                      alt=""
                      sx={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Stack
                      spacing={1}
                      alignItems="center"
                      justifyContent="center"
                      sx={{ height: "100%", color: "text.secondary", px: 2, textAlign: "center" }}
                    >
                      <CloudUploadIcon />
                      <Typography variant="body2">
                        {editable ? "Drop product images here" : "No product image"}
                      </Typography>
                    </Stack>
                  )}

                  {imageUrls.length > 0 ? (
                    <Chip
                      label="Primary display image"
                      color="primary"
                      size="small"
                      sx={{ position: "absolute", left: 12, top: 12 }}
                    />
                  ) : null}

                </Box>
                {uploadingImages ? <LinearProgress /> : null}
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Image Gallery
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {imageUrls.length
                      ? `${imageUrls.length} uploaded`
                      : localImagePreviews.length
                        ? `${localImagePreviews.length} selected`
                        : "No images selected"}
                  </Typography>
                </Box>

                {editable ? (
                  <Button component="label" variant="outlined" size="small" disabled={busy}>
                    Add Images
                    <Box
                      component="input"
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleFileInputChange}
                    />
                  </Button>
                ) : null}
              </Stack>

              {imageUrls.length > 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
                    gap: 1,
                  }}
                >
                  {imageUrls.map((imageUrl, index) => {
                    const isPrimary = index === 0;

                    return (
                      <Box
                        key={`${imageUrl}-${index}`}
                        draggable={editable && !busy}
                        onDragStart={() => setDraggedImageIndex(index)}
                        onDragEnd={() => setDraggedImageIndex(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleImageDrop(event, index)}
                        sx={{
                          border: "1px solid",
                          borderColor: draggedImageIndex === index || isPrimary ? "primary.main" : "divider",
                          borderRadius: 1,
                          bgcolor: "background.paper",
                          cursor: editable && !busy ? "grab" : "default",
                          minWidth: 0,
                          overflow: "hidden",
                          boxShadow: draggedImageIndex === index ? 2 : 0,
                        }}
                      >
                        <Box sx={{ position: "relative", aspectRatio: "1 / 1", bgcolor: "action.hover" }}>
                          <Box
                            component="img"
                            src={imageUrl}
                            alt=""
                            loading="lazy"
                            sx={{
                              display: "block",
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {editable ? (
                            <Tooltip title={isPrimary ? "Primary image" : "Set as primary image"}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={busy}
                                  onClick={() => handleSetPrimaryImage(index)}
                                  sx={{
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                    bgcolor: "background.paper",
                                    color: isPrimary ? "warning.main" : "text.secondary",
                                    boxShadow: 1,
                                    "&:hover": { bgcolor: "background.paper" },
                                  }}
                                >
                                  {isPrimary ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : isPrimary ? (
                            <Chip label="Primary" color="primary" size="small" sx={{ position: "absolute", top: 6, left: 6 }} />
                          ) : null}
                        </Box>

                        {editable ? (
                          <Stack direction="row" alignItems="center">
                            <DragIndicatorIcon fontSize="small" color={busy ? "disabled" : "action"} />
                            <Tooltip title="Move left">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={busy || index === 0}
                                  onClick={() => handleMoveImage(index, -1)}
                                >
                                  <KeyboardArrowLeftIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Move right">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={busy || index === imageUrls.length - 1}
                                  onClick={() => handleMoveImage(index, 1)}
                                >
                                  <KeyboardArrowRightIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Box sx={{ flex: 1 }} />
                            <Tooltip title="Remove image">
                              <span>
                                <IconButton size="small" disabled={busy} onClick={() => handleRemoveImage(index)}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              ) : null}

              {localImagePreviews.length > 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
                    gap: 1,
                  }}
                >
                  {localImagePreviews.map((preview) => (
                    <Box
                      key={preview.id}
                      sx={{
                        border: "1px solid",
                        borderColor: localImageUploadFailed ? "error.main" : "divider",
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        minWidth: 0,
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ position: "relative", aspectRatio: "1 / 1", bgcolor: "action.hover" }}>
                        <Box
                          component="img"
                          src={preview.url}
                          alt=""
                          sx={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <Chip
                          label={localImageUploadFailed ? "Not uploaded" : "Uploading"}
                          color={localImageUploadFailed ? "error" : "default"}
                          size="small"
                          sx={{ position: "absolute", top: 6, left: 6 }}
                        />
                      </Box>
                      <Typography variant="caption" noWrap sx={{ display: "block", px: 1, py: 0.75 }}>
                        {preview.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {editable ? (
                <DetailPanel title="Image URLs">
                  <Stack spacing={1.25}>
                    {imageUrls.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {imageUrls.map((imageUrl, index) => (
                          <Tooltip title={imageUrl} key={`${imageUrl}-${index}`}>
                            <Chip
                              label={`${index === 0 ? "Primary: " : ""}${imageUrl}`}
                              color={index === 0 ? "primary" : "default"}
                              variant={index === 0 ? "filled" : "outlined"}
                              onDelete={() => handleRemoveImage(index)}
                              disabled={busy}
                              sx={{
                                maxWidth: "100%",
                                "& .MuiChip-label": {
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No image URLs added yet.
                      </Typography>
                    )}
                  </Stack>
                </DetailPanel>
              ) : null}
            </Stack>

            <Stack spacing={2}>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  p: 2,
                }}
              >
                {editable ? (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={onChange}
                        required
                        fullWidth
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
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h5" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                        {displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        SKU {formData.sku || "-"}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        label={displayStatus}
                        color={statusColors[displayStatus] || "default"}
                        size="small"
                        variant={displayStatus === "draft" ? "outlined" : "filled"}
                      />
                      <Chip
                        label={formData.hasVariants ? "Variants: Yes" : "Variants: No"}
                        color={formData.hasVariants ? "primary" : "default"}
                        size="small"
                        variant={formData.hasVariants ? "filled" : "outlined"}
                      />
                      <Chip
                        label={formData.isFeatured ? "Featured: Yes" : "Featured: No"}
                        color={formData.isFeatured ? "primary" : "default"}
                        size="small"
                        variant={formData.isFeatured ? "filled" : "outlined"}
                      />
                    </Stack>

                    <Divider />

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
                  </Stack>
                )}
              </Box>

              <DetailPanel title="Catalog Details">
                {editable ? (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        select
                        label="Category"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={onChange}
                        required
                        fullWidth
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
                        select
                        label="Status"
                        name="status"
                        value={formData.status}
                        onChange={onChange}
                        fullWidth
                      >
                        {productStatuses.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Stack>

                    <TextField
                      label="Slug"
                      name="slug"
                      value={formData.slug}
                      onChange={onChange}
                      fullWidth
                      helperText="Leave blank to generate it from the name."
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <FormControlLabel
                        control={<Switch checked={formData.hasVariants} onChange={onChange} name="hasVariants" />}
                        label="Has variants"
                      />
                      <FormControlLabel
                        control={<Switch checked={formData.isFeatured} onChange={onChange} name="isFeatured" />}
                        label="Featured"
                      />
                    </Stack>
                  </Stack>
                ) : (
                  <Box>
                    <ReadOnlyField label="Category" value={displayCategory} />
                    <ReadOnlyField label="Status" value={displayStatus} />
                    <ReadOnlyField label="Slug" value={formData.slug} />
                    <ReadOnlyField
                      label="Flags"
                      value={[
                        formData.hasVariants ? "Variants: Yes" : "Variants: No",
                        formData.isFeatured ? "Featured: Yes" : "Featured: No",
                      ].join(", ")}
                    />
                  </Box>
                )}
              </DetailPanel>

              <DetailPanel title="Description">
                {editable ? (
                  <Stack spacing={2}>
                    <TextField
                      label="Short Description"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={onChange}
                      fullWidth
                      multiline
                      minRows={2}
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
                  </Stack>
                ) : (
                  <Box>
                    <ReadOnlyField label="Short Description" value={formData.shortDescription} multiline />
                    <ReadOnlyField label="Description" value={formData.description} multiline />
                  </Box>
                )}
              </DetailPanel>

              <DetailPanel title="Tags">
                {editable ? (
                  <TextField
                    label="Tags"
                    name="tags"
                    value={formData.tags}
                    onChange={onChange}
                    fullWidth
                    helperText="Separate tags with commas."
                  />
                ) : tagValues.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {tagValues.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Stack>
                ) : (
                  <ReadOnlyField label="Tags" value="-" />
                )}
              </DetailPanel>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          {!isEditingProduct ? (
            <Button onClick={onClear} disabled={busy}>
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
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={busy || (isEditingProduct && !hasUnsavedChanges)}
            startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
          >
            {isEditingProduct ? "Save Changes" : "Create Product"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditViewProductModal;
