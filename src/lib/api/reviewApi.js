import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Review request failed.";
  } catch {
    return "Review request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage reviews.");
  }

  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${authToken}`,
  };
};

const unwrapResponse = async (response) => {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const fetchAdminReviews = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/reviews${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await unwrapResponse(response);
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
    pendingCount: Number(data.pendingCount || 0),
  };
};

export const fetchAdminReview = async (authToken, reviewId) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await unwrapResponse(response);

  return payload?.data || null;
};

const mutateReview = async (authToken, reviewId, action, payload = null, method = "PATCH") => {
  const response = await fetch(`${API_BASE_URL}/api/admin/reviews/${reviewId}${action}`, {
    body: payload ? JSON.stringify(payload) : undefined,
    headers: getAuthHeaders(authToken, Boolean(payload)),
    method,
  });
  const result = await unwrapResponse(response);

  return result?.data || null;
};

export const approveAdminReview = async (authToken, reviewId, payload = {}) => {
  return mutateReview(authToken, reviewId, "/approve", payload);
};

export const rejectAdminReview = async (authToken, reviewId, payload = {}) => {
  return mutateReview(authToken, reviewId, "/reject", payload);
};

export const hideAdminReview = async (authToken, reviewId, payload = {}) => {
  return mutateReview(authToken, reviewId, "/hide", payload);
};

export const restoreAdminReview = async (authToken, reviewId) => {
  return mutateReview(authToken, reviewId, "/restore");
};

export const deleteAdminReview = async (authToken, reviewId) => {
  return mutateReview(authToken, reviewId, "", null, "DELETE");
};
