import { apiRequest } from "@/lib/api/apiClient";
import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const AUTH_MESSAGE = "Please sign in again to manage popup campaigns.";
const ERROR_MESSAGE = "Popup campaign request failed.";

export const fetchAdminPopupCampaigns = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/popup-campaigns${buildQueryString(params)}`,
  });
  const data = payload?.data || {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createPopupCampaign = (authToken, campaignPayload) => apiRequest({
  authMessage: AUTH_MESSAGE,
  authToken,
  data: campaignPayload,
  errorMessage: ERROR_MESSAGE,
  method: "POST",
  url: "/api/popup-campaigns",
});

export const updatePopupCampaign = (authToken, campaignId, campaignPayload) => apiRequest({
  authMessage: AUTH_MESSAGE,
  authToken,
  data: campaignPayload,
  errorMessage: ERROR_MESSAGE,
  method: "PATCH",
  url: `/api/popup-campaigns/${campaignId}`,
});

export const updatePopupCampaignStatus = (authToken, campaignId, isActive) => apiRequest({
  authMessage: AUTH_MESSAGE,
  authToken,
  data: { isActive },
  errorMessage: ERROR_MESSAGE,
  method: "PATCH",
  url: `/api/popup-campaigns/${campaignId}/status`,
});

export const deletePopupCampaign = (authToken, campaignId) => apiRequest({
  authMessage: AUTH_MESSAGE,
  authToken,
  errorMessage: ERROR_MESSAGE,
  method: "DELETE",
  url: `/api/popup-campaigns/${campaignId}`,
});
