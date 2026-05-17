const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

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

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
};

const normalizePagination = (pagination = {}, fallbackParams = {}) => {
  const limit = Number(pagination.limit || fallbackParams.limit || 10);
  const page = Number(pagination.page || fallbackParams.page || 1);
  const total = Number(pagination.total || 0);

  return {
    page,
    limit,
    total,
    totalPages: Number(pagination.totalPages || Math.ceil(total / limit) || 0),
    hasNextPage: Boolean(pagination.hasNextPage),
    hasPrevPage: Boolean(pagination.hasPrevPage),
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
