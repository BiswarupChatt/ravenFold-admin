import { buildQueryString, normalizePagination } from "@/lib/utils/adminShared";

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

const getCloudinaryErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.error?.message || "Cloudinary upload failed.";
  } catch (error) {
    return "Cloudinary upload failed.";
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

const getProductImageUploadSignature = async (authToken) => {
  const response = await fetch(`${API_BASE_URL}/api/products/uploads/cloudinary-signature`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return payload?.data || {};
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

export const uploadProductImages = async (authToken, files = []) => {
  const fileList = Array.from(files);

  if (fileList.length === 0) {
    return [];
  }

  const { apiKey, cloudName, params = {}, signature } = await getProductImageUploadSignature(authToken);

  if (!apiKey || !cloudName || !signature) {
    throw new Error("Cloudinary upload signature response is incomplete.");
  }

  return Promise.all(
    fileList.map(async (file) => {
      const formData = new FormData();

      formData.append("file", file);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });
      formData.append("api_key", apiKey);
      formData.append("signature", signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getCloudinaryErrorMessage(response));
      }

      const payload = await response.json();

      return {
        publicId: payload.public_id,
        url: payload.secure_url,
      };
    })
  );
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
