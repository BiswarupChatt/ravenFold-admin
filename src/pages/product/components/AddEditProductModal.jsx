import { useEffect, useMemo, useState } from "react";
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
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

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

const AddEditProductModal = ({
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
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [localImagePreviews, setLocalImagePreviews] = useState([]);
  const [localImageUploadFailed, setLocalImageUploadFailed] = useState(false);
  const imageUrls = useMemo(() => splitImageUrls(formData.imageUrls), [formData.imageUrls]);
  const busy = saving || uploadingImages;

  useEffect(() => {
    return () => revokeLocalImagePreviews(localImagePreviews);
  }, [localImagePreviews]);

  const uploadFilesWithLocalPreviews = async (files) => {
    const fileList = Array.from(files || []);

    if (fileList.length === 0) {
      return;
    }

    const nextLocalImagePreviews = createLocalImagePreviews(fileList);

    setLocalImageUploadFailed(false);
    setLocalImagePreviews(nextLocalImagePreviews);

    try {
      await onUploadImages(fileList);
      setLocalImagePreviews([]);
    } catch (error) {
      setLocalImageUploadFailed(nextLocalImagePreviews.length > 0);
    }
  };

  const handleFileInputChange = async (event) => {
    await uploadFilesWithLocalPreviews(event.target.files);
    event.target.value = "";
  };

  const handleUploadDragOver = (event) => {
    event.preventDefault();
  };

  const handleUploadDrop = async (event) => {
    event.preventDefault();

    if (!busy) {
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

    if (draggedImageIndex === null) {
      return;
    }

    onImagesChange(moveImage(imageUrls, draggedImageIndex, targetIndex));
    setDraggedImageIndex(null);
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {editingProduct ? "Edit Product" : "Add Product"}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

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

          <TextField
            label="Slug"
            name="slug"
            value={formData.slug}
            onChange={onChange}
            fullWidth
            helperText="Leave blank to generate it from the name."
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

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={onChange}
            fullWidth
            multiline
            minRows={3}
          />

          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="subtitle2">Product Images</Typography>
                <Typography variant="caption" color="text.secondary">
                  {imageUrls.length
                    ? `${imageUrls.length} images uploaded`
                    : localImagePreviews.length
                      ? `${localImagePreviews.length} images selected`
                      : "No images selected"}
                </Typography>
              </Box>

              <Button
                component="label"
                variant="outlined"
                startIcon={uploadingImages ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                disabled={busy}
              >
                {uploadingImages ? "Uploading" : "Upload Images"}
                <Box
                  component="input"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleFileInputChange}
                />
              </Button>
            </Stack>

            <Box
              onDragOver={handleUploadDragOver}
              onDrop={handleUploadDrop}
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "action.hover",
                px: 2,
                py: 2.5,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
                color="text.secondary"
              >
                {uploadingImages ? (
                  <CircularProgress size={20} />
                ) : (
                  <CloudUploadIcon fontSize="small" />
                )}
                <Typography variant="body2">
                  {uploadingImages ? "Uploading images" : "Drop images here"}
                </Typography>
              </Stack>
              {uploadingImages ? <LinearProgress sx={{ mt: 2 }} /> : null}
            </Box>

            {imageUrls.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
                  gap: 1.5,
                }}
              >
                {imageUrls.map((imageUrl, index) => {
                  const isPrimary = index === 0;

                  return (
                    <Box
                      key={`${imageUrl}-${index}`}
                      draggable={!busy}
                      onDragStart={() => setDraggedImageIndex(index)}
                      onDragEnd={() => setDraggedImageIndex(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleImageDrop(event, index)}
                      sx={{
                        border: "1px solid",
                        borderColor: draggedImageIndex === index || isPrimary ? "primary.main" : "divider",
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        cursor: busy ? "default" : "grab",
                        minWidth: 0,
                        overflow: "hidden",
                        transition: "border-color 120ms ease, box-shadow 120ms ease",
                        boxShadow: draggedImageIndex === index ? 2 : 0,
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          aspectRatio: "1 / 1",
                          bgcolor: "action.hover",
                        }}
                      >
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
                        {isPrimary ? (
                          <Chip
                            label="Primary"
                            color="primary"
                            size="small"
                            sx={{ position: "absolute", top: 8, left: 8 }}
                          />
                        ) : null}
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
                                "&:hover": {
                                  bgcolor: "background.paper",
                                },
                              }}
                            >
                              {isPrimary ? (
                                <StarIcon fontSize="small" />
                              ) : (
                                <StarBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ px: 1, py: 0.75, minWidth: 0 }}
                      >
                        <DragIndicatorIcon fontSize="small" color={busy ? "disabled" : "action"} />
                        <Typography variant="caption" noWrap sx={{ flex: 1, minWidth: 0 }}>
                          {`Image ${index + 1}`}
                        </Typography>
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
                        <Tooltip title="Remove image">
                          <span>
                            <IconButton
                              size="small"
                              disabled={busy}
                              onClick={() => handleRemoveImage(index)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            ) : null}

            {localImagePreviews.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
                  gap: 1.5,
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
                    <Box
                      sx={{
                        position: "relative",
                        aspectRatio: "1 / 1",
                        bgcolor: "action.hover",
                      }}
                    >
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
                        sx={{ position: "absolute", top: 8, left: 8 }}
                      />
                    </Box>
                    <Typography variant="caption" noWrap sx={{ display: "block", px: 1, py: 0.75 }}>
                      {preview.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Stack>

          <TextField
            label="Image URLs"
            name="imageUrls"
            value={formData.imageUrls}
            onChange={onChange}
            fullWidth
            multiline
            minRows={2}
            helperText={imageUrls.length ? "First URL is used as the primary image." : "Enter one image URL per line."}
          />

          <TextField
            label="Tags"
            name="tags"
            value={formData.tags}
            onChange={onChange}
            fullWidth
            helperText="Separate tags with commas."
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.hasVariants}
                  onChange={onChange}
                  name="hasVariants"
                />
              }
              label="Has variants"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFeatured}
                  onChange={onChange}
                  name="isFeatured"
                />
              }
              label="Featured"
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Box>
          {!editingProduct ? (
            <Button onClick={onClear} disabled={busy}>
              Clear
            </Button>
          ) : null}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={busy}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {editingProduct ? "Save Changes" : "Create Product"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditProductModal;
