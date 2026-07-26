import { buildQueryString, normalizePagination } from "@/lib/utils/utils";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "GST request failed.";
  } catch {
    return "GST request failed.";
  }
};

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Please sign in again to manage GST settings.");
  }

  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${authToken}`,
  };
};

export const fetchGstConfiguration = async (authToken) => {
  const response = await fetch(`${API_BASE_URL}/api/gst/admin/config`, {
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return payload?.data || {};
};

export const updateGstConfiguration = async (authToken, payload) => {
  const response = await fetch(`${API_BASE_URL}/api/gst/admin/config`, {
    body: JSON.stringify(payload),
    headers: getAuthHeaders(authToken, true),
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const responsePayload = await response.json();

  return responsePayload?.data || {};
};

export const fetchAdminInvoices = async (authToken, params = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/gst/admin/invoices${buildQueryString(params)}`, {
    headers: getAuthHeaders(authToken),
  });

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

export const getAdminInvoiceDownloadUrl = (invoiceId) => (
  `${API_BASE_URL}/api/gst/admin/invoices/${invoiceId}/download`
);

export const fetchAdminInvoicePdfBlob = async (authToken, invoiceId) => {
  const response = await fetch(getAdminInvoiceDownloadUrl(invoiceId), {
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.blob();
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

export const downloadGstReport = async (authToken, params = {}) => {
  const response = await fetch(getGstReportExportUrl(params), {
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const blob = await response.blob();
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
