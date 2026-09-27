import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage storefront settings.";
const ERROR_MESSAGE = "Storefront settings request failed.";

export const fetchAdminSiteSettings = async (authToken) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: "/api/site-settings/admin",
  });

  return payload?.data || null;
};

export const updateSiteSettings = async (authToken, settingsPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: settingsPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PUT",
    url: "/api/site-settings/admin",
  });
};
