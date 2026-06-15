export const SHIPPING_PROVIDER_OPTIONS = [
  { value: "shiprocket", label: "Shiprocket" },
  { value: "delhivery", label: "Delhivery" },
  { value: "manual", label: "Manual" },
];

export const SHIPMENT_STATUS_OPTIONS = [
  { value: "not_created", label: "Draft" },
  { value: "provider_order_created", label: "Provider Order Created" },
  { value: "label_created", label: "Label Created" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out For Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rto", label: "RTO" },
  { value: "lost", label: "Lost" },
];

export const getShipmentStatusMeta = (status = "") => {
  const statusMap = {
    cancelled: { label: "Cancelled", color: "error" },
    delivered: { label: "Delivered", color: "success" },
    in_transit: { label: "In Transit", color: "secondary" },
    label_created: { label: "Label Created", color: "info" },
    lost: { label: "Lost", color: "error" },
    not_created: { label: "Draft", color: "default" },
    out_for_delivery: { label: "Out For Delivery", color: "primary" },
    picked_up: { label: "Picked Up", color: "primary" },
    pickup_scheduled: { label: "Pickup Scheduled", color: "warning" },
    provider_order_created: { label: "Provider Order Created", color: "warning" },
    rto: { label: "RTO", color: "warning" },
  };

  return statusMap[status] || { label: status || "-", color: "default" };
};

export const formatProviderName = (provider = "") => {
  const match = SHIPPING_PROVIDER_OPTIONS.find((option) => option.value === provider);

  return match?.label || provider || "-";
};

export const getLatestShipment = (shipments = []) => {
  return [...shipments].sort((left, right) => {
    return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
  })[0] || null;
};
