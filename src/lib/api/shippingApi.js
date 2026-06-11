import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Shipping request failed.";
  } catch {
    return "Shipping request failed.";
  }
};

const getAuthHeaders = (authToken) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage fulfilment.");
  }

  return {
    Authorization: `Bearer ${authToken}`,
  };
};

const unwrapResponse = async (response) => {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return payload?.data || null;
};

const unwrapListResponse = async (response, fallbackParams = {}) => {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, fallbackParams),
  };
};

export const fetchAdminPickupLocations = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/pickup-locations${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  return unwrapListResponse(response, params);
};

export const createPickupLocation = async (authToken, locationPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/pickup-locations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    body: JSON.stringify(locationPayload),
  });

  return unwrapResponse(response);
};

export const updatePickupLocation = async (authToken, pickupLocationId, locationPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/pickup-locations/${pickupLocationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    body: JSON.stringify(locationPayload),
  });

  return unwrapResponse(response);
};

export const deletePickupLocation = async (authToken, pickupLocationId) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/pickup-locations/${pickupLocationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  return unwrapResponse(response);
};

export const markAdminOrderPacked = async (authToken, orderId, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/orders/${orderId}/pack`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    method: "POST",
  });

  return unwrapResponse(response);
};

export const createAdminShipment = async (authToken, orderId, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/orders/${orderId}/shipments`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    method: "POST",
  });

  return unwrapResponse(response);
};

export const updateAdminShipmentStatus = async (authToken, shipmentId, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/shipments/${shipmentId}/status`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    method: "PATCH",
  });

  return unwrapResponse(response);
};

export const cancelAdminShipment = async (authToken, shipmentId, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/shipments/${shipmentId}/cancel`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    method: "POST",
  });

  return unwrapResponse(response);
};
