import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Cart request failed.";
  } catch (error) {
    return "Cart request failed.";
  }
};

const getAuthHeaders = (authToken) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage carts.");
  }

  return {
    Authorization: `Bearer ${authToken}`,
  };
};

export const fetchAdminCarts = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/admin${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminCart = async (authToken, cartId) => {
  const response = await fetch(`${API_BASE_URL}/api/cart/admin/${cartId}`, {
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return payload?.data || null;
};
