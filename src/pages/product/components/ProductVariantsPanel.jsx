import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
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

const RECOMMENDED_OPTIONS = [
  "Color",
  "Size",
  "Fabric",
  "Age group",
  "Clothing features",
  "Target gender",
];

const EMPTY_OPTION_FORM = {
  name: "",
  values: "",
};

const EMPTY_VALUE_EDIT = {
  optionId: "",
  valueId: "",
  value: "",
};

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
  borderRadius: 1,
  bgcolor: "background.paper",
  overflow: "hidden",
};

const valuePillSx = {
  borderRadius: 1,
  bgcolor: (theme) => `${theme.palette.primary.main}12`,
  color: "primary.dark",
  minHeight: 32,
  px: 1,
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
  open,
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
  const [optionSearch, setOptionSearch] = useState("");
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

  const recommendedOptions = useMemo(() => {
    const search = optionSearch.trim().toLowerCase();
    const usedNames = new Set(options.map((option) => option.name.toLowerCase()));

    return RECOMMENDED_OPTIONS.filter((name) => {
      return !usedNames.has(name.toLowerCase()) && (!search || name.toLowerCase().includes(search));
    });
  }, [optionSearch, options]);

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
    if (!open || !productId) {
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
  }, [authToken, open, productId]);

  useEffect(() => {
    loadVariantData();
  }, [loadVariantData]);

  useEffect(() => {
    if (!open) {
      setOptionForm(EMPTY_OPTION_FORM);
      setValueDrafts({});
      setVariantForm(EMPTY_VARIANT_FORM);
      setOptionFormOpen(false);
      setVariantFormOpen(false);
      setOptionSearch("");
      setVariantSearch("");
      setEditingOptionId("");
      setEditingOptionName("");
      setEditingValue(EMPTY_VALUE_EDIT);
      setError("");
    }
  }, [open]);

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
      setOptionSearch("");
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

      <Box sx={cardSx}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Options
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Define attributes like size, color, or fabric.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
            <Chip label={`${options.length} option${options.length === 1 ? "" : "s"}`} size="small" />
            <Chip label={`${valueCount} value${valueCount === 1 ? "" : "s"}`} size="small" />
          </Stack>
        </Stack>

        <Stack spacing={1.5} sx={{ p: 2 }}>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            {options.length > 0 ? (
              options.map((option) => (
                <Box
                  key={option.id}
                  sx={{
                    p: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-of-type": {
                      borderBottom: 0,
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <DragIndicatorIcon color="disabled" sx={{ mt: 1 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {editingOptionId === option.id ? (
                        <Stack spacing={1}>
                          <TextField
                            label="Option name"
                            value={editingOptionName}
                            onChange={(event) => setEditingOptionName(event.target.value)}
                            disabled={busy}
                            fullWidth
                            size="small"
                          />
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              onClick={() => {
                                setEditingOptionId("");
                                setEditingOptionName("");
                              }}
                              disabled={busy}
                            >
                              Cancel
                            </Button>
                            <Button size="small" variant="contained" onClick={handleUpdateOption} disabled={busy}>
                              Save option
                            </Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Stack spacing={1.25}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Typography variant="body1" fontWeight={700}>
                              {option.name}
                            </Typography>
                            {editable ? (
                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Edit option">
                                  <span>
                                    <IconButton size="small" onClick={() => handleStartEditOption(option)} disabled={busy}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Delete option">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteOption(option.id)}
                                      disabled={busy}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            ) : null}
                          </Stack>

                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {(option.values || []).map((optionValue) => (
                              editingValue.valueId === optionValue.id ? (
                                <Stack
                                  key={optionValue.id}
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                  sx={{ minWidth: { xs: "100%", sm: 260 } }}
                                >
                                  <TextField
                                    label="Value"
                                    value={editingValue.value}
                                    onChange={(event) => setEditingValue((current) => ({
                                      ...current,
                                      value: event.target.value,
                                    }))}
                                    disabled={busy}
                                    size="small"
                                    fullWidth
                                  />
                                  <Button size="small" variant="contained" onClick={handleUpdateOptionValue} disabled={busy}>
                                    Save
                                  </Button>
                                  <IconButton size="small" onClick={() => setEditingValue(EMPTY_VALUE_EDIT)} disabled={busy}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              ) : (
                                <Stack
                                  key={optionValue.id}
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                  sx={valuePillSx}
                                >
                                  <Typography variant="body2" fontWeight={600}>
                                    {optionValue.value}
                                  </Typography>
                                  {editable ? (
                                    <>
                                      <Tooltip title="Edit value">
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleStartEditValue(option.id, optionValue)}
                                            disabled={busy}
                                            sx={{ p: 0.25 }}
                                          >
                                            <EditIcon sx={{ fontSize: 15 }} />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title="Delete value">
                                        <span>
                                          <IconButton
                                            size="small"
                                            onClick={() => handleDeleteOptionValue(option.id, optionValue.id)}
                                            disabled={busy}
                                            sx={{ p: 0.25 }}
                                          >
                                            <CloseIcon sx={{ fontSize: 15 }} />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </>
                                  ) : null}
                                </Stack>
                              )
                            ))}
                            {(option.values || []).length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No values yet.
                              </Typography>
                            ) : null}
                          </Stack>

                          {editable ? (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                              <TextField
                                label={`Add ${option.name} value`}
                                value={valueDrafts[option.id] || ""}
                                onChange={(event) => handleValueDraftChange(option.id, event.target.value)}
                                disabled={busy}
                                fullWidth
                                size="small"
                              />
                              <Button
                                variant="outlined"
                                onClick={() => handleAddOptionValue(option.id)}
                                disabled={busy}
                                sx={{ minWidth: 88 }}
                              >
                                Add
                              </Button>
                            </Stack>
                          ) : null}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                No variant options added yet.
              </Typography>
            )}

            {editable ? (
              <Box sx={{ borderTop: "1px solid", borderColor: "divider", p: 1.25 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => openOptionForm()}
                  disabled={busy}
                  sx={{ justifyContent: "flex-start" }}
                >
                  Add another option
                </Button>
              </Box>
            ) : null}
          </Box>

          {editable && optionFormOpen ? (
            <Box
              sx={{
                width: 380,
                maxWidth: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
                boxShadow: 4,
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
                <TextField
                  autoFocus
                  size="small"
                  placeholder="Search"
                  value={optionSearch}
                  onChange={(event) => setOptionSearch(event.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box sx={{ py: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 2, pb: 0.5 }}>
                  Recommended
                </Typography>
                {recommendedOptions.map((name) => (
                  <Button
                    key={name}
                    fullWidth
                    onClick={() => openOptionForm(name)}
                    sx={{
                      justifyContent: "flex-start",
                      px: 2,
                      py: 0.75,
                      color: "text.primary",
                      borderRadius: 0,
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    {name}
                  </Button>
                ))}
                {recommendedOptions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                    No recommendations match.
                  </Typography>
                ) : null}
              </Box>
              <Stack spacing={1} sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                <TextField
                  label="Option name"
                  value={optionForm.name}
                  onChange={(event) => handleOptionFormChange("name", event.target.value)}
                  disabled={busy}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Values"
                  value={optionForm.values}
                  onChange={(event) => handleOptionFormChange("values", event.target.value)}
                  disabled={busy}
                  fullWidth
                  size="small"
                  helperText="Comma separated, for example: XS, S, M"
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      setOptionFormOpen(false);
                      setOptionForm(EMPTY_OPTION_FORM);
                      setOptionSearch("");
                    }}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateOption}
                    disabled={busy}
                  >
                    Add option
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </Box>

      <Box sx={cardSx}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Variants
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage SKU, price, media, shipping, and availability for each combination.
            </Typography>
          </Box>
          {editable ? (
            <Button
              variant="outlined"
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
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`${variants.length} variant${variants.length === 1 ? "" : "s"}`}
              color={variants.length > 0 ? "primary" : "default"}
              variant={variants.length > 0 ? "filled" : "outlined"}
              size="small"
            />
            <Chip
              label={canCreateVariant ? "Ready for combinations" : "Options required"}
              color={canCreateVariant ? "success" : "default"}
              variant={canCreateVariant ? "filled" : "outlined"}
              size="small"
            />
          </Stack>

          {editable && !canCreateVariant ? (
            <Alert severity="info">
              Add at least one option with values before creating a variant.
            </Alert>
          ) : null}

          {editable && variantFormOpen ? (
            <Stack spacing={1.5} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5 }}>
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

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <TextField
              size="small"
              placeholder="Search variants"
              value={variantSearch}
              onChange={(event) => setVariantSearch(event.target.value)}
              sx={{ maxWidth: { sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title="Filter variants">
              <span>
                <IconButton size="small" disabled>
                  <FilterListIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 780 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "48px 96px minmax(220px, 1fr) 180px 160px 96px",
                    alignItems: "center",
                    bgcolor: "action.hover",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    minHeight: 52,
                  }}
                >
                  <Box sx={{ px: 1.25 }}>
                    <Checkbox size="small" disabled />
                  </Box>
                  <Box />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Variant
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Price
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ textDecoration: "underline dotted", textUnderlineOffset: 4 }}
                  >
                    Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} align="right" sx={{ pr: 1.5 }}>
                    Actions
                  </Typography>
                </Box>

                {filteredVariants.length > 0 ? filteredVariants.map((variant) => (
                  <Box
                    key={variant.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "48px 96px minmax(220px, 1fr) 180px 160px 96px",
                      alignItems: "center",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      minHeight: 108,
                      "&:last-of-type": {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <Box sx={{ px: 1.25 }}>
                      <Checkbox size="small" disabled />
                    </Box>
                    <Box
                      sx={{
                        width: 74,
                        height: 74,
                        border: "1px dashed",
                        borderColor: "divider",
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
                    <Box sx={{ minWidth: 0, pr: 2 }}>
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
                    <Box sx={{ pr: 2 }}>
                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          px: 1.5,
                          py: 1,
                          bgcolor: "background.paper",
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
                    </Box>
                    <Box sx={{ pr: 2 }}>
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
                    </Box>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ pr: 1 }}>
                      {editable ? (
                        <>
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
                        </>
                      ) : null}
                    </Stack>
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No variants found.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
};

export default ProductVariantsPanel;
