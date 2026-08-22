import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage payments.";
const ERROR_MESSAGE = "Payment request failed.";

const unwrapListResponse = (payload, params = {}) => {
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminPayments = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/payments/admin/payments${buildQueryString(params)}`,
  });

  return unwrapListResponse(payload, params);
};

export const fetchAdminPaymentAttempts = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/payments/admin/attempts${buildQueryString(params)}`,
  });

  return unwrapListResponse(payload, params);
};

export const fetchAdminRefunds = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/payments/refunds/admin${buildQueryString(params)}`,
  });

  return unwrapListResponse(payload, params);
};

export const createAdminRefund = async (authToken, refundData) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: refundData,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/payments/refunds/admin",
  });

  return payload?.data || null;
};
