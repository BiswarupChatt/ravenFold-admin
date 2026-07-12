import {
  Alert,
  Autocomplete,
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
} from "@mui/material";

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
