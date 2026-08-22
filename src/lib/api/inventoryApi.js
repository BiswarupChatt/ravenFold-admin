import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage inventory.";
const ERROR_MESSAGE = "Inventory request failed.";

const parseInventoryListResponse = (payload, fallbackParams = {}) => {
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, fallbackParams),
  };
};

const parseSingleInventoryResponse = (payload) => payload?.data || null;

export const fetchAdminInventoryStocks = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/inventory/admin${buildQueryString(params)}`,
  });

  return parseInventoryListResponse(payload, params);
};

export const fetchAdminInventoryStockForTarget = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/inventory/admin/item${buildQueryString(params)}`,
  });

  return parseSingleInventoryResponse(payload);
};

export const createInventoryStock = async (authToken, stockPayload) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: stockPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/inventory/admin",
  });

  return parseSingleInventoryResponse(payload);
};

export const updateInventoryStock = async (authToken, inventoryStockId, stockPayload) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: stockPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/inventory/admin/${inventoryStockId}`,
  });

  return parseSingleInventoryResponse(payload);
};

export const deleteInventoryStock = async (authToken, inventoryStockId) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/inventory/admin/${inventoryStockId}`,
  });

  return parseSingleInventoryResponse(payload);
};

export const adjustInventoryStock = async (authToken, adjustmentPayload) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: adjustmentPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/inventory/admin/adjust",
  });

  return parseSingleInventoryResponse(payload);
};

export const reserveInventoryStock = async (authToken, reservationPayload) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: reservationPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/inventory/admin/reserve",
  });

  return parseSingleInventoryResponse(payload);
};

export const releaseInventoryReservation = async (authToken, reservationPayload) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: reservationPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/inventory/admin/release",
  });

  return parseSingleInventoryResponse(payload);
};

export const commitInventorySale = async (authToken, salePayload) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: salePayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/inventory/admin/commit",
  });

  return parseSingleInventoryResponse(payload);
};

export const fetchAdminStockMovements = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/inventory/movements/admin${buildQueryString(params)}`,
  });

  return parseInventoryListResponse(payload, params);
};
