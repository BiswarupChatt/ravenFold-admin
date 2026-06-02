import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  formatPaymentDate,
  formatPaymentMoney,
  getCustomerLabel,
  getMethodLabel,
  getOrderLabel,
  getProviderLabel,
  getStatusMeta,
} from "./paymentFormatters";

const getDefaultRefundForm = (payment = null) => ({
  amount: payment ? String(Number(payment.refundableAmount || 0).toFixed(2)) : "",
  reason: "",
});

const getTitle = (type) => {
  if (type === "attempts") {
    return "Payment attempt details";
  }

  if (type === "refunds") {
    return "Refund details";
  }

  return "Payment details";
};

const StatusChip = ({ status }) => {
  const meta = getStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  );
};

const DetailItem = ({ label, value, mono = false }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{
        fontFamily: mono ? "monospace" : undefined,
        overflowWrap: "anywhere",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const MoneySummary = ({ label, value, currency }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1.5,
      p: 1.25,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="subtitle2" fontWeight={800}>
      {formatPaymentMoney(value, currency)}
    </Typography>
  </Box>
);

function PaymentRecordDialog({
  onClose,
  onRefund,
  open,
  record,
  refundSubmitting = false,
  type,
}) {
  const [refundForm, setRefundForm] = useState(getDefaultRefundForm());
  const [refundError, setRefundError] = useState("");
  const isPayment = type === "payments";
  const refundableAmount = Number(record?.refundableAmount || 0);
  const canRefund = isPayment && record?.provider === "razorpay" && refundableAmount > 0;

  useEffect(() => {
    setRefundForm(getDefaultRefundForm(record));
    setRefundError("");
  }, [record]);

  const handleRefundFieldChange = (field) => (event) => {
    setRefundForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
    setRefundError("");
  };

  const handleRefundSubmit = async () => {
    if (!record) {
      return;
    }

    const amount = Number(refundForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setRefundError("Enter a refund amount greater than zero.");
      return;
    }

    if (amount > refundableAmount) {
      setRefundError(`Refund amount cannot exceed ${formatPaymentMoney(refundableAmount, record.currency)}.`);
      return;
    }

    try {
      await onRefund({
        amount,
        payment: record,
        reason: refundForm.reason.trim(),
      });
    } catch (err) {
      setRefundError(err.message || "Failed to initiate refund.");
    }
  };

  return (
    <Dialog open={open} onClose={refundSubmitting ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{getTitle(type)}</DialogTitle>
      <DialogContent dividers>
        {record ? (
          <Stack spacing={2.25}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  {getOrderLabel(record)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getCustomerLabel(record)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <StatusChip status={record.status} />
                <Chip size="small" label={getProviderLabel(record.provider)} variant="outlined" />
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <Box sx={{ flex: 1 }}>
                <MoneySummary label="Amount" value={record.amount} currency={record.currency} />
              </Box>
              {isPayment ? (
                <>
                  <Box sx={{ flex: 1 }}>
                    <MoneySummary label="Refunded" value={record.refundedAmount} currency={record.currency} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <MoneySummary label="Refundable" value={record.refundableAmount} currency={record.currency} />
                  </Box>
                </>
              ) : null}
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <DetailItem label="Record ID" value={record.id} mono />
              <DetailItem label="Order ID" value={record.orderId} mono />
              <DetailItem label="User ID" value={record.userId} mono />
              <DetailItem label="Method" value={getMethodLabel(record.paymentMethod)} />
              <DetailItem label="Provider Order ID" value={record.providerOrderId} mono />
              <DetailItem label="Provider Payment ID" value={record.providerPaymentId} mono />
              <DetailItem label="Provider Session ID" value={record.providerSessionId} mono />
              <DetailItem label="Provider Refund ID" value={record.providerRefundId} mono />
              <DetailItem label="Payment Attempt ID" value={record.paymentAttemptId} mono />
              <DetailItem label="Created" value={formatPaymentDate(record.createdAt)} />
              <DetailItem label="Updated" value={formatPaymentDate(record.updatedAt)} />
              <DetailItem label="Processed" value={formatPaymentDate(record.processedAt)} />
              <DetailItem label="Paid" value={formatPaymentDate(record.paidAt)} />
              <DetailItem label="Reason" value={record.reason} />
              <DetailItem label="Failure Reason" value={record.failureReason} />
            </Box>

            {isPayment ? (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    Refund
                  </Typography>

                  {canRefund ? (
                    <Stack spacing={1.5}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                        <TextField
                          fullWidth
                          label="Refund amount"
                          onChange={handleRefundFieldChange("amount")}
                          size="small"
                          type="number"
                          value={refundForm.amount}
                          inputProps={{
                            max: refundableAmount,
                            min: 0.01,
                            step: 0.01,
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Reason"
                          onChange={handleRefundFieldChange("reason")}
                          size="small"
                          value={refundForm.reason}
                        />
                      </Stack>

                      {refundError ? (
                        <Alert severity="error">{refundError}</Alert>
                      ) : null}

                      <Button
                        disabled={refundSubmitting}
                        onClick={handleRefundSubmit}
                        startIcon={refundSubmitting ? <CircularProgress color="inherit" size={16} /> : null}
                        sx={{ alignSelf: "flex-start" }}
                        variant="contained"
                      >
                        {refundSubmitting ? "Initiating..." : "Initiate Refund"}
                      </Button>
                    </Stack>
                  ) : (
                    <Alert severity="info">
                      {record.provider === "razorpay"
                        ? "There is no refundable amount left for this payment."
                        : "Refunds are currently wired for Razorpay payments only."}
                    </Alert>
                  )}
                </Box>
              </>
            ) : null}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button disabled={refundSubmitting} onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentRecordDialog;
