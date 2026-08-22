import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";
import { uploadImages } from "@/lib/api/uploadApi";

const AUTH_MESSAGE = "Please sign in again to manage products.";
const ERROR_MESSAGE = "Product request failed.";

export const fetchAdminProducts = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/products/admin${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminProduct = async (authToken, productIdOrSlug) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/products/admin/${productIdOrSlug}`,
  });

  return payload?.data || null;
};

export const uploadProductImages = async (authToken, files = []) => {
  return uploadImages(authToken, files, "product");
};

export const createProduct = async (authToken, productPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: productPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/products",
  });
};

export const updateProduct = async (authToken, productId, productPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: productPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/products/${productId}`,
  });
};

export const deleteProduct = async (authToken, productId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/products/${productId}`,
  });
};

export const fetchProductOptions = async (authToken, productId) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/products/${productId}/options`,
  });

  return Array.isArray(payload?.data) ? payload.data : [];
};

export const createProductOption = async (authToken, productId, optionPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: optionPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/products/${productId}/options`,
  });
};

export const updateProductOption = async (authToken, productId, optionId, optionPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: optionPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/products/${productId}/options/${optionId}`,
  });
};

export const deleteProductOption = async (authToken, productId, optionId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/products/${productId}/options/${optionId}`,
  });
};

export const createProductOptionValue = async (authToken, productId, optionId, valuePayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: valuePayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/products/${productId}/options/${optionId}/values`,
  });
};

export const updateProductOptionValue = async (authToken, productId, optionId, valueId, valuePayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: valuePayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/products/${productId}/options/${optionId}/values/${valueId}`,
  });
};

export const deleteProductOptionValue = async (authToken, productId, optionId, valueId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/products/${productId}/options/${optionId}/values/${valueId}`,
  });
};

export const fetchAdminProductVariants = async (authToken, productId, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/products/${productId}/variants/admin${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const createProductVariant = async (authToken, productId, variantPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: variantPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/products/${productId}/variants`,
  });
};

export const updateProductVariant = async (authToken, productId, variantId, variantPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: variantPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/products/${productId}/variants/${variantId}`,
  });
};

export const deleteProductVariant = async (authToken, productId, variantId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/products/${productId}/variants/${variantId}`,
  });
};
