import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage fulfilment.";
const ERROR_MESSAGE = "Shipping request failed.";

export const markAdminOrderPacked = async (authToken, orderId, payload = {}) => {
  const response = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: payload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/shipping/admin/orders/${orderId}/pack`,
  });

  return response?.data || null;
};

export const createAdminProviderOrder = async (authToken, orderId, payload = {}) => {
  const response = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: payload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/shipping/admin/orders/${orderId}/provider-order`,
  });

  return response?.data || null;
};

export const syncAdminShipmentTracking = async (authToken, shipmentId, payload = {}) => {
  const response = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: payload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/shipping/admin/shipments/${shipmentId}/sync-tracking`,
  });

  return response?.data || null;
};
