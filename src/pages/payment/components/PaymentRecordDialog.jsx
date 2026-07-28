import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  formatPaymentDate,
  formatPaymentMoney,
  getCustomerAvatar,
  getCustomerEmail,
  getCustomerLabel,
  getCustomerPhone,
  getMethodLabel,
  getOrderLabel,
  getProviderLabel,
  getStatusMeta,
} from "./paymentFormatters";
import { getUserDisplayName } from "@/lib/utils/utils";

const REFUND_ORDER_STATUS_OPTIONS = [
  { label: "Cancel order", value: "cancelled" },
  { label: "Mark returned", value: "returned" },
];

const getDefaultRefundForm = (payment = null) => ({
  amount: payment ? String(Number(payment.refundableAmount || 0).toFixed(2)) : "",
  orderStatus: "",
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

const formatLabel = (value = "") => {
  if (!value) {
    return "-";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getOrderStatusMeta = (status = "") => {
  const statusMap = {
    cancelled: { color: "error", label: "Cancelled" },
    confirmed: { color: "info", label: "Confirmed" },
    delivered: { color: "success", label: "Delivered" },
    packed: { color: "primary", label: "Packed" },
    pending: { color: "warning", label: "Pending" },
    returned: { color: "default", label: "Returned" },
    shipped: { color: "secondary", label: "Shipped" },
  };

  return statusMap[status] || { color: "default", label: formatLabel(status) };
};

const formatAddressLines = (address = {}) => [
  address.fullName,
  address.phone,
  [address.addressLine1, address.addressLine2].filter(Boolean).join(", "),
  [address.city, address.state, address.pincode].filter(Boolean).join(", "),
  address.country,
].filter(Boolean);

const getCustomerInitial = (record = {}) => {
  const customer = getCustomerLabel(record);

  return customer && customer !== "-" ? customer.charAt(0).toUpperCase() : "?";
};

const StatusChip = ({ status, variant = "status" }) => {
  const meta = variant === "order" ? getOrderStatusMeta(status) : getStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  );
};

const LabeledStatusChip = ({ label, status, variant }) => (
  <Stack spacing={0.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <StatusChip status={status} variant={variant} />
  </Stack>
);

const getRecordStatusLabel = (type) => {
  if (type === "refunds") {
    return "Refund status";
  }

  if (type === "attempts") {
    return "Attempt status";
  }

  return "Payment status";
};

const SummaryItem = ({ color = "text.primary", label, value }) => (
  <Box sx={{ minWidth: 150 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={700} color={color}>
      {value}
    </Typography>
  </Box>
);

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

const DetailPanel = ({ children, title }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      minWidth: 0,
      p: 1.5,
    }}
  >
    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.25 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

const AddressBlock = ({ address }) => {
  const lines = formatAddressLines(address);

  return lines.length > 0 ? (
    <Stack spacing={0.25}>
      {lines.map((line, index) => (
        <Typography key={`${line}-${index}`} variant="body2" color="text.secondary">
          {line}
        </Typography>
      ))}
    </Stack>
  ) : (
    <Typography variant="body2" color="text.secondary">
      No address saved.
    </Typography>
  );
};

const getRecordTime = (record = {}) => record.paidAt || record.processedAt || record.createdAt;

const getMoneyColor = (type) => {
  if (type === "refunds") {
    return "error.main";
  }

  if (type === "payments") {
    return "success.main";
  }

  return "text.primary";
};

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
  const isRefund = type === "refunds";
  const isAttempt = type === "attempts";
  const refundableAmount = Number(record?.refundableAmount || 0);
  const canRefund = isPayment && record?.provider === "razorpay" && refundableAmount > 0;
  const orderStatus = record?.order?.status || "";
  const orderPaymentStatus = record?.order?.paymentStatus || "";
  const moneyStatus = orderPaymentStatus || record?.status || "";
  const methodLabel = getMethodLabel(record?.paymentMethod);
  const providerLabel = getProviderLabel(record?.provider);

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

    if (!refundForm.orderStatus) {
      setRefundError("Choose whether this order should be cancelled or returned.");
      return;
    }

    try {
      await onRefund({
        amount,
        orderStatus: refundForm.orderStatus,
        payment: record,
        reason: refundForm.reason.trim(),
      });
    } catch (err) {
      setRefundError(err.message || "Failed to initiate refund.");
    }
  };

  return (
    <Dialog open={open} onClose={refundSubmitting ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 7 }}>
        {getTitle(type)}
        <IconButton
          aria-label="Close payment details"
          disabled={refundSubmitting}
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {record ? (
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "flex-start" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  alt={getCustomerLabel(record)}
                  src={getCustomerAvatar(record)}
                  slotProps={{
                    img: {
                      referrerPolicy: "no-referrer",
                    },
                  }}
                  sx={{ width: 42, height: 42 }}
                >
                  {getCustomerInitial(record)}
                </Avatar>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {getCustomerLabel(record)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {getCustomerEmail(record)}
                  </Typography>
                  {getCustomerPhone(record) !== "-" ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {getCustomerPhone(record)}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>

              <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  {getOrderLabel(record)}
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {orderStatus ? (
                    <LabeledStatusChip label="Order" status={orderStatus} variant="order" />
                  ) : null}
                  {moneyStatus ? (
                    <LabeledStatusChip label="Money" status={moneyStatus} />
                  ) : null}
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
              <SummaryItem
                color={getMoneyColor(type)}
                label={isRefund ? "Refund amount" : "Amount"}
                value={`${isRefund ? "-" : ""}${formatPaymentMoney(record.amount, record.currency)}`}
              />
              {isPayment ? (
                <>
                  <SummaryItem
                    color={Number(record.refundedAmount || 0) > 0 ? "error.main" : "text.primary"}
                    label="Refunded"
                    value={formatPaymentMoney(record.refundedAmount, record.currency)}
                  />
                  <SummaryItem label="Refundable" value={formatPaymentMoney(record.refundableAmount, record.currency)} />
                </>
              ) : null}
              {isRefund ? <SummaryItem label="Processed" value={formatPaymentDate(record.processedAt)} /> : null}
              <SummaryItem label={isPayment ? "Payment Time" : "Created At"} value={formatPaymentDate(getRecordTime(record))} />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1.1, minWidth: 0 }}>
                <DetailPanel title="Payment reference">
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.5,
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    }}
                  >
                    <DetailItem label="Record ID" value={record.id} mono />
                    <DetailItem label="Provider" value={providerLabel} />
                    <DetailItem label={getRecordStatusLabel(type)} value={formatLabel(record.status)} />
                    <DetailItem label="Payment attempt" value={record.paymentAttemptId} mono />
                    <DetailItem label="Provider order" value={record.providerOrderId} mono />
                    <DetailItem label="Provider payment" value={record.providerPaymentId} mono />
                    <DetailItem label="Provider session" value={record.providerSessionId} mono />
                    <DetailItem label="Provider refund" value={record.providerRefundId} mono />
                    <DetailItem label="Method" value={methodLabel} />
                    <DetailItem label="Updated" value={formatPaymentDate(record.updatedAt)} />
                  </Box>
                </DetailPanel>
              </Box>

              <Box sx={{ flex: 0.9, minWidth: 0 }}>
                <DetailPanel title="Order context">
                  <Stack spacing={1.25}>
                    <DetailItem label="Order ID" value={record.orderId} mono />
                    <DetailItem label="Order status" value={formatLabel(orderStatus)} />
                    <DetailItem label="Money status" value={formatLabel(orderPaymentStatus)} />
                    <DetailItem
                      label="Order total"
                      value={formatPaymentMoney(record.order?.totalPayable ?? record.amount, record.currency)}
                    />
                    <DetailItem label="Placed" value={formatPaymentDate(record.order?.placedAt)} />
                  </Stack>
                </DetailPanel>
              </Box>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DetailPanel title="Shipping address">
                  <AddressBlock address={record.order?.shippingAddress} />
                </DetailPanel>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DetailPanel title={isRefund ? "Refund note" : isAttempt ? "Attempt note" : "Payment note"}>
                  <Stack spacing={1.25}>
                    <DetailItem label="Reason" value={record.reason} />
                    <DetailItem label="Failure reason" value={record.failureReason} />
                    {isRefund ? <DetailItem label="Requested by" value={getUserDisplayName(record.requestedByUser) || record.requestedBy} /> : null}
                  </Stack>
                </DetailPanel>
              </Box>
            </Stack>

            {isPayment ? (
              <DetailPanel title="Refund">
                {canRefund ? (
                  <Stack spacing={1.5}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
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
                        label="Order result"
                        onChange={handleRefundFieldChange("orderStatus")}
                        required
                        select
                        size="small"
                        value={refundForm.orderStatus}
                      >
                        <MenuItem disabled value="">
                          Select result
                        </MenuItem>
                        {REFUND_ORDER_STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        fullWidth
                        label="Reason"
                        onChange={handleRefundFieldChange("reason")}
                        size="small"
                        value={refundForm.reason}
                      />
                    </Stack>

                    {refundError ? <Alert severity="error">{refundError}</Alert> : null}

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
              </DetailPanel>
            ) : null}
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button disabled={refundSubmitting} onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentRecordDialog;
