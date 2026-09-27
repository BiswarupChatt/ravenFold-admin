import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage storefront pages.";
const ERROR_MESSAGE = "Storefront page request failed.";

export const fetchAdminHomePage = async (authToken) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: "/api/storefront-pages/admin/home",
  });

  return payload?.data || null;
};

export const updateAdminHomePage = async (authToken, pagePayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: pagePayload,
    errorMessage: ERROR_MESSAGE,
    method: "PUT",
    url: "/api/storefront-pages/admin/home",
  });
};
