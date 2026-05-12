const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const PRODUCTS_ENDPOINT = `${API_BASE_URL}/api/products`;

export const PRODUCT_STATUSES = ["active", "inactive", "draft", "archived"];
export const PRODUCT_TYPES = ["simple", "variable", "digital", "bundle"];

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const getErrorMessage = (payload, response) => {
  if (payload?.details && Array.isArray(payload.details)) {
    return payload.details.join(", ");
  }

  return payload?.message || `Request failed with status ${response.status}`;
};

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(getErrorMessage(payload, response));
  }

  return payload?.data ?? payload;
};

export const fetchProducts = async (params = {}) => {
  const response = await fetch(`${PRODUCTS_ENDPOINT}${buildQueryString(params)}`);
  return parseResponse(response);
};

export const fetchProduct = async (productId) => {
  const response = await fetch(`${PRODUCTS_ENDPOINT}/${encodeURIComponent(productId)}`);
  return parseResponse(response);
};

export const updateProduct = async (productId, payload, token) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${PRODUCTS_ENDPOINT}/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};
