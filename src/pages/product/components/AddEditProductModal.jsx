import {
  Alert,
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

const AddEditProductModal = ({
  open,
  formData,
  formError,
  saving,
  editingProduct,
  categoryRows,
  productStatuses,
  getHierarchyColor,
  onClose,
  onClear,
  onChange,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
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

          <TextField
            label="Image URLs"
            name="imageUrls"
            value={formData.imageUrls}
            onChange={onChange}
            fullWidth
            multiline
            minRows={2}
            helperText="Enter one image URL per line."
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
            <Button onClick={onClear} disabled={saving}>
              Clear
            </Button>
          ) : null}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={saving}
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
