import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import SearchIcon from "@mui/icons-material/Search";

import {
  createProductOption,
  createProductOptionValue,
  createProductVariant,
  deleteProductOption,
  deleteProductOptionValue,
  deleteProductVariant,
  fetchAdminProductVariants,
  fetchProductOptions,
  updateProductOption,
  updateProductOptionValue,
  updateProductVariant,
  uploadProductImages,
} from "@/lib/api/productApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { useToast } from "@/hooks/ToastContext";
import { joinLines, splitCommaSeparatedValues, splitLines } from "@/lib/utils/adminShared";
import ProductOptionsPanel, { EMPTY_OPTION_FORM, EMPTY_VALUE_EDIT } from "./ProductOptionsPanel";
import VariantMediaField from "./VariantMediaField";

const EMPTY_VARIANT_FORM = {
  id: "",
  sku: "",
  optionValues: {},
  price: "",
  salePrice: "",
  images: "",
  isActive: true,
};

const cardSx = {
  border: "1px solid",
  borderColor: "divider",
  borderTop: "3px solid",
  borderTopColor: "secondary.main",
  borderRadius: 1,
  bgcolor: "background.paper",
  overflow: "hidden",
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "-";
  }

  return numberValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

const getVariantLabel = (variant = {}) => {
  const optionLabel = (variant.optionValues || [])
    .map((optionValue) => optionValue.value)
    .filter(Boolean)
    .join(" / ");

  return optionLabel || variant.sku || "Variant";
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
      id: `${file.name}-${file.lastModified}-${file.size}-${index}-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
};

const revokeLocalImagePreviews = (previews = []) => {
  previews.forEach((preview) => URL.revokeObjectURL(preview.url));
};

const getVariantFromResponse = (response) => response?.data || null;

const getVariantId = (variant) => variant?.id || variant?._id || "";

const buildVariantFormFromVariant = (variant = {}) => {
  const optionValues = {};

  (variant.optionValues || []).forEach((optionValue) => {
    optionValues[optionValue.optionName] = optionValue.value;
  });

  return {
    ...EMPTY_VARIANT_FORM,
    id: variant.id || "",
    sku: variant.sku || "",
    optionValues,
    price: variant.price === null || variant.price === undefined ? "" : String(variant.price),
    salePrice: variant.salePrice === null || variant.salePrice === undefined ? "" : String(variant.salePrice),
    images: Array.isArray(variant.images) ? joinLines(variant.images) : "",
    isActive: variant.isActive !== false,
  };
};

const buildVariantPayloadFromVariant = (variant = {}, changes = {}) => ({
  sku: variant.sku || "",
  optionValues: Array.isArray(variant.optionValues) ? variant.optionValues : [],
  price: variant.price,
  salePrice: variant.salePrice === undefined ? null : variant.salePrice,
  images: Array.isArray(variant.images) ? variant.images : [],
  isActive: variant.isActive !== false,
  ...changes,
});

const ProductVariantsPanel = ({
  disabled = false,
  editable = false,
  onVariantsChanged,
  productId,
}) => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const showError = useCallback((message) => {
    toast.error(message);
  }, [toast]);
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);
  const [optionForm, setOptionForm] = useState(EMPTY_OPTION_FORM);
  const [valueDrafts, setValueDrafts] = useState({});
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM);
  const [optionFormOpen, setOptionFormOpen] = useState(false);
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");
  const [editingOptionId, setEditingOptionId] = useState("");
  const [editingOptionName, setEditingOptionName] = useState("");
  const [editingValue, setEditingValue] = useState(EMPTY_VALUE_EDIT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variantImageFiles, setVariantImageFiles] = useState([]);
  const [variantImagePreviews, setVariantImagePreviews] = useState([]);
  const [variantUploadingImages, setVariantUploadingImages] = useState(false);
  const [draggedVariantImageIndex, setDraggedVariantImageIndex] = useState(null);
  const variantImagePreviewsRef = useRef([]);
  const busy = disabled || saving || variantUploadingImages;
  const isEditingVariant = Boolean(variantForm.id);
  const variantImageUrls = useMemo(() => splitLines(variantForm.images), [variantForm.images]);

  const valueCount = useMemo(() => {
    return options.reduce((count, option) => count + (option.values?.length || 0), 0);
  }, [options]);

  const everyOptionHasValue = useMemo(() => {
    return options.length > 0 && options.every((option) => (option.values || []).length > 0);
  }, [options]);

  const canCreateVariant = options.length > 0 && everyOptionHasValue;

  const filteredVariants = useMemo(() => {
    const search = variantSearch.trim().toLowerCase();

    if (!search) {
      return variants;
    }

    return variants.filter((variant) => {
      const optionText = (variant.optionValues || [])
        .map((optionValue) => `${optionValue.optionName} ${optionValue.value}`)
        .join(" ")
        .toLowerCase();

      return (variant.sku || "").toLowerCase().includes(search) || optionText.includes(search);
    });
  }, [variantSearch, variants]);

  const loadVariantData = useCallback(async () => {
    if (!productId) {
      return;
    }

    setLoading(true);

    try {
      const [nextOptions, variantList] = await Promise.all([
        fetchProductOptions(authToken, productId),
        fetchAdminProductVariants(authToken, productId, { limit: 100 }),
      ]);

      setOptions(nextOptions);
      setVariants(variantList.items);
    } catch (err) {
      showError(err.message || "Failed to load variants.");
      setOptions([]);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, productId, showError]);

  const clearVariantImageQueue = useCallback(() => {
    setVariantImageFiles([]);
    setDraggedVariantImageIndex(null);
    setVariantImagePreviews((currentPreviews) => {
      revokeLocalImagePreviews(currentPreviews);
      return [];
    });
  }, []);

  useEffect(() => {
    variantImagePreviewsRef.current = variantImagePreviews;
  }, [variantImagePreviews]);

  useEffect(() => {
    return () => revokeLocalImagePreviews(variantImagePreviewsRef.current);
  }, []);

  useEffect(() => {
    loadVariantData();
  }, [loadVariantData]);

  useEffect(() => {
    setOptionForm(EMPTY_OPTION_FORM);
    setValueDrafts({});
    setVariantForm(EMPTY_VARIANT_FORM);
    setOptionFormOpen(false);
    setVariantFormOpen(false);
    setVariantSearch("");
    setEditingOptionId("");
    setEditingOptionName("");
    setEditingValue(EMPTY_VALUE_EDIT);
    clearVariantImageQueue();
  }, [clearVariantImageQueue, productId]);

  const handleOptionFormChange = (field, value) => {
    setOptionForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const openOptionForm = (optionName = "") => {
    setOptionForm({
      name: optionName,
      values: "",
    });
    setOptionFormOpen(true);
  };

  const handleCreateOption = async () => {
    const name = optionForm.name.trim();

    if (!name) {
      showError("Option name is required.");
      return;
    }

    setSaving(true);

    try {
      await createProductOption(authToken, productId, {
        name,
        values: splitCommaSeparatedValues(optionForm.values),
      });
      setOptionForm(EMPTY_OPTION_FORM);
      setOptionFormOpen(false);
      toast.success("Product option created.");
      await loadVariantData();
    } catch (err) {
      showError(err.message || "Failed to create product option.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditOption = (option) => {
    setEditingOptionId(option.id);
    setEditingOptionName(option.name);
    setEditingValue(EMPTY_VALUE_EDIT);
  };

  const handleUpdateOption = async () => {
    const name = editingOptionName.trim();

    if (!name) {
      showError("Option name is required.");
      return;
    }

    setSaving(true);

    try {
      await updateProductOption(authToken, productId, editingOptionId, { name });
      setEditingOptionId("");
      setEditingOptionName("");
      toast.success("Product option updated.");
      await loadVariantData();
    } catch (err) {
      showError(err.message || "Failed to update product option.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (optionId) => {
    setSaving(true);

    try {
      await deleteProductOption(authToken, productId, optionId);
      if (editingOptionId === optionId) {
        setEditingOptionId("");
        setEditingOptionName("");
      }
      toast.success("Product option deleted.");
      await loadVariantData();
    } catch (err) {
      showError(err.message || "Failed to delete product option.");
    } finally {
      setSaving(false);
    }
  };

  const handleValueDraftChange = (optionId, value) => {
    setValueDrafts((currentDrafts) => ({
      ...currentDrafts,
      [optionId]: value,
    }));
  };

  const handleAddOptionValue = async (optionId) => {
    const value = (valueDrafts[optionId] || "").trim();

    if (!value) {
      showError("Option value is required.");
      return;
    }

    setSaving(true);

    try {
      await createProductOptionValue(authToken, productId, optionId, { value });
      setValueDrafts((currentDrafts) => ({
        ...currentDrafts,
        [optionId]: "",
      }));
      toast.success("Option value added.");
      await loadVariantData();
    } catch (err) {
      showError(err.message || "Failed to add option value.");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditValue = (optionId, optionValue) => {
    setEditingValue({
      optionId,
      valueId: optionValue.id,
      value: optionValue.value,
    });
    setEditingOptionId("");
    setEditingOptionName("");
  };

  const handleUpdateOptionValue = async () => {
    const value = editingValue.value.trim();

    if (!value) {
      showError("Option value is required.");
      return;
    }

    setSaving(true);

    try {
      await updateProductOptionValue(authToken, productId, editingValue.optionId, editingValue.valueId, { value });
      setEditingValue(EMPTY_VALUE_EDIT);
      toast.success("Option value updated.");
      await loadVariantData();
    } catch (err) {
      showError(err.message || "Failed to update option value.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOptionValue = async (optionId, valueId) => {
    setSaving(true);

    try {
      await deleteProductOptionValue(authToken, productId, optionId, valueId);
      if (editingValue.valueId === valueId) {
        setEditingValue(EMPTY_VALUE_EDIT);
      }
      toast.success("Option value deleted.");
      await loadVariantData();
    } catch (err) {
      showError(err.message || "Failed to delete option value.");
    } finally {
      setSaving(false);
    }
  };

  const handleVariantFormChange = (field, value) => {
    setVariantForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleVariantOptionChange = (optionName, value) => {
    setVariantForm((currentForm) => ({
      ...currentForm,
      optionValues: {
        ...currentForm.optionValues,
        [optionName]: value,
      },
    }));
  };

  const handleVariantImagesChange = (imageUrls) => {
    handleVariantFormChange("images", joinLines(imageUrls));
  };

  const queueVariantImageFiles = (files) => {
    const fileList = Array.from(files || []);
    const imageFiles = fileList.filter((file) => file.type?.startsWith("image/"));

    if (fileList.length === 0) {
      return [];
    }

    if (imageFiles.length === 0) {
      showError("Only image files can be uploaded.");
      return [];
    }

    if (imageFiles.length !== fileList.length) {
      toast.warning("Non-image files were skipped.");
    }

    setVariantImageFiles((currentFiles) => [...currentFiles, ...imageFiles]);
    setVariantImagePreviews((currentPreviews) => [
      ...currentPreviews,
      ...createLocalImagePreviews(imageFiles),
    ]);
    toast.success(
      imageFiles.length === 1
        ? "Variant image queued. It will upload after saving."
        : `${imageFiles.length} variant images queued. They will upload after saving.`
    );

    return imageFiles;
  };

  const handleVariantFileInputChange = (event) => {
    queueVariantImageFiles(event.target.files);
    event.target.value = "";
  };

  const handleVariantUploadDragOver = (event) => {
    if (editable && canCreateVariant) {
      event.preventDefault();
    }
  };

  const handleVariantUploadDrop = (event) => {
    event.preventDefault();

    if (!busy && editable && canCreateVariant) {
      queueVariantImageFiles(event.dataTransfer.files);
    }
  };

  const handleRemoveVariantImage = (index) => {
    const nextImageUrls = [...variantImageUrls];

    nextImageUrls.splice(index, 1);
    handleVariantImagesChange(nextImageUrls);
  };

  const handleMoveVariantImage = (index, offset) => {
    const targetIndex = index + offset;

    if (targetIndex < 0 || targetIndex >= variantImageUrls.length) {
      return;
    }

    handleVariantImagesChange(moveImage(variantImageUrls, index, targetIndex));
  };

  const handleSetPrimaryVariantImage = (index) => {
    if (index === 0) {
      return;
    }

    handleVariantImagesChange(moveImage(variantImageUrls, index, 0));
  };

  const handleVariantImageDrop = (event, targetIndex) => {
    event.preventDefault();

    if (!editable || draggedVariantImageIndex === null) {
      return;
    }

    handleVariantImagesChange(moveImage(variantImageUrls, draggedVariantImageIndex, targetIndex));
    setDraggedVariantImageIndex(null);
  };

  const buildVariantPayload = () => {
    return {
      sku: variantForm.sku.trim(),
      optionValues: options
        .map((option) => ({
          optionName: option.name,
          value: variantForm.optionValues[option.name] || "",
        }))
        .filter((optionValue) => optionValue.value),
      price: variantForm.price,
      salePrice: variantForm.salePrice === "" ? null : variantForm.salePrice,
      images: splitLines(variantForm.images),
      isActive: Boolean(variantForm.isActive),
    };
  };

  const validateVariantPayload = (payload) => {
    const price = Number(payload.price);
    const salePrice = payload.salePrice === null ? null : Number(payload.salePrice);

    if (!payload.sku) {
      return "Variant SKU is required.";
    }

    if (options.length === 0) {
      return "Add at least one product option before creating variants.";
    }

    if (!everyOptionHasValue) {
      return "Each product option needs at least one value before creating variants.";
    }

    if (payload.optionValues.length !== options.length) {
      return "Select one value for every product option.";
    }

    if (!Number.isFinite(price) || price < 0) {
      return "Variant price must be a valid non-negative number.";
    }

    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0)) {
      return "Variant sale price must be a valid non-negative number.";
    }

    if (salePrice !== null && salePrice > price) {
      return "Variant sale price cannot be greater than price.";
    }

    return "";
  };

  const uploadQueuedVariantImages = async () => {
    if (variantImageFiles.length === 0) {
      return [];
    }

    setVariantUploadingImages(true);

    try {
      const uploadedImages = await uploadProductImages(authToken, variantImageFiles);

      return uploadedImages.map((image) => image.url).filter(Boolean);
    } finally {
      setVariantUploadingImages(false);
    }
  };

  const handleSubmitVariant = async () => {
    const payload = buildVariantPayload();
    const validationError = validateVariantPayload(payload);

    if (validationError) {
      showError(validationError);
      return;
    }

    setSaving(true);

    try {
      if (isEditingVariant) {
        const uploadedUrls = await uploadQueuedVariantImages();

        await updateProductVariant(authToken, productId, variantForm.id, {
          ...payload,
          images: [
            ...payload.images,
            ...uploadedUrls,
          ],
        });
        toast.success("Product variant updated.");
        clearVariantImageQueue();
      } else {
        const createResponse = await createProductVariant(authToken, productId, payload);
        const createdVariant = getVariantFromResponse(createResponse);
        const createdVariantId = getVariantId(createdVariant);

        if (variantImageFiles.length > 0) {
          if (!createdVariantId) {
            toast.warning("Product variant created, but image upload was skipped.");
          } else {
            try {
              const uploadedUrls = await uploadQueuedVariantImages();

              await updateProductVariant(authToken, productId, createdVariantId, {
                images: [
                  ...payload.images,
                  ...uploadedUrls,
                ],
              });
            } catch (err) {
              toast.warning(
                err.message
                  ? `Product variant created, but image upload failed: ${err.message}`
                  : "Product variant created, but image upload failed."
              );
            }
          }
        }

        toast.success("Product variant created.");
        clearVariantImageQueue();
      }

      setVariantForm(EMPTY_VARIANT_FORM);
      setVariantFormOpen(false);
      await loadVariantData();
      await onVariantsChanged?.({ hasVariants: true });
    } catch (err) {
      showError(err.message || "Failed to save product variant.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditVariant = (variant) => {
    setVariantForm(buildVariantFormFromVariant(variant));
    clearVariantImageQueue();
    setVariantFormOpen(true);
  };

  const handleToggleVariantActive = async (variant) => {
    setSaving(true);

    try {
      await updateProductVariant(
        authToken,
        productId,
        variant.id,
        buildVariantPayloadFromVariant(variant, { isActive: variant.isActive === false })
      );
      toast.success("Variant availability updated.");
      await loadVariantData();
      await onVariantsChanged?.();
    } catch (err) {
      showError(err.message || "Failed to update variant availability.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    setSaving(true);

    try {
      await deleteProductVariant(authToken, productId, variantId);
      toast.success("Product variant deleted.");
      if (variantForm.id === variantId) {
        setVariantForm(EMPTY_VARIANT_FORM);
        clearVariantImageQueue();
        setVariantFormOpen(false);
      }
      await loadVariantData();
      await onVariantsChanged?.();
    } catch (err) {
      showError(err.message || "Failed to delete product variant.");
    } finally {
      setSaving(false);
    }
  };

  if (!productId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Save the product before adding variants.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading variants...
          </Typography>
        </Stack>
      ) : null}

      <ProductOptionsPanel
        busy={busy}
        editable={editable}
        editingOptionId={editingOptionId}
        editingOptionName={editingOptionName}
        editingValue={editingValue}
        optionForm={optionForm}
        optionFormOpen={optionFormOpen}
        options={options}
        valueCount={valueCount}
        valueDrafts={valueDrafts}
        onAddOptionClick={() => openOptionForm()}
        onAddOptionValue={handleAddOptionValue}
        onCancelEditOption={() => {
          setEditingOptionId("");
          setEditingOptionName("");
        }}
        onCancelEditValue={() => setEditingValue(EMPTY_VALUE_EDIT)}
        onCancelOptionForm={() => {
          setOptionFormOpen(false);
          setOptionForm(EMPTY_OPTION_FORM);
        }}
        onCreateOption={handleCreateOption}
        onDeleteOption={handleDeleteOption}
        onDeleteOptionValue={handleDeleteOptionValue}
        onEditingOptionNameChange={setEditingOptionName}
        onEditingValueChange={(value) => setEditingValue((current) => ({
          ...current,
          value,
        }))}
        onOptionFormChange={handleOptionFormChange}
        onStartEditOption={handleStartEditOption}
        onStartEditValue={handleStartEditValue}
        onUpdateOption={handleUpdateOption}
        onUpdateOptionValue={handleUpdateOptionValue}
        onValueDraftChange={handleValueDraftChange}
      />

      <Box sx={cardSx}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={(theme) => ({
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: `${theme.palette.secondary.main}0F`,
          })}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Variants
            </Typography>
          </Box>
          {editable ? (
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setVariantForm(EMPTY_VARIANT_FORM);
                clearVariantImageQueue();
                setVariantFormOpen(true);
              }}
              disabled={busy || !canCreateVariant}
            >
              Add variant
            </Button>
          ) : null}
        </Stack>

        <Stack spacing={2} sx={{ p: 2 }}>


          {editable && !canCreateVariant ? (
            <Alert severity="info">
              Add at least one option with values before creating a variant.
            </Alert>
          ) : null}

          {editable && variantFormOpen ? (
            <Stack
              spacing={1.5}
              sx={(theme) => ({
                border: "1px solid",
                borderColor: "secondary.light",
                borderRadius: 1,
                p: 1.5,
                bgcolor: `${theme.palette.secondary.main}08`,
              })}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={700}>
                  {isEditingVariant ? "Edit variant" : "Add variant"}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setVariantForm(EMPTY_VARIANT_FORM);
                    clearVariantImageQueue();
                    setVariantFormOpen(false);
                  }}
                  disabled={busy}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField
                  label="Variant SKU"
                  value={variantForm.sku}
                  onChange={(event) => handleVariantFormChange("sku", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Price"
                  type="number"
                  value={variantForm.price}
                  onChange={(event) => handleVariantFormChange("price", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  label="Sale Price"
                  type="number"
                  value={variantForm.salePrice}
                  onChange={(event) => handleVariantFormChange("salePrice", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                {options.map((option) => (
                  <TextField
                    key={option.id}
                    select
                    label={option.name}
                    value={variantForm.optionValues[option.name] || ""}
                    onChange={(event) => handleVariantOptionChange(option.name, event.target.value)}
                    disabled={busy || !canCreateVariant || (option.values || []).length === 0}
                    fullWidth
                    size="small"
                  >
                    {(option.values || []).map((optionValue) => (
                      <MenuItem key={optionValue.id} value={optionValue.value}>
                        {optionValue.value}
                      </MenuItem>
                    ))}
                  </TextField>
                ))}
              </Stack>

              <VariantMediaField
                busy={busy || !canCreateVariant}
                draggedImageIndex={draggedVariantImageIndex}
                editable={editable && canCreateVariant}
                imageUrls={variantImageUrls}
                localImagePreviews={variantImagePreviews}
                uploadingImages={variantUploadingImages}
                onFileInputChange={handleVariantFileInputChange}
                onImageDrop={handleVariantImageDrop}
                onMoveImage={handleMoveVariantImage}
                onRemoveImage={handleRemoveVariantImage}
                onSetDraggedImageIndex={setDraggedVariantImageIndex}
                onSetPrimaryImage={handleSetPrimaryVariantImage}
                onUploadDragOver={handleVariantUploadDragOver}
                onUploadDrop={handleVariantUploadDrop}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <FormControlLabel
                  control={(
                    <Switch
                      checked={variantForm.isActive}
                      onChange={(event) => handleVariantFormChange("isActive", event.target.checked)}
                      disabled={busy || !canCreateVariant}
                    />
                  )}
                  label="Available"
                />
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    setVariantForm(EMPTY_VARIANT_FORM);
                    clearVariantImageQueue();
                    setVariantFormOpen(false);
                  }}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={isEditingVariant ? <EditIcon /> : <AddIcon />}
                  onClick={handleSubmitVariant}
                  disabled={busy || !canCreateVariant}
                >
                  {isEditingVariant ? "Update variant" : "Create variant"}
                </Button>
              </Stack>
            </Stack>
          ) : null}

          <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <Table size="small" sx={{ minWidth: 780 }}>
              <TableHead sx={(theme) => ({ bgcolor: `${theme.palette.secondary.main}0F` })}>
                <TableRow>
                  <TableCell sx={{ width: 96 }} />
                  <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                    Variant
                  </TableCell>
                  <TableCell sx={{ width: 180, fontWeight: 700, color: "text.secondary" }}>
                    Price
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 160,
                      fontWeight: 700,
                      color: "text.secondary",
                      textDecoration: "underline dotted",
                      textUnderlineOffset: 4,
                    }}
                  >
                    Available
                  </TableCell>
                  <TableCell align="right" sx={{ width: 96, fontWeight: 700, color: "text.secondary" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVariants.length > 0 ? filteredVariants.map((variant) => (
                  <TableRow key={variant.id} hover sx={{ "& td": { py: 1.25 } }}>
                    <TableCell sx={{ width: 96 }}>
                      <Box
                        sx={{
                          width: 74,
                          height: 74,
                          border: "1px dashed",
                          borderColor: variant.images?.[0] ? "secondary.light" : "divider",
                          borderRadius: 1,
                          bgcolor: "background.default",
                          display: "grid",
                          placeItems: "center",
                          overflow: "hidden",
                        }}
                      >
                        {variant.images?.[0] ? (
                          <Box
                            component="img"
                            src={variant.images[0]}
                            alt=""
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <ImageOutlinedIcon color="primary" fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={700} noWrap>
                          {getVariantLabel(variant)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                          {variant.sku}
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                          {(variant.optionValues || []).map((optionValue) => (
                            <Chip
                              key={`${variant.id}-${optionValue.optionName}`}
                              label={`${optionValue.optionName}: ${optionValue.value}`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: 180 }}>
                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "success.light",
                          borderRadius: 1,
                          px: 1.5,
                          py: 1,
                          bgcolor: (theme) => `${theme.palette.success.main}0A`,
                          minHeight: 42,
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          $ {formatMoney(variant.price)}
                        </Typography>
                      </Box>
                      {variant.salePrice !== null && variant.salePrice !== undefined ? (
                        <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 0.5 }}>
                          Sale $ {formatMoney(variant.salePrice)}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ width: 160 }}>
                      {editable ? (
                        <Switch
                          checked={variant.isActive !== false}
                          onChange={() => handleToggleVariantActive(variant)}
                          disabled={busy}
                        />
                      ) : (
                        <Chip
                          label={variant.isActive ? "Active" : "Inactive"}
                          color={variant.isActive ? "success" : "default"}
                          variant={variant.isActive ? "filled" : "outlined"}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ width: 96 }}>
                      {editable ? (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit variant">
                            <span>
                              <IconButton size="small" onClick={() => handleEditVariant(variant)} disabled={busy}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete variant">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteVariant(variant.id)}
                                disabled={busy}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                        No variants found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Box>
    </Stack>
  );
};

export default memo(ProductVariantsPanel);
