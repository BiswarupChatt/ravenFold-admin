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

export const createAdminProviderOrder = async (authToken, orderId, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/orders/${orderId}/provider-order`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    method: "POST",
  });

  return unwrapResponse(response);
};

export const syncAdminShipmentTracking = async (authToken, shipmentId, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/shipping/admin/shipments/${shipmentId}/sync-tracking`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(authToken),
    },
    method: "POST",
  });

  return unwrapResponse(response);
};
