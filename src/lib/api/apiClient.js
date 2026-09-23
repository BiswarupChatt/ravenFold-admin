import axios from "axios";

import { BROWSER_STORAGE_KEYS } from "@/utils/constants/browserStorageKeys";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable");
}

const API_BASE_URL = apiBaseUrl.replace(/\/$/, "").replace(/\/api$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});
const AUTH_EXPIRED_EVENT = "admin-auth-expired";

const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(BROWSER_STORAGE_KEYS.authToken);
  window.localStorage.removeItem(BROWSER_STORAGE_KEYS.userData);
  window.localStorage.setItem(BROWSER_STORAGE_KEYS.isAuthenticated, JSON.stringify(false));
};

const isAuthExpiredResponse = (error) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || error?.message || "").toLowerCase();

  return status === 401 && (
    message.includes("jwt expired")
    || message.includes("token expired")
    || message.includes("authentication token expired")
    || message.includes("invalid token")
  );
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthExpiredResponse(error)) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

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
  AUTH_EXPIRED_EVENT,
  apiClient,
  apiRequest,
  getApiErrorMessage,
  getAuthHeaders,
};

export default apiClient;
