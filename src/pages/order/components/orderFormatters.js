import { formatCurrency, formatDateTime } from "@/lib/utils/utils";

export const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const getOrderStatusMeta = (status = "pending") => {
  const statusMap = {
    pending: { label: "Pending", color: "warning" },
    confirmed: { label: "Confirmed", color: "info" },
    packed: { label: "Packed", color: "primary" },
    shipped: { label: "Shipped", color: "secondary" },
    delivered: { label: "Delivered", color: "success" },
    cancelled: { label: "Cancelled", color: "error" },
    returned: { label: "Returned", color: "default" },
  };

  return statusMap[status] || { label: status || "-", color: "default" };
};

export const getPaymentStatusMeta = (status = "pending") => {
  const statusMap = {
    pending: { label: "Pending", color: "warning" },
    paid: { label: "Paid", color: "success" },
    failed: { label: "Failed", color: "error" },
    refunded: { label: "Refunded", color: "info" },
  };

  return statusMap[status] || { label: status || "-", color: "default" };
};

export const formatOrderMoney = (value, currency = "INR") => {
  return formatCurrency(value, currency);
};

export const formatOrderDateTime = (value) => {
  return formatDateTime(value);
};

export const getCustomerName = (order) => {
  return order?.user?.name || order?.user?.email || order?.shippingAddress?.fullName || "Unknown customer";
};

export const getCustomerInitial = (order) => {
  return getCustomerName(order).charAt(0).toUpperCase();
};

export const formatAddressLines = (address = {}) => {
  return [
    address.fullName,
    address.phone,
    [address.addressLine1, address.addressLine2].filter(Boolean).join(", "),
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
};
