import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Announcement banner request failed.";
  } catch {
    return "Announcement banner request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage announcement banners.");
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

export const fetchAdminAnnouncementBanners = async (authToken, params = {}) => {
  const response = await fetch(
    `${API_BASE_URL}/api/announcement-banners${buildQueryString(params)}`,
    {
      headers: getAuthHeaders(authToken),
    },
  );
  const payload = await unwrapResponse(response);
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createAnnouncementBanner = async (authToken, bannerPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/announcement-banners`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(bannerPayload),
  });

  return unwrapResponse(response);
};

export const updateAnnouncementBanner = async (authToken, bannerId, bannerPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/announcement-banners/${bannerId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(bannerPayload),
  });

  return unwrapResponse(response);
};

export const updateAnnouncementBannerStatus = async (authToken, bannerId, isActive) => {
  const response = await fetch(`${API_BASE_URL}/api/announcement-banners/${bannerId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify({ isActive }),
  });

  return unwrapResponse(response);
};

export const deleteAnnouncementBanner = async (authToken, bannerId) => {
  const response = await fetch(`${API_BASE_URL}/api/announcement-banners/${bannerId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  return unwrapResponse(response);
};
