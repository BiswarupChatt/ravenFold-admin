import { apiRequest } from "@/lib/api/apiClient";
import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const AUTH_MESSAGE = "Please sign in again to manage leads.";
const ERROR_MESSAGE = "Lead request failed.";

export const fetchAdminLeads = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/leads/admin${buildQueryString(params)}`,
  });
  const data = payload?.data || {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};
