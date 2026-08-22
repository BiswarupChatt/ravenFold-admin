import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage promotions.";
const ERROR_MESSAGE = "Promotion request failed.";

export const fetchAdminPromotions = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/promotions${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createPromotion = async (authToken, promotionPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: promotionPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/promotions",
  });
};

export const updatePromotion = async (authToken, promotionId, promotionPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: promotionPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/promotions/${promotionId}`,
  });
};

export const updatePromotionStatus = async (authToken, promotionId, isActive) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: { isActive },
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/promotions/${promotionId}/status`,
  });
};

export const deletePromotion = async (authToken, promotionId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/promotions/${promotionId}`,
  });
};
