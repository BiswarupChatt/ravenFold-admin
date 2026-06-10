import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const DeleteBoxTypeDialog = ({
  boxType,
  deleting = false,
  open,
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Delete Box Type</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary">
        Delete {boxType?.name || "this box type"}?
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

export default DeleteBoxTypeDialog;
