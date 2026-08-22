import { buildQueryString, normalizePagination } from "@/lib/utils/utils";
import { API_BASE_URL, apiClient, apiRequest, getApiErrorMessage, getAuthHeaders } from "@/lib/api/apiClient";
import { uploadImage } from "@/lib/api/uploadApi";

const AUTH_MESSAGE = "Please sign in again to manage GST settings.";
const ERROR_MESSAGE = "GST request failed.";

export const fetchGstConfiguration = async (authToken) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: "/api/gst/admin/config",
  });

  return payload?.data || {};
};

export const updateGstConfiguration = async (authToken, payload) => {
  const responsePayload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: payload,
    errorMessage: ERROR_MESSAGE,
    method: "PATCH",
    url: "/api/gst/admin/config",
  });

  return responsePayload?.data || {};
};

export const uploadGstImage = async (authToken, file) => {
  return uploadImage(authToken, file, "gst");
};

export const fetchAdminInvoices = async (authToken, params = {}) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    url: `/api/gst/admin/invoices${buildQueryString(params)}`,
  });
  const data = payload?.data || {};

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: normalizePagination(data.pagination, params),
  };
};

export const getAdminInvoiceDownloadUrl = (invoiceId) => (
  `${API_BASE_URL}/api/gst/admin/invoices/${invoiceId}/download`
);

export const fetchAdminInvoicePdfBlob = async (authToken, invoiceId) => {
  try {
    const response = await apiClient.get(`/api/gst/admin/invoices/${invoiceId}/download`, {
      headers: getAuthHeaders(authToken, AUTH_MESSAGE),
      responseType: "blob",
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, ERROR_MESSAGE));
  }
};

export const downloadAdminInvoice = async (authToken, invoiceId, invoiceNumber = "gst-invoice") => {
  const blob = await fetchAdminInvoicePdfBlob(authToken, invoiceId);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = `${invoiceNumber || "gst-invoice"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

export const sendAdminInvoiceEmail = async (authToken, invoiceId) => {
  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: `/api/gst/admin/invoices/${invoiceId}/email`,
  });

  return payload?.data || {};
};

export const downloadGstReport = async (authToken, params = {}) => {
  let blob;

  try {
    const response = await apiClient.get(`/api/gst/admin/invoices/export${buildQueryString(params)}`, {
      headers: getAuthHeaders(authToken, AUTH_MESSAGE),
      responseType: "blob",
    });

    blob = response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, ERROR_MESSAGE));
  }

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = "gst-report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};

export const getGstReportExportUrl = (params = {}) => (
  `${API_BASE_URL}/api/gst/admin/invoices/export${buildQueryString(params)}`
);
