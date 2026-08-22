import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";
import { uploadImage } from "@/lib/api/uploadApi";

const AUTH_MESSAGE = "Please sign in again to manage categories.";
const ERROR_MESSAGE = "Category request failed.";

export const fetchAdminCategories = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/categories/admin${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminCategoryTree = async (authToken) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: "/api/categories/admin/tree",
  });

  return Array.isArray(payload?.data) ? payload.data : [];
};

export const createCategory = async (authToken, categoryPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: categoryPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/categories",
  });
};

export const updateCategory = async (authToken, categoryId, categoryPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: categoryPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/categories/${categoryId}`,
  });
};

export const deleteCategory = async (authToken, categoryId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/categories/${categoryId}`,
  });
};

export const uploadCategoryImage = async (authToken, file) => {
  return uploadImage(authToken, file, "category");
};
