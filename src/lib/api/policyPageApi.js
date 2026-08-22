import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to manage policy pages.";
const ERROR_MESSAGE = "Policy page request failed.";

export const fetchAdminPolicies = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/admin/policies${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminPolicy = async (authToken, policyIdOrSlug) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/admin/policies/${policyIdOrSlug}`,
  });

  return payload?.data || null;
};

export const createPolicy = async (authToken, policyPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: policyPayload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/admin/policies",
  });
};

export const updatePolicy = async (authToken, policyId, policyPayload) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: policyPayload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: `/api/admin/policies/${policyId}`,
  });
};

export const publishPolicy = async (authToken, policyId, payload = {}) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: payload,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/admin/policies/${policyId}/publish`,
  });
};

export const unpublishPolicy = async (authToken, policyId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/admin/policies/${policyId}/unpublish`,
  });
};

export const deletePolicy = async (authToken, policyId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "DELETE",
    url: `/api/admin/policies/${policyId}`,
  });
};

export const previewPolicy = async (authToken, policyIdOrSlug) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/admin/policies/${policyIdOrSlug}/preview`,
  });

  return payload?.data || null;
};

export const fetchPolicyVersions = async (authToken, policyId) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/admin/policies/${policyId}/versions`,
  });

  return Array.isArray(payload?.data) ? payload.data : [];
};

export const restorePolicyVersion = async (authToken, policyId, versionId) => {
  return apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/admin/policies/${policyId}/versions/${versionId}/restore`,
  });
};
