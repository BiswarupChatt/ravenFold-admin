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
  const amount = Number(value || 0);

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCartDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const getCustomerName = (cart) => {
  return cart?.user?.name || cart?.user?.email || "Unknown customer";
};

export const getCustomerInitial = (cart) => {
  return getCustomerName(cart).charAt(0).toUpperCase();
};
