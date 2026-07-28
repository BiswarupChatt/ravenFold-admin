import { formatCurrency, formatDateTime, getUserDisplayName } from "@/lib/utils/utils";

export const PAYMENT_TABS = [
  { label: "Money Ledger", value: "ledger" },
  { label: "Provider Attempts", value: "attempts" },
];

export const PROVIDER_OPTIONS = [
  { label: "All providers", value: "all" },
  { label: "Razorpay", value: "razorpay" },
];

export const MONEY_STATUS_OPTIONS = [
  { label: "All money states", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Partially Refunded", value: "partially_refunded" },
  { label: "Refunded", value: "refunded" },
  { label: "Refund Pending", value: "refund_pending" },
  { label: "Refund Processed", value: "refund_processed" },
  { label: "Refund Failed", value: "refund_failed" },
];

export const ATTEMPT_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Created", value: "created" },
  { label: "Pending", value: "pending" },
  { label: "Authorized", value: "authorized" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

export const REFUND_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processed", value: "processed" },
  { label: "Failed", value: "failed" },
];

export const getStatusMeta = (status = "") => {
  const statusMap = {
    authorized: { color: "info", label: "Authorized" },
    cancelled: { color: "default", label: "Cancelled" },
    created: { color: "default", label: "Created" },
    failed: { color: "error", label: "Failed" },
    paid: { color: "success", label: "Paid" },
    partially_refunded: { color: "info", label: "Partially Refunded" },
    pending: { color: "warning", label: "Pending" },
    processed: { color: "success", label: "Processed" },
    refunded: { color: "info", label: "Refunded" },
  };

  return statusMap[status] || { color: "default", label: status || "-" };
};

export const formatPaymentMoney = (value, currency = "INR") => {
  return formatCurrency(value, currency);
};

export const formatPaymentDate = (value) => {
  return formatDateTime(value);
};

export const getOrderLabel = (row = {}) => {
  return row.order?.orderNumber || row.orderId || "-";
};

export const getCustomerLabel = (row = {}) => {
  return (
    getUserDisplayName(row.user) ||
    getUserDisplayName(row.order?.user) ||
    row.order?.shippingAddress?.fullName ||
    "Unknown customer"
  );
};

export const getCustomerEmail = (row = {}) => {
  return row.user?.email || row.order?.user?.email || "-";
};

export const getCustomerPhone = (row = {}) => {
  return row.user?.phone || row.order?.user?.phone || row.order?.shippingAddress?.phone || "-";
};

export const getCustomerAvatar = (row = {}) => {
  return row.user?.avatar || row.order?.user?.avatar || "";
};

export const getProviderLabel = (value = "") => {
  if (!value) {
    return "-";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const getMethodLabel = (value = "") => {
  if (!value || value === "unknown") {
    return "-";
  }

  return value.toUpperCase();
};
