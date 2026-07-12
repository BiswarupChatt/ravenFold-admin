import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Promotion request failed.";
  } catch {
    return "Promotion request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage promotions.");
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

export const fetchAdminPromotions = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/promotions${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await unwrapResponse(response);
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createPromotion = async (authToken, promotionPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/promotions`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(promotionPayload),
  });

  return unwrapResponse(response);
};

export const updatePromotion = async (authToken, promotionId, promotionPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/promotions/${promotionId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(promotionPayload),
  });

  return unwrapResponse(response);
};

export const updatePromotionStatus = async (authToken, promotionId, isActive) => {
  const response = await fetch(`${API_BASE_URL}/api/promotions/${promotionId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify({ isActive }),
  });

  return unwrapResponse(response);
};

export const deletePromotion = async (authToken, promotionId) => {
  const response = await fetch(`${API_BASE_URL}/api/promotions/${promotionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  return unwrapResponse(response);
};
