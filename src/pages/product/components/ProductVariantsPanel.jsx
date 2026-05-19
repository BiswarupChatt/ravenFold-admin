import { useCallback, useEffect, useMemo, useState } from "react";
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
} from "@/lib/api/productApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { useToast } from "@/hooks/ToastContext";
import { joinLines, splitCommaSeparatedValues, splitLines } from "@/lib/utils/adminShared";
import ProductOptionsPanel, { EMPTY_OPTION_FORM, EMPTY_VALUE_EDIT } from "./ProductOptionsPanel";

const EMPTY_VARIANT_FORM = {
  id: "",
  sku: "",
  optionValues: {},
  price: "",
  salePrice: "",
  images: "",
  isActive: true,
  requiresShipping: true,
  weightValue: "",
  weightUnit: "kg",
  length: "",
  width: "",
  height: "",
  dimensionUnit: "cm",
  shippingClass: "",
  isFreeShippingEligible: false,
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
    requiresShipping: variant.shipping?.requiresShipping !== false,
    weightValue: variant.shipping?.weight?.value === null || variant.shipping?.weight?.value === undefined
      ? ""
      : String(variant.shipping.weight.value),
    weightUnit: variant.shipping?.weight?.unit || "kg",
    length: variant.shipping?.dimensions?.length === null || variant.shipping?.dimensions?.length === undefined
      ? ""
      : String(variant.shipping.dimensions.length),
    width: variant.shipping?.dimensions?.width === null || variant.shipping?.dimensions?.width === undefined
      ? ""
      : String(variant.shipping.dimensions.width),
    height: variant.shipping?.dimensions?.height === null || variant.shipping?.dimensions?.height === undefined
      ? ""
      : String(variant.shipping.dimensions.height),
    dimensionUnit: variant.shipping?.dimensions?.unit || "cm",
    shippingClass: variant.shipping?.shippingClass || "",
    isFreeShippingEligible: Boolean(variant.shipping?.isFreeShippingEligible),
  };
};

