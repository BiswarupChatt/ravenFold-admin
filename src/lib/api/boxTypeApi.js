import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage box types.";
const ERROR_MESSAGE = "Box type request failed.";

export const fetchAdminBoxTypes = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/box-types/admin${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createBoxType = async (authToken, boxTypePayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: boxTypePayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/box-types/admin",
  });
};

export const updateBoxType = async (authToken, boxTypeId, boxTypePayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: boxTypePayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/box-types/admin/${boxTypeId}`,
  });
};

export const deleteBoxType = async (authToken, boxTypeId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/box-types/admin/${boxTypeId}`,
  });
};
