import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Payment request failed.";
  } catch {
    return "Payment request failed.";
  }
};

const getAuthHeaders = (authToken) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage payments.");
  }

  return {
    Authorization: `Bearer ${authToken}`,
  };
};

const unwrapListResponse = async (response, params = {}) => {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminPayments = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/payments/admin/payments${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  return unwrapListResponse(response, params);
};

export const fetchAdminPaymentAttempts = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/payments/admin/attempts${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  return unwrapListResponse(response, params);
};

export const fetchAdminRefunds = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/payments/refunds/admin${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  return unwrapListResponse(response, params);
};

export const createAdminRefund = async (authToken, refundData) => {
  const response = await fetch(`${API_BASE_URL}/api/payments/refunds/admin`, {
    body: JSON.stringify(refundData),
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return payload?.data || null;
};
