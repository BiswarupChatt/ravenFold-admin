import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
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
import EditIcon from "@mui/icons-material/Edit";

import {
  createProductOption,
  createProductOptionValue,
  createProductVariant,
  deleteProductOption,
  deleteProductOptionValue,
  deleteProductVariant,
  fetchAdminProductVariants,
  fetchProductOptions,
  updateProductVariant,
} from "@/lib/api/productApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { useToast } from "@/hooks/ToastContext";
import { joinLines, splitCommaSeparatedValues, splitLines } from "@/lib/utils/adminShared";

const EMPTY_OPTION_FORM = {
  name: "",
  values: "",
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

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
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
      setError("");
    }
  }, [open]);

  const handleOptionFormChange = (field, value) => {
    setOptionForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
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
      toast.success("Product option created.");
      await loadVariantData();
    } catch (err) {
      setError(err.message || "Failed to create product option.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (optionId) => {
    setSaving(true);
    setError("");

    try {
      await deleteProductOption(authToken, productId, optionId);
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

  const handleDeleteOptionValue = async (optionId, valueId) => {
    setSaving(true);
    setError("");

    try {
      await deleteProductOptionValue(authToken, productId, optionId, valueId);
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
  };

  const handleDeleteVariant = async (variantId) => {
    setSaving(true);
    setError("");

    try {
      await deleteProductVariant(authToken, productId, variantId);
      toast.success("Product variant deleted.");
      if (variantForm.id === variantId) {
        setVariantForm(EMPTY_VARIANT_FORM);
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

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={`${options.length} option${options.length === 1 ? "" : "s"}`} size="small" />
        <Chip label={`${valueCount} value${valueCount === 1 ? "" : "s"}`} size="small" />
        <Chip
          label={`${variants.length} variant${variants.length === 1 ? "" : "s"}`}
          color={variants.length > 0 ? "primary" : "default"}
          variant={variants.length > 0 ? "filled" : "outlined"}
          size="small"
        />
      </Stack>

      <Box>
        <Stack spacing={0.25} sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            1. Variant Options
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add option groups like Color and Size, then add the values customers can choose.
          </Typography>
        </Stack>
        <Stack spacing={1.25}>
          {editable ? (
            <Stack spacing={1} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
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
                  helperText="Comma separated, for example: Black, Blue"
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleCreateOption}
                  disabled={busy}
                  sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, minWidth: 110 }}
                >
                  Option
                </Button>
              </Stack>
            </Stack>
          ) : null}

          {options.length > 0 ? (
            options.map((option) => (
              <Box
                key={option.id}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25 }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>
                      {option.name}
                    </Typography>
                    {editable ? (
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
                    ) : null}
                  </Stack>

                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                    {(option.values || []).map((optionValue) => (
                      <Chip
                        key={optionValue.id}
                        label={optionValue.value}
                        size="small"
                        onDelete={editable && !busy
                          ? () => handleDeleteOptionValue(option.id, optionValue.id)
                          : undefined}
                      />
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
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No variant options added yet.
            </Typography>
          )}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Stack spacing={0.25} sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            2. Variant Combinations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pick one value from each option and set its SKU, price, images, and shipping data.
          </Typography>
        </Stack>
        {editable && !canCreateVariant ? (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            Add at least one option with values before creating a variant.
          </Alert>
        ) : null}
        {editable ? (
          <Stack spacing={1.5} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25, mb: 1.5 }}>
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
                label="Active"
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
              {isEditingVariant ? (
                <Button
                  startIcon={<CloseIcon />}
                  onClick={() => setVariantForm(EMPTY_VARIANT_FORM)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                variant="contained"
                startIcon={isEditingVariant ? <EditIcon /> : <AddIcon />}
                onClick={handleSubmitVariant}
                disabled={busy || !canCreateVariant}
              >
                {isEditingVariant ? "Update Variant" : "Create Variant"}
              </Button>
            </Stack>
          </Stack>
        ) : null}

        <Stack spacing={1}>
          {variants.length > 0 ? variants.map((variant) => (
            <Box
              key={variant.id}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.25 }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {variant.sku}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatMoney(variant.price)}
                      {variant.salePrice !== null && variant.salePrice !== undefined
                        ? ` sale ${formatMoney(variant.salePrice)}`
                        : ""}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip
                      label={variant.isActive ? "Active" : "Inactive"}
                      color={variant.isActive ? "success" : "default"}
                      variant={variant.isActive ? "filled" : "outlined"}
                      size="small"
                    />
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
                </Stack>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {(variant.optionValues || []).map((optionValue) => (
                    <Chip
                      key={`${variant.id}-${optionValue.optionName}`}
                      label={`${optionValue.optionName}: ${optionValue.value}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Shipping: {variant.shipping?.requiresShipping === false ? "Not required" : "Required"}
                  {variant.shipping?.weight?.value ? `, ${variant.shipping.weight.value}${variant.shipping.weight.unit}` : ""}
                  {variant.shipping?.dimensions?.length
                    ? `, ${variant.shipping.dimensions.length}x${variant.shipping.dimensions.width || 0}x${variant.shipping.dimensions.height || 0}${variant.shipping.dimensions.unit}`
                    : ""}
                </Typography>
              </Stack>
            </Box>
          )) : (
            <Typography variant="body2" color="text.secondary">
              No variants added yet.
            </Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
};

export default ProductVariantsPanel;
