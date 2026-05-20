import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { getStockTargetLabel } from "./inventoryFormatters";

const EditInventoryStockDialog = ({
  open,
  stock,
  form,
  error,
  saving,
  onClose,
  onChange,
  onSave,
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Edit Inventory Stock</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2} sx={{ pt: 0.5 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Item
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25 }}>
            {stock ? getStockTargetLabel(stock) : ""}
          </Typography>
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Stock On Hand"
            name="stockOnHand"
            type="number"
            value={form.stockOnHand}
            onChange={onChange}
            disabled={saving}
            inputProps={{ min: 0, step: 1 }}
            required
            fullWidth
          />
          <TextField
            label="Reserved"
            name="reservedQuantity"
            type="number"
            value={form.reservedQuantity}
            onChange={onChange}
            disabled={saving}
            inputProps={{ min: 0, step: 1 }}
            fullWidth
          />
        </Stack>

        <TextField
          label="Low Stock Threshold"
          name="lowStockThreshold"
          type="number"
          value={form.lowStockThreshold}
          onChange={onChange}
          disabled={saving}
          inputProps={{ min: 0, step: 1 }}
          fullWidth
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <FormControlLabel
            control={(
              <Switch
                checked={form.trackInventory}
                onChange={onChange}
                name="trackInventory"
                disabled={saving}
              />
            )}
            label="Track inventory"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={form.allowBackorder}
                onChange={onChange}
                name="allowBackorder"
                disabled={saving}
              />
            )}
            label="Allow backorder"
          />
        </Stack>
      </Stack>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={onSave}
        disabled={saving}
        startIcon={saving ? <CircularProgress size={16} /> : null}
      >
        Save Changes
      </Button>
    </DialogActions>
  </Dialog>
);

export default EditInventoryStockDialog;
