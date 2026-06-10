import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Box type request failed.";
  } catch {
    return "Box type request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage box types.");
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

export const fetchAdminBoxTypes = async (authToken, params = {}) => {
  const response = await fetch(
    `${API_BASE_URL}/api/box-types/admin${buildQueryString(params)}`,
    {
      headers: getAuthHeaders(authToken),
    }
  );

  const payload = await unwrapResponse(response);
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createBoxType = async (authToken, boxTypePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/box-types/admin`, {
    body: JSON.stringify(boxTypePayload),
    headers: getAuthHeaders(authToken, true),
    method: "POST",
  });

  return unwrapResponse(response);
};

export const updateBoxType = async (authToken, boxTypeId, boxTypePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/box-types/admin/${boxTypeId}`, {
    body: JSON.stringify(boxTypePayload),
    headers: getAuthHeaders(authToken, true),
    method: "PATCH",
  });

  return unwrapResponse(response);
};

export const deleteBoxType = async (authToken, boxTypeId) => {
  const response = await fetch(`${API_BASE_URL}/api/box-types/admin/${boxTypeId}`, {
    headers: getAuthHeaders(authToken),
    method: "DELETE",
  });

  return unwrapResponse(response);
};
