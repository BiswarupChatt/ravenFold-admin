import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { uploadImages } from "@/lib/api/uploadApi";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Product request failed.";
  } catch (error) {
    return "Product request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage products.");
  }

  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${authToken}`,
  };
};

export const fetchAdminProducts = async (authToken, params = {}) => {
  const response = await fetch(
    `${API_BASE_URL}/api/products/admin${buildQueryString(params)}`,
    {
      headers: getAuthHeaders(authToken),
    }
  );

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

export const fetchAdminProduct = async (authToken, productIdOrSlug) => {
  const response = await fetch(`${API_BASE_URL}/api/products/admin/${productIdOrSlug}`, {
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return payload?.data || null;
};

export const uploadProductImages = async (authToken, files = []) => {
  return uploadImages(authToken, files, "product");
};

export const createProduct = async (authToken, productPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(productPayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const updateProduct = async (authToken, productId, productPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(productPayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const deleteProduct = async (authToken, productId) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const fetchProductOptions = async (authToken, productId) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options`, {
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return Array.isArray(payload?.data) ? payload.data : [];
};

export const createProductOption = async (authToken, productId, optionPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(optionPayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const updateProductOption = async (authToken, productId, optionId, optionPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options/${optionId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(optionPayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const deleteProductOption = async (authToken, productId, optionId) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options/${optionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const createProductOptionValue = async (authToken, productId, optionId, valuePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options/${optionId}/values`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(valuePayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const updateProductOptionValue = async (authToken, productId, optionId, valueId, valuePayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options/${optionId}/values/${valueId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(valuePayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const deleteProductOptionValue = async (authToken, productId, optionId, valueId) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/options/${optionId}/values/${valueId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const fetchAdminProductVariants = async (authToken, productId, params = {}) => {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/variants/admin${buildQueryString(params)}`,
    {
      headers: getAuthHeaders(authToken),
    }
  );

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

export const createProductVariant = async (authToken, productId, variantPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/variants`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(variantPayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const updateProductVariant = async (authToken, productId, variantId, variantPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/variants/${variantId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(variantPayload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const deleteProductVariant = async (authToken, productId, variantId) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/variants/${variantId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};
