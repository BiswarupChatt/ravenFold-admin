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

const PickupLocationDialog = ({
  editingLocation,
  formData,
  formError = "",
  open,
  saving = false,
  onChange,
  onClear,
  onClose,
  onSubmit,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{editingLocation ? "Edit Pickup Location" : "Add Pickup Location"}</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2} sx={{ pt: 0.5 }}>
        {formError ? <Alert severity="error">{formError}</Alert> : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
        </Stack>

        <TextField
          fullWidth
          helperText="Provider pickup location name. Leave blank to use the location name."
          label="Pickup alias"
          name="pickupLocation"
          value={formData.pickupLocation}
          onChange={onChange}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
          />
          <TextField
            fullWidth
            label="Pincode"
            name="pincode"
            value={formData.pincode}
            onChange={onChange}
          />
        </Stack>

        <TextField
          fullWidth
          label="Address line 1"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={onChange}
        />
        <TextField
          fullWidth
          label="Address line 2"
          name="addressLine2"
          value={formData.addressLine2}
          onChange={onChange}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="City"
            name="city"
            value={formData.city}
            onChange={onChange}
          />
          <TextField
            fullWidth
            label="State"
            name="state"
            value={formData.state}
            onChange={onChange}
          />
          <TextField
            fullWidth
            label="Country"
            name="country"
            value={formData.country}
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
      {!editingLocation ? (
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
        {editingLocation ? "Save" : "Create"}
      </Button>
    </DialogActions>
  </Dialog>
);

export default PickupLocationDialog;
