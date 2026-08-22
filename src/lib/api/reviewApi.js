import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage reviews.";
const ERROR_MESSAGE = "Review request failed.";

export const fetchAdminReviews = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/admin/reviews${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
    pendingCount: Number(data.pendingCount || 0),
  };
};

export const fetchAdminReview = async (authToken, reviewId) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/admin/reviews/${reviewId}`,
  });

  return payload?.data || null;
};

const mutateReview = async (authToken, reviewId, action, payload = null, method = "PATCH") => {
  const result = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: payload || undefined,
    errorMessage: ERROR_MESSAGE,
    method,
    url: `/api/admin/reviews/${reviewId}${action}`,
  });

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
