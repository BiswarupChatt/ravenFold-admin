import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const DeleteCategoryModal = ({
  open,
  category,
  deleting,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose}>
      <DialogTitle>Delete Category</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2">
          Delete "{category?.name}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} /> : null}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCategoryModal;
