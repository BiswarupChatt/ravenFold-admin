import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import {
  adjustInventoryStock,
  createInventoryStock,
  fetchAdminInventoryStockForTarget,
  updateInventoryStock,
} from "@/lib/api/inventoryApi";
import { fetchAdminProductVariants } from "@/lib/api/productApi";
import { useToast } from "@/hooks/ToastContext";
import {
  buildStockFormFromStock,
  formatNumber,
  getVariantLabel,
  isNonNegativeInteger,
  isNonZeroInteger,
} from "@/lib/utils/utils";

const EMPTY_STOCK_FORM = {
  stockOnHand: "0",
  reservedQuantity: "0",
  lowStockThreshold: "5",
  trackInventory: true,
  allowBackorder: false,
  note: "",
};

const EMPTY_ADJUSTMENT_FORM = {
  quantity: "",
  note: "",
};

const EXISTING_STOCK_MODES = {
  ADJUST: "adjust",
  EDIT: "edit",
};

const ProductStockDrawer = ({
  authToken,
  open,
  product,
  onClose,
  onCreated,
}) => {
  const toast = useToast();
  const [variants, setVariants] = useState([]);
  const [variantSearch, setVariantSearch] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK_FORM);
  const [adjustmentForm, setAdjustmentForm] = useState(EMPTY_ADJUSTMENT_FORM);
  const [existingStockMode, setExistingStockMode] = useState(EXISTING_STOCK_MODES.ADJUST);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const [existingStock, setExistingStock] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const primaryImage = Array.isArray(product?.images) ? product.images[0] : "";
  const productHasVariants = Boolean(product?.hasVariants);
  const selectedTargetReady = Boolean(product && (!productHasVariants || selectedVariant));

  useEffect(() => {
    if (!open || !product) {
      return undefined;
    }

    let isActive = true;

    setStockForm(EMPTY_STOCK_FORM);
    setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
    setExistingStockMode(EXISTING_STOCK_MODES.ADJUST);
    setVariantSearch("");
    setSelectedVariant(null);
    setExistingStock(null);
    setError("");
    setVariants([]);
    setLoadingVariants(false);
    setCheckingStock(false);

    if (!product.hasVariants) {
      return () => {
        isActive = false;
      };
    }

    const loadVariants = async () => {
      setLoadingVariants(true);

      try {
        const variantList = await fetchAdminProductVariants(authToken, product.id, { page: 1, limit: 100 });

        if (isActive) {
          setVariants(variantList.items);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || "Failed to load variants.");
          setVariants([]);
        }
      } finally {
        if (isActive) {
          setLoadingVariants(false);
        }
      }
    };

    loadVariants();

    return () => {
      isActive = false;
    };
  }, [authToken, open, product]);

  useEffect(() => {
    if (!open || !product || (productHasVariants && !selectedVariant)) {
      setExistingStock(null);
      setCheckingStock(false);
      return undefined;
    }

    let isActive = true;

    const checkExistingStock = async () => {
      setCheckingStock(true);
      setError("");

      try {
        const stock = await fetchAdminInventoryStockForTarget(authToken, {
          productId: product.id,
          variantId: selectedVariant?.id || "",
        });

        if (isActive) {
          setExistingStock(stock);
          setStockForm(buildStockFormFromStock(stock, { note: "" }));
          setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
          setExistingStockMode(EXISTING_STOCK_MODES.ADJUST);
        }
      } catch (err) {
        if (isActive && !/not found/i.test(err.message || "")) {
          setError(err.message || "Failed to check inventory stock.");
        }

        if (isActive) {
          setExistingStock(null);
          setStockForm(EMPTY_STOCK_FORM);
          setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
        }
      } finally {
        if (isActive) {
          setCheckingStock(false);
        }
      }
    };

    checkExistingStock();

    return () => {
      isActive = false;
    };
  }, [authToken, open, product, productHasVariants, selectedVariant]);

  const handleClose = () => {
    if (saving) {
      return;
    }

    onClose();
  };

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setStockForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdjustmentFormChange = (event) => {
    const { name, value } = event.target;

    setAdjustmentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const validateStockForm = () => {
    if (!product) {
      return "Product is required.";
    }

    if (productHasVariants && !selectedVariant) {
      return "Variant is required.";
    }

    if (!isNonNegativeInteger(stockForm.stockOnHand)) {
      return "Stock on hand must be a non-negative whole number.";
    }

    if (existingStock && !isNonNegativeInteger(stockForm.reservedQuantity)) {
      return "Reserved quantity must be a non-negative whole number.";
    }

    if (!isNonNegativeInteger(stockForm.lowStockThreshold)) {
      return "Low stock threshold must be a non-negative whole number.";
    }

    if (
      existingStock
      && !stockForm.allowBackorder
      && Number(stockForm.reservedQuantity) > Number(stockForm.stockOnHand)
    ) {
      return "Reserved quantity cannot exceed stock on hand unless backorders are allowed.";
    }

    return "";
  };

  const handleCreateStock = async () => {
    const validationError = validateStockForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const note = stockForm.note.trim();

      await createInventoryStock(authToken, {
        productId: product.id,
        variantId: selectedVariant?.id || null,
        stockOnHand: Number(stockForm.stockOnHand),
        reservedQuantity: 0,
        lowStockThreshold: Number(stockForm.lowStockThreshold),
        trackInventory: Boolean(stockForm.trackInventory),
        allowBackorder: Boolean(stockForm.allowBackorder),
        ...(note ? { note } : {}),
      });

      toast.success("Inventory stock created.");
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create inventory stock.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustExistingStock = async () => {
    if (!existingStock?.id) {
      return;
    }

    if (!isNonZeroInteger(adjustmentForm.quantity)) {
      setError("Adjustment quantity must be a non-zero whole number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedStock = await adjustInventoryStock(authToken, {
        inventoryStockId: existingStock.id,
        quantity: Number(adjustmentForm.quantity),
        note: adjustmentForm.note,
      });

      setExistingStock(updatedStock);
      setStockForm(buildStockFormFromStock(updatedStock, { note: "" }));
      setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
      toast.success("Inventory adjusted.");
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to adjust inventory.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExistingStock = async () => {
    if (!existingStock?.id) {
      return;
    }

    const validationError = validateStockForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedStock = await updateInventoryStock(authToken, existingStock.id, {
        stockOnHand: Number(stockForm.stockOnHand),
        reservedQuantity: Number(stockForm.reservedQuantity),
        lowStockThreshold: Number(stockForm.lowStockThreshold),
        trackInventory: Boolean(stockForm.trackInventory),
        allowBackorder: Boolean(stockForm.allowBackorder),
      });

      setExistingStock(updatedStock);
      setStockForm(buildStockFormFromStock(updatedStock, { note: "" }));
      toast.success("Inventory stock updated.");
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update inventory stock.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryAction = () => {
    if (existingStock) {
      if (existingStockMode === EXISTING_STOCK_MODES.ADJUST) {
        handleAdjustExistingStock();
        return;
      }

      handleUpdateExistingStock();
      return;
    }

    handleCreateStock();
  };

  const primaryActionLabel = existingStock
    ? existingStockMode === EXISTING_STOCK_MODES.ADJUST
      ? "Apply Adjustment"
      : "Save Changes"
    : "Create Stock";

  const primaryActionDisabled = saving
    || checkingStock
    || !selectedTargetReady
    || (existingStock && existingStockMode === EXISTING_STOCK_MODES.ADJUST && !adjustmentForm.quantity);

  const primaryActionIcon = saving ? <CircularProgress color="inherit" size={16} /> : <Inventory2Icon />;

  const existingStockSummary = existingStock ? [
    { label: `On hand ${formatNumber(existingStock.stockOnHand)}` },
    { label: `Reserved ${formatNumber(existingStock.reservedQuantity)}`, variant: "outlined" },
    {
      label: `Available ${formatNumber(existingStock.availableQuantity)}`,
      color: existingStock.isLowStock ? "warning" : "success",
      variant: existingStock.isLowStock ? "filled" : "outlined",
    },
    { label: `Threshold ${formatNumber(existingStock.lowStockThreshold)}`, variant: "outlined" },
  ] : [];

  const handleVariantChange = (variant) => {
    setExistingStock(null);
    setStockForm(EMPTY_STOCK_FORM);
    setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
    setError("");
    setSelectedVariant(variant);
  };

  if (!product) {
    return null;
  }

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box
        sx={{
          width: { xs: "100vw", sm: 520 },
          maxWidth: "100vw",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700}>
              Add Stock
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {product.name}
            </Typography>
          </Box>

          <IconButton onClick={handleClose} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider />

        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 2 }}>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                    border: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {primaryImage ? (
                    <Box
                      component="img"
                      src={primaryImage}
                      alt=""
                      sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {product.name}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                    <Chip size="small" label={product.sku || "No SKU"} variant="outlined" />
                    <Chip
                      size="small"
                      label={productHasVariants ? "Variant product" : "Simple product"}
                      color={productHasVariants ? "primary" : "default"}
                      variant={productHasVariants ? "filled" : "outlined"}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Paper>

            {productHasVariants ? (
              <Autocomplete
                options={variants}
                value={selectedVariant}
                inputValue={variantSearch}
                onInputChange={(_event, value, reason) => {
                  if (reason === "input" || reason === "clear" || reason === "reset") {
                    setVariantSearch(value);
                  }
                }}
                onChange={(_event, variant) => {
                  handleVariantChange(variant);
                }}
                loading={loadingVariants}
                disabled={saving}
                openOnFocus
                getOptionLabel={getVariantLabel}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                noOptionsText={variantSearch.trim() ? "No matching variants" : "No variants found"}
                renderOption={(props, variant) => {
                  const { key, ...optionProps } = props;
                  const optionSummary = Array.isArray(variant.optionValues)
                    ? variant.optionValues.map((option) => `${option.optionName}: ${option.value}`).join(", ")
                    : "";

                  return (
                    <Box key={key} component="li" {...optionProps}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {variant.sku}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {optionSummary || "Variant"}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Variant"
                    placeholder="Search variant or SKU"
                    required
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingVariants ? <CircularProgress color="inherit" size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            ) : null}

            {selectedTargetReady && checkingStock ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Checking inventory
                </Typography>
              </Stack>
            ) : null}

            {existingStock ? (
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current inventory
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    {existingStockSummary.map((item) => (
                      <Chip
                        key={item.label}
                        size="small"
                        label={item.label}
                        color={item.color}
                        variant={item.variant}
                      />
                    ))}
                  </Stack>
                </Paper>

                <Tabs
                  value={existingStockMode}
                  onChange={(_event, value) => {
                    setError("");
                    setExistingStockMode(value);
                  }}
                  variant="fullWidth"
                >
                  <Tab value={EXISTING_STOCK_MODES.ADJUST} label="Adjust" />
                  <Tab value={EXISTING_STOCK_MODES.EDIT} label="Edit" />
                </Tabs>

                {existingStockMode === EXISTING_STOCK_MODES.ADJUST ? (
                  <Stack spacing={2}>
                    <TextField
                      label="Adjustment Quantity"
                      name="quantity"
                      type="number"
                      value={adjustmentForm.quantity}
                      onChange={handleAdjustmentFormChange}
                      disabled={saving}
                      helperText="Use positive numbers to add stock and negative numbers to remove stock."
                      required
                      fullWidth
                    />
                    <TextField
                      label="Note"
                      name="note"
                      value={adjustmentForm.note}
                      onChange={handleAdjustmentFormChange}
                      disabled={saving}
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Stock On Hand"
                        name="stockOnHand"
                        type="number"
                        value={stockForm.stockOnHand}
                        onChange={handleFormChange}
                        disabled={saving}
                        inputProps={{ min: 0, step: 1 }}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Reserved"
                        name="reservedQuantity"
                        type="number"
                        value={stockForm.reservedQuantity}
                        onChange={handleFormChange}
                        disabled={saving}
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                    </Stack>

                    <TextField
                      label="Low Stock Threshold"
                      name="lowStockThreshold"
                      type="number"
                      value={stockForm.lowStockThreshold}
                      onChange={handleFormChange}
                      disabled={saving}
                      inputProps={{ min: 0, step: 1 }}
                      fullWidth
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <FormControlLabel
                        control={(
                          <Switch
                            checked={stockForm.trackInventory}
                            onChange={handleFormChange}
                            name="trackInventory"
                            disabled={saving}
                          />
                        )}
                        label="Track inventory"
                      />
                      <FormControlLabel
                        control={(
                          <Switch
                            checked={stockForm.allowBackorder}
                            onChange={handleFormChange}
                            name="allowBackorder"
                            disabled={saving}
                          />
                        )}
                        label="Allow backorder"
                      />
                    </Stack>
                  </Stack>
                )}
              </Stack>
            ) : null}

            {selectedTargetReady && !existingStock && !checkingStock ? (
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Stock On Hand"
                    name="stockOnHand"
                    type="number"
                    value={stockForm.stockOnHand}
                    onChange={handleFormChange}
                    disabled={saving || checkingStock}
                    inputProps={{ min: 0, step: 1 }}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Low Stock Threshold"
                    name="lowStockThreshold"
                    type="number"
                    value={stockForm.lowStockThreshold}
                    onChange={handleFormChange}
                    disabled={saving || checkingStock}
                    inputProps={{ min: 0, step: 1 }}
                    fullWidth
                  />
                </Stack>

                <TextField
                  label="Note"
                  name="note"
                  value={stockForm.note}
                  onChange={handleFormChange}
                  disabled={saving || checkingStock}
                  fullWidth
                  multiline
                  minRows={2}
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={stockForm.trackInventory}
                        onChange={handleFormChange}
                        name="trackInventory"
                        disabled={saving || checkingStock}
                      />
                    )}
                    label="Track inventory"
                  />
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={stockForm.allowBackorder}
                        onChange={handleFormChange}
                        name="allowBackorder"
                        disabled={saving || checkingStock}
                      />
                    )}
                    label="Allow backorder"
                  />
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Box>

        <Divider />

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ p: 2 }}>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={primaryActionIcon}
            onClick={handlePrimaryAction}
            disabled={primaryActionDisabled}
          >
            {primaryActionLabel}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default ProductStockDrawer;
