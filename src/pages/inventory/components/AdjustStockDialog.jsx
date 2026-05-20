import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import { getStockTargetLabel } from "./inventoryFormatters";

const AdjustStockDialog = ({
  stock,
  form,
  error,
  saving,
  onClose,
  onChange,
  onSave,
}) => (
  <Dialog open={Boolean(stock)} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle>Adjust Stock</DialogTitle>
    <DialogContent dividers>
      <Stack spacing={2} sx={{ pt: 0.5 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Alert severity="info">
          {stock ? getStockTargetLabel(stock) : ""}
        </Alert>
        <TextField
          label="Adjustment Quantity"
          name="quantity"
          type="number"
          value={form.quantity}
          onChange={onChange}
          disabled={saving}
          helperText="Use positive numbers to add stock and negative numbers to remove stock."
          required
          fullWidth
        />
        <TextField
          label="Note"
          name="note"
          value={form.note}
          onChange={onChange}
          disabled={saving}
          fullWidth
          multiline
          minRows={2}
        />
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
        startIcon={saving ? <CircularProgress size={16} /> : <Inventory2Icon />}
      >
        Apply
      </Button>
    </DialogActions>
  </Dialog>
);

export default AdjustStockDialog;
