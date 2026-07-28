import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import { useEffect, useState } from "react";
import { getUserDisplayName } from "@/lib/utils/utils";

const STATUS_COLOR = {
  APPROVED: "success",
  HIDDEN: "default",
  PENDING: "warning",
  REJECTED: "error",
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const SummaryRow = ({ label, value }) => (
  <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={2}>
    <Typography color="text.secondary" variant="body2">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600} textAlign="right">
      {value || "-"}
    </Typography>
  </Stack>
);

function ReviewDetailsDialog({
  onAction,
  onClose,
  open,
  processing = false,
  review,
}) {
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    setAdminNote(review?.adminNote || "");
  }, [review]);

  const handleAction = (action) => {
    onAction?.(action, { adminNote });
  };

  const canApprove = review?.status === "PENDING" || review?.status === "REJECTED";
  const canReject = review?.status === "PENDING" || review?.status === "APPROVED";

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>Review Details</DialogTitle>
      <DialogContent dividers>
        {review ? (
          <Stack spacing={2}>
            <Stack
              alignItems={{ md: "center", xs: "flex-start" }}
              direction={{ md: "row", xs: "column" }}
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {review.product?.name || review.orderItem?.productSnapshot?.name || "Product"}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                  {review.variant?.label || "No variant details"}
                </Typography>
              </Box>
              <Chip
                color={STATUS_COLOR[review.status] || "default"}
                label={review.status || "Unknown"}
                size="small"
              />
            </Stack>

            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
              <SummaryRow label="Customer" value={getUserDisplayName(review.customer)} />
              <SummaryRow label="Email" value={review.customer?.email} />
              <SummaryRow label="Order" value={review.order?.orderNumber} />
              <SummaryRow label="Submitted" value={formatDate(review.createdAt)} />
              <SummaryRow label="Rating" value={`${review.rating || 0} / 5`} />
              <SummaryRow label="Verified Purchase" value={review.isVerifiedPurchase ? "Yes" : "No"} />
            </Box>

            <Box>
              <Typography fontWeight={700}>{review.title || "Customer review"}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>
                {review.comment}
              </Typography>
            </Box>

            {Array.isArray(review.images) && review.images.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {review.images.map((image) => (
                  <Box
                    key={image}
                    alt="Review"
                    component="img"
                    src={image}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1.5,
                      height: 88,
                      objectFit: "cover",
                      width: 88,
                    }}
                  />
                ))}
              </Stack>
            ) : null}

            <TextField
              fullWidth
              label="Admin note"
              minRows={3}
              multiline
              onChange={(event) => setAdminNote(event.target.value)}
              value={adminNote}
            />

            {review.status === "APPROVED" || review.status === "HIDDEN" ? (
              <Alert severity="info">
                Review visibility can be changed from the table toggle in the review list.
              </Alert>
            ) : null}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {canApprove ? (
          <Button
            color="success"
            disabled={processing}
            onClick={() => handleAction("approve")}
            variant="contained"
          >
            Approve
          </Button>
        ) : null}
        {canReject ? (
          <Button
            color="error"
            disabled={processing}
            onClick={() => handleAction("reject")}
            variant="outlined"
          >
            Reject
          </Button>
        ) : null}
        <Button
          color="error"
          disabled={processing}
          onClick={() => handleAction("delete")}
          variant="text"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReviewDetailsDialog;
