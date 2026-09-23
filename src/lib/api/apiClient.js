import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable");
}

const API_BASE_URL = apiBaseUrl.replace(/\/$/, "").replace(/\/api$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthHeaders = (authToken, message = "Please sign in again.") => {
  if (!authToken) {
    throw new Error(message);
  }

  return {
    Authorization: `Bearer ${authToken}`,
  };
};

const getApiErrorMessage = (error, fallbackMessage = "Request failed.") => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.details?.[0]?.message ||
    error?.message ||
    fallbackMessage
  );
};

const apiRequest = async ({
  authMessage,
  authToken,
  data,
  errorMessage = "Request failed.",
  headers,
  method = "GET",
  requireAuth = true,
  url,
}) => {
  const authHeaders = requireAuth ? getAuthHeaders(authToken, authMessage) : {};

  try {
    const response = await apiClient.request({
      data,
      headers: {
        ...authHeaders,
        ...headers,
      },
      method,
      url,
    });

    return response.data;
  } catch (error) {
    const wrappedError = new Error(getApiErrorMessage(error, errorMessage));

    wrappedError.response = error.response;
    throw wrappedError;
  }
};

export {
  API_BASE_URL,
  apiClient,
  apiRequest,
  getApiErrorMessage,
  getAuthHeaders,
};

export default apiClient;
