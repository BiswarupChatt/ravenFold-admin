import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

const PROMOTION_TYPE_EXAMPLES = {
  BUY_X_GET_Y: {
    example: "Example: Buy 2 shirts and get 1 shirt free.",
    note: "Best for bundle-style offers where the cheapest eligible units become free.",
  },
  CART_VALUE: {
    example: "Example: Spend Rs. 5000 and get 10% off.",
    note: "Useful when you want to reward higher cart values.",
  },
  CATEGORY_DISCOUNT: {
    example: "Example: Flat 15% off on all jackets.",
    note: "Apply a discount only to products inside selected categories.",
  },
  COUPON: {
    example: "Example: Use WELCOME10 to get 10% off.",
    note: "Customers must enter the coupon code during cart or checkout.",
  },
  FIRST_ORDER: {
    example: "Example: First order users get 12% off.",
    note: "Only customers with no previous successful order can use it.",
  },
  FIXED_DISCOUNT: {
    example: "Example: Get Rs. 500 off on the order.",
    note: "Reduces a fixed amount instead of a percentage.",
  },
  FREE_SHIPPING: {
    example: "Example: Free shipping on eligible orders.",
    note: "Only the shipping charge is discounted.",
  },
  NEW_USER: {
    example: "Example: New accounts get 10% off for their first 7 days.",
    note: "Useful for short-window onboarding offers.",
  },
  PERCENTAGE_DISCOUNT: {
    example: "Example: Get 20% off on all products.",
    note: "Simple percentage discount across the selected scope.",
  },
  PRODUCT_DISCOUNT: {
    example: "Example: Get 25% off on selected products only.",
    note: "Use this when only specific SKUs should be discounted.",
  },
};

const formatOptionLabel = (option = {}) => {
  const secondaryLabel = option?.sku || option?.code || "";

  return secondaryLabel ? `${option.name} (${secondaryLabel})` : option.name || "";
};

const PromotionDialog = ({
  applicableOnOptions = [],
  categoryOptions = [],
  discountMethodOptions = [],
  editingPromotion,
  formData,
  formError = "",
  open,
  productOptions = [],
  promotionTypeOptions = [],
  saving = false,
  onChange,
  onClear,
  onClose,
  onMultiValueChange,
  onSubmit,
}) => {
  const promotionType = formData.type;
  const applicableOn = formData.applicableOn;
  const usesCouponCode = promotionType === "COUPON";
  const usesDiscountMethod = ["COUPON", "CART_VALUE"].includes(promotionType);
  const usesBuyGet = promotionType === "BUY_X_GET_Y";
  const usesDiscountValue = !["BUY_X_GET_Y", "FREE_SHIPPING"].includes(promotionType);
  const usesProductScope = promotionType === "PRODUCT_DISCOUNT" || applicableOn === "SPECIFIC_PRODUCTS";
  const usesCategoryScope = promotionType === "CATEGORY_DISCOUNT" || applicableOn === "SPECIFIC_CATEGORIES";
  const typeExample = PROMOTION_TYPE_EXAMPLES[promotionType] || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editingPromotion ? "Edit Promotion" : "Add Promotion"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              autoFocus
              fullWidth
              label="Title"
              name="title"
              required
              value={formData.title}
              onChange={onChange}
            />
            <TextField
              select
              fullWidth
              label="Type"
              name="type"
              required
              value={formData.type}
              onChange={onChange}
            >
              {promotionTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {typeExample ? (
            <Box
              sx={{
                bgcolor: "rgba(248, 245, 240, 0.8)",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                Offer Example
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {typeExample.example}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {typeExample.note}
              </Typography>
            </Box>
          ) : null}

          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Description"
            name="description"
            value={formData.description}
            onChange={onChange}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              fullWidth
              label="Applicable On"
              name="applicableOn"
              value={formData.applicableOn}
              onChange={onChange}
            >
              {applicableOnOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            {usesCouponCode ? (
              <TextField
                fullWidth
                label="Coupon Code"
                name="couponCode"
                value={formData.couponCode}
                onChange={onChange}
              />
            ) : null}
          </Stack>

          {usesProductScope ? (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={productOptions}
              getOptionLabel={formatOptionLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={formData.selectedProducts}
              onChange={(_event, value) => onMultiValueChange("selectedProducts", value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Products"
                  placeholder="Select products"
                />
              )}
            />
          ) : null}

          {usesCategoryScope ? (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={categoryOptions}
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={formData.selectedCategories}
              onChange={(_event, value) => onMultiValueChange("selectedCategories", value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categories"
                  placeholder="Select categories"
                />
              )}
            />
          ) : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {usesDiscountMethod ? (
              <TextField
                select
                fullWidth
                label="Discount Method"
                name="discountMethod"
                value={formData.discountMethod}
                onChange={onChange}
              >
                {discountMethodOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}

            {usesDiscountValue ? (
              <TextField
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
                label="Discount Value"
                name="discountValue"
                type="number"
                value={formData.discountValue}
                onChange={onChange}
              />
            ) : null}

            {usesDiscountValue ? (
              <TextField
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
                label="Max Discount Amount"
                name="maxDiscountAmount"
                type="number"
                value={formData.maxDiscountAmount}
                onChange={onChange}
              />
            ) : null}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              inputProps={{ min: 0, step: "0.01" }}
              label="Min Order Amount"
              name="minOrderAmount"
              type="number"
              value={formData.minOrderAmount}
              onChange={onChange}
            />
            <TextField
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              helperText="Higher priority wins when multiple non-stackable promotions compete for the same item."
              label="Priority"
              name="priority"
              type="number"
              value={formData.priority}
              onChange={onChange}
            />
          </Stack>

          {usesBuyGet ? (
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                inputProps={{ min: 1, step: 1 }}
                label="Buy Quantity"
                name="buyQuantity"
                required
                type="number"
                value={formData.buyQuantity}
                onChange={onChange}
              />
              <TextField
                fullWidth
                inputProps={{ min: 1, step: 1 }}
                label="Get Quantity"
                name="getQuantity"
                required
                type="number"
                value={formData.getQuantity}
                onChange={onChange}
              />
            </Stack>
          ) : null}

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              label="Usage Limit"
              name="usageLimit"
              type="number"
              value={formData.usageLimit}
              onChange={onChange}
            />
            <TextField
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              label="Per User Limit"
              name="perUserLimit"
              type="number"
              value={formData.perUserLimit}
              onChange={onChange}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="Start Date"
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={onChange}
            />
            <TextField
              fullWidth
              InputLabelProps={{ shrink: true }}
              label="End Date"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={onChange}
            />
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.isActive)}
                  name="isActive"
                  onChange={onChange}
                />
              )}
              label="Active"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.isStackable)}
                  name="isStackable"
                  onChange={onChange}
                />
              )}
              label="Stackable"
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(formData.isAutomatic)}
                  disabled={usesCouponCode}
                  name="isAutomatic"
                  onChange={onChange}
                />
              )}
              label="Automatic"
            />
          </Stack>

          <Box sx={{ mt: -0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Priority decides which promotion should win first when more than one promotion can apply.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
              Stackable means this promotion can be combined with other stackable promotions instead of replacing them.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        {!editingPromotion ? (
          <Button disabled={saving} onClick={onClear}>
            Clear
          </Button>
        ) : null}
        <Button disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disableElevation
          disabled={saving}
          onClick={onSubmit}
          startIcon={saving ? <CircularProgress color="inherit" size={16} /> : null}
          variant="contained"
        >
          {editingPromotion ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromotionDialog;
