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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const AddEditCategoryModal = ({
  open,
  formData,
  formError,
  imageUploading,
  saving,
  editingCategory,
  categoryRows,
  disabledParentIds,
  getHierarchyColor,
  onClose,
  onClear,
  onChange,
  onImageUpload,
  onRemoveImage,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editingCategory ? "Edit Category" : "Add Category"}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            fullWidth
          />

          <TextField
            label="Slug"
            name="slug"
            value={formData.slug}
            onChange={onChange}
            fullWidth
            helperText="Leave blank while creating to generate it from the name."
          />

          <TextField
            select
            label="Parent Category"
            name="parentCategoryId"
            value={formData.parentCategoryId}
            onChange={onChange}
            fullWidth
          >
            <MenuItem value="">Root category</MenuItem>
            {categoryRows.map((category) => (
              <MenuItem
                key={category.id}
                value={category.id}
                disabled={disabledParentIds.has(category.id)}
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

          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>
              Category image
            </Typography>
            {formData.image ? (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                  width: 140,
                }}
              >
                <Box
                  component="img"
                  src={formData.image}
                  alt=""
                  sx={{ display: "block", height: 120, objectFit: "cover", width: "100%" }}
                />
              </Box>
            ) : null}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                component="label"
                disabled={saving || imageUploading}
                startIcon={imageUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                variant="outlined"
              >
                {formData.image ? "Replace image" : "Upload image"}
                <input
                  accept="image/*"
                  hidden
                  type="file"
                  onChange={(event) => {
                    const [file] = Array.from(event.target.files || []);

                    if (file) {
                      onImageUpload(file);
                    }

                    event.target.value = "";
                  }}
                />
              </Button>
              {formData.image ? (
                <Button
                  color="error"
                  disabled={saving || imageUploading}
                  onClick={onRemoveImage}
                  startIcon={<DeleteOutlineIcon />}
                  variant="outlined"
                >
                  Remove
                </Button>
              ) : null}
            </Stack>
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={onChange}
                name="isActive"
              />
            }
            label={formData.isActive ? "Active" : "Inactive"}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Box>
          {!editingCategory ? (
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
            {editingCategory ? "Save Changes" : "Create Category"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditCategoryModal;
