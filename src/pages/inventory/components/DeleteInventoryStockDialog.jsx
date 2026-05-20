import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { getStockTargetLabel } from "./inventoryFormatters";

const DeleteInventoryStockDialog = ({
  stock,
  deleting,
  onClose,
  onConfirm,
}) => (
  <Dialog open={Boolean(stock)} onClose={onClose} fullWidth maxWidth="xs">
    <DialogTitle>Delete Inventory Stock</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2">
        {stock ? `Delete inventory stock for "${getStockTargetLabel(stock)}"?` : ""}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button onClick={onClose} disabled={deleting}>
        Cancel
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        disabled={deleting}
        startIcon={deleting ? <CircularProgress size={16} /> : null}
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteInventoryStockDialog;
