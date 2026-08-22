import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage orders.";
const ERROR_MESSAGE = "Order request failed.";

export const fetchAdminOrders = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/orders/admin${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminOrder = async (authToken, orderId) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/orders/admin/${orderId}`,
  });

  return payload?.data || null;
};

export const updateAdminOrderStatus = async (authToken, orderId, payload = {}) => {
  const responsePayload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: payload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/orders/admin/${orderId}/status`,
  });

  return responsePayload?.data || null;
};
