import { formatCurrency, formatDateTime } from "@/lib/utils/utils";

export const CART_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "converted", label: "Converted" },
  { value: "abandoned", label: "Abandoned" },
];

export const getCartStatusMeta = (status = "active") => {
  const statusMap = {
    active: { label: "Active", color: "success" },
    converted: { label: "Converted", color: "primary" },
    abandoned: { label: "Abandoned", color: "warning" },
  };

  return statusMap[status] || { label: status || "-", color: "default" };
};

export const formatCartMoney = (value, currency = "INR") => {
  return formatCurrency(value, currency);
};

export const formatCartDateTime = (value) => {
  return formatDateTime(value);
};

export const getCustomerName = (cart) => {
  return cart?.user?.name || cart?.user?.email || "Unknown customer";
};

export const getCustomerInitial = (cart) => {
  return getCustomerName(cart).charAt(0).toUpperCase();
};
