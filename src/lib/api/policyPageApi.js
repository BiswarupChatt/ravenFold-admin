import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Policy page request failed.";
  } catch {
    return "Policy page request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage policy pages.");
  }

  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${authToken}`,
  };
};

const unwrapResponse = async (response) => {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
};

export const fetchAdminPolicies = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await unwrapResponse(response);
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const fetchAdminPolicy = async (authToken, policyIdOrSlug) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyIdOrSlug}`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await unwrapResponse(response);

  return payload?.data || null;
};

export const createPolicy = async (authToken, policyPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(policyPayload),
  });

  return unwrapResponse(response);
};

export const updatePolicy = async (authToken, policyId, policyPayload) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyId}`, {
    method: "PATCH",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(policyPayload),
  });

  return unwrapResponse(response);
};

export const publishPolicy = async (authToken, policyId, payload = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyId}/publish`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify(payload),
  });

  return unwrapResponse(response);
};

export const unpublishPolicy = async (authToken, policyId) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyId}/unpublish`, {
    method: "POST",
    headers: getAuthHeaders(authToken),
  });

  return unwrapResponse(response);
};

export const deletePolicy = async (authToken, policyId) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyId}`, {
    method: "DELETE",
    headers: getAuthHeaders(authToken),
  });

  return unwrapResponse(response);
};

export const previewPolicy = async (authToken, policyIdOrSlug) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyIdOrSlug}/preview`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await unwrapResponse(response);

  return payload?.data || null;
};

export const fetchPolicyVersions = async (authToken, policyId) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyId}/versions`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await unwrapResponse(response);

  return Array.isArray(payload?.data) ? payload.data : [];
};

export const restorePolicyVersion = async (authToken, policyId, versionId) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/policies/${policyId}/versions/${versionId}/restore`, {
    method: "POST",
    headers: getAuthHeaders(authToken),
  });

  return unwrapResponse(response);
};
