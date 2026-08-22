import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage announcement banners.";
const ERROR_MESSAGE = "Announcement banner request failed.";

export const fetchAdminAnnouncementBanners = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/announcement-banners${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createAnnouncementBanner = async (authToken, bannerPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: bannerPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/announcement-banners",
  });
};

export const updateAnnouncementBanner = async (authToken, bannerId, bannerPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: bannerPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/announcement-banners/${bannerId}`,
  });
};

export const updateAnnouncementBannerStatus = async (authToken, bannerId, isActive) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: { isActive },
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/announcement-banners/${bannerId}/status`,
  });
};

export const deleteAnnouncementBanner = async (authToken, bannerId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/announcement-banners/${bannerId}`,
  });
};
