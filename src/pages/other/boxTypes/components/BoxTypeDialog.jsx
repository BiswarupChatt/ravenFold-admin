import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";

const BoxTypeDialog = ({
  editingBoxType,
  formData,
  formError = "",
  open,
  saving = false,
  onChange,
  onClear,
  onClose,
  onSubmit,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>{editingBoxType ? "Edit Box Type" : "Add Box Type"}</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2} sx={{ pt: 0.5 }}>
        {formError ? <Alert severity="error">{formError}</Alert> : null}
        <TextField
          autoFocus
          fullWidth
          label="Name"
          name="name"
          required
          value={formData.name}
          onChange={onChange}
        />
        <TextField
          fullWidth
          helperText="Leave blank to generate it from the name."
          label="Code"
          name="code"
          value={formData.code}
          onChange={onChange}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            inputProps={{ min: 0, step: "0.01" }}
            label="Length cm"
            name="length"
            required
            type="number"
            value={formData.length}
            onChange={onChange}
          />
          <TextField
            fullWidth
            inputProps={{ min: 0, step: "0.01" }}
            label="Breadth cm"
            name="breadth"
            required
            type="number"
            value={formData.breadth}
            onChange={onChange}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            inputProps={{ min: 0, step: "0.01" }}
            label="Height cm"
            name="height"
            required
            type="number"
            value={formData.height}
            onChange={onChange}
          />
          <TextField
            fullWidth
            inputProps={{ min: 0, step: "0.01" }}
            label="Weight kg"
            name="weight"
            required
            type="number"
            value={formData.weight}
            onChange={onChange}
          />
        </Stack>
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
      </Stack>
    </DialogContent>
    <DialogActions>
      {!editingBoxType ? (
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
        {editingBoxType ? "Save" : "Create"}
      </Button>
    </DialogActions>
  </Dialog>
);

export default BoxTypeDialog;
