import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const DeletePickupLocationDialog = ({
  deleting = false,
  location,
  open,
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Delete Pickup Location</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary">
        Delete {location?.name || "this pickup location"}?
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button disabled={deleting} onClick={onClose}>
        Cancel
      </Button>
      <Button
        color="error"
        disabled={deleting}
        onClick={onConfirm}
        startIcon={deleting ? <CircularProgress color="inherit" size={16} /> : null}
        variant="contained"
      >
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeletePickupLocationDialog;