const buildVariantPayloadFromVariant = (variant = {}, changes = {}) => ({
  sku: variant.sku || "",
  optionValues: Array.isArray(variant.optionValues) ? variant.optionValues : [],
  price: variant.price,
  salePrice: variant.salePrice === undefined ? null : variant.salePrice,
  images: Array.isArray(variant.images) ? variant.images : [],
  isActive: variant.isActive !== false,
  shipping: {
    requiresShipping: variant.shipping?.requiresShipping !== false,
    weight: {
      value: variant.shipping?.weight?.value ?? null,
      unit: variant.shipping?.weight?.unit || "kg",
    },
    dimensions: {
      length: variant.shipping?.dimensions?.length ?? null,
      width: variant.shipping?.dimensions?.width ?? null,
      height: variant.shipping?.dimensions?.height ?? null,
      unit: variant.shipping?.dimensions?.unit || "cm",
    },
    shippingClass: variant.shipping?.shippingClass || "",
    isFreeShippingEligible: Boolean(variant.shipping?.isFreeShippingEligible),
  },
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
  const [error, setError] = useState("");
  const busy = disabled || saving;
  const isEditingVariant = Boolean(variantForm.id);

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
    setError("");

    try {
      const [nextOptions, variantList] = await Promise.all([
        fetchProductOptions(authToken, productId),
        fetchAdminProductVariants(authToken, productId, { limit: 100 }),
      ]);

      setOptions(nextOptions);
      setVariants(variantList.items);
    } catch (err) {
      setError(err.message || "Failed to load variants.");
      setOptions([]);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, productId]);

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
    setError("");
  }, [productId]);

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
      setError("Option name is required.");
      return;
    }

    setSaving(true);
    setError("");

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
      setError(err.message || "Failed to create product option.");
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
      setError("Option name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateProductOption(authToken, productId, editingOptionId, { name });
      setEditingOptionId("");
      setEditingOptionName("");
      toast.success("Product option updated.");
      await loadVariantData();
    } catch (err) {
      setError(err.message || "Failed to update product option.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (optionId) => {
    setSaving(true);
    setError("");

    try {
      await deleteProductOption(authToken, productId, optionId);
      if (editingOptionId === optionId) {
        setEditingOptionId("");
        setEditingOptionName("");
      }
      toast.success("Product option deleted.");
      await loadVariantData();
    } catch (err) {
      setError(err.message || "Failed to delete product option.");
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
      setError("Option value is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createProductOptionValue(authToken, productId, optionId, { value });
      setValueDrafts((currentDrafts) => ({
        ...currentDrafts,
        [optionId]: "",
      }));
      toast.success("Option value added.");
      await loadVariantData();
    } catch (err) {
      setError(err.message || "Failed to add option value.");
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
      setError("Option value is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateProductOptionValue(authToken, productId, editingValue.optionId, editingValue.valueId, { value });
      setEditingValue(EMPTY_VALUE_EDIT);
      toast.success("Option value updated.");
      await loadVariantData();
    } catch (err) {
      setError(err.message || "Failed to update option value.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOptionValue = async (optionId, valueId) => {
    setSaving(true);
    setError("");

    try {
      await deleteProductOptionValue(authToken, productId, optionId, valueId);
      if (editingValue.valueId === valueId) {
        setEditingValue(EMPTY_VALUE_EDIT);
      }
      toast.success("Option value deleted.");
      await loadVariantData();
    } catch (err) {
      setError(err.message || "Failed to delete option value.");
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
      shipping: {
        requiresShipping: Boolean(variantForm.requiresShipping),
        weight: {
          value: variantForm.weightValue === "" ? null : variantForm.weightValue,
          unit: variantForm.weightUnit,
        },
        dimensions: {
          length: variantForm.length === "" ? null : variantForm.length,
          width: variantForm.width === "" ? null : variantForm.width,
          height: variantForm.height === "" ? null : variantForm.height,
          unit: variantForm.dimensionUnit,
        },
        shippingClass: variantForm.shippingClass.trim(),
        isFreeShippingEligible: Boolean(variantForm.isFreeShippingEligible),
      },
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

  const handleSubmitVariant = async () => {
    const payload = buildVariantPayload();
    const validationError = validateVariantPayload(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isEditingVariant) {
        await updateProductVariant(authToken, productId, variantForm.id, payload);
        toast.success("Product variant updated.");
      } else {
        await createProductVariant(authToken, productId, payload);
        toast.success("Product variant created.");
      }

      setVariantForm(EMPTY_VARIANT_FORM);
      setVariantFormOpen(false);
      await loadVariantData();
      await onVariantsChanged?.({ hasVariants: true });
    } catch (err) {
      setError(err.message || "Failed to save product variant.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditVariant = (variant) => {
    setVariantForm(buildVariantFormFromVariant(variant));
    setVariantFormOpen(true);
  };

  const handleToggleVariantActive = async (variant) => {
    setSaving(true);
    setError("");

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
      setError(err.message || "Failed to update variant availability.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    setSaving(true);
    setError("");

    try {
      await deleteProductVariant(authToken, productId, variantId);
      toast.success("Product variant deleted.");
      if (variantForm.id === variantId) {
        setVariantForm(EMPTY_VARIANT_FORM);
        setVariantFormOpen(false);
      }
      await loadVariantData();
      await onVariantsChanged?.();
    } catch (err) {
      setError(err.message || "Failed to delete product variant.");
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
      {error ? <Alert severity="error" onClose={() => setError("")}>{error}</Alert> : null}
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

              <TextField
                label="Variant image URLs"
                value={variantForm.images}
                onChange={(event) => handleVariantFormChange("images", event.target.value)}
                disabled={busy || !canCreateVariant}
                fullWidth
                multiline
                minRows={2}
                size="small"
                helperText="One image URL per line."
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
                <FormControlLabel
                  control={(
                    <Switch
                      checked={variantForm.requiresShipping}
                      onChange={(event) => handleVariantFormChange("requiresShipping", event.target.checked)}
                      disabled={busy || !canCreateVariant}
                    />
                  )}
                  label="Requires shipping"
                />
                <FormControlLabel
                  control={(
                    <Switch
                      checked={variantForm.isFreeShippingEligible}
                      onChange={(event) => handleVariantFormChange("isFreeShippingEligible", event.target.checked)}
                      disabled={busy || !canCreateVariant}
                    />
                  )}
                  label="Free shipping"
                />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField
                  label="Weight"
                  type="number"
                  value={variantForm.weightValue}
                  onChange={(event) => handleVariantFormChange("weightValue", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  select
                  label="Weight Unit"
                  value={variantForm.weightUnit}
                  onChange={(event) => handleVariantFormChange("weightUnit", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                >
                  {["kg", "g", "lb", "oz"].map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Shipping Class"
                  value={variantForm.shippingClass}
                  onChange={(event) => handleVariantFormChange("shippingClass", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                />
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                <TextField
                  label="Length"
                  type="number"
                  value={variantForm.length}
                  onChange={(event) => handleVariantFormChange("length", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  label="Width"
                  type="number"
                  value={variantForm.width}
                  onChange={(event) => handleVariantFormChange("width", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  label="Height"
                  type="number"
                  value={variantForm.height}
                  onChange={(event) => handleVariantFormChange("height", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  select
                  label="Unit"
                  value={variantForm.dimensionUnit}
                  onChange={(event) => handleVariantFormChange("dimensionUnit", event.target.value)}
                  disabled={busy || !canCreateVariant}
                  fullWidth
                  size="small"
                >
                  {["cm", "in"].map((unit) => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    setVariantForm(EMPTY_VARIANT_FORM);
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

export default ProductVariantsPanel;
