import { buildQueryString, normalizePagination } from "@/lib/utils/adminShared";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Inventory request failed.";
  } catch (error) {
    return "Inventory request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage inventory.");
  }

  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${authToken}`,
  };
};

const parseInventoryListResponse = async (response, fallbackParams = {}) => {
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

const parseSingleInventoryResponse = async (response) => {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return payload?.data || null;
};

export const fetchAdminInventoryStocks = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  return parseInventoryListResponse(response, params);
};

export const fetchAdminInventoryStockForTarget = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin/item${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  return parseSingleInventoryResponse(response);
};

export const createInventoryStock = async (authToken, stockPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(stockPayload),
  });

  return parseSingleInventoryResponse(response);
};

export const updateInventoryStock = async (authToken, inventoryStockId, stockPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin/${inventoryStockId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(stockPayload),
  });

  return parseSingleInventoryResponse(response);
};

export const deleteInventoryStock = async (authToken, inventoryStockId) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin/${inventoryStockId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  return parseSingleInventoryResponse(response);
};

export const adjustInventoryStock = async (authToken, adjustmentPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin/adjust`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(adjustmentPayload),
  });

  return parseSingleInventoryResponse(response);
};

export const reserveInventoryStock = async (authToken, reservationPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin/reserve`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(reservationPayload),
  });

  return parseSingleInventoryResponse(response);
};

export const releaseInventoryReservation = async (authToken, reservationPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin/release`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(reservationPayload),
  });

  return parseSingleInventoryResponse(response);
};

export const commitInventorySale = async (authToken, salePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/admin/commit`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(salePayload),
  });

  return parseSingleInventoryResponse(response);
};

export const fetchAdminStockMovements = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/inventory/movements/admin${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  return parseInventoryListResponse(response, params);
};
