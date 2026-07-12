import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

const DeletePromotionDialog = ({
  deleting = false,
  open,
  promotion,
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Delete Promotion</DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary">
        {`Delete "${promotion?.title || "this promotion"}"? This action cannot be undone.`}
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

export default DeletePromotionDialog;
