const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");
const ADMIN_ROLES = new Set(["admin", "super_admin"]);

const getErrorPayload = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const getErrorMessage = (payload, fallback = "Login failed. Please try again.") => (
  payload?.message || fallback
);

const getAuthHeaders = (authToken, hasBody = false) => {
  if (!authToken) {
    throw new Error("Authentication required.");
  }

  return {
    Authorization: `Bearer ${authToken}`,
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };
};

const normalizeAuthResponse = (payload) => {
  const token = payload?.data?.token;
  const user = payload?.data?.user;
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);

  if (!token || !user) {
    throw new Error("Invalid login response from server.");
  }

  if (!roles.some((role) => ADMIN_ROLES.has(role))) {
    throw new Error("This account does not have admin access.");
  }

  return {
    token,
    admin: {
      ...user,
      roles,
    },
  };
};

export const loginWithAdminUser = async (email, password, mfaCode = "") => {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      ...(mfaCode.trim() ? { mfaCode: mfaCode.trim() } : {}),
      password,
    }),
  });

  if (!response.ok) {
    const payload = await getErrorPayload(response);
    const error = new Error(getErrorMessage(payload));

    error.mfaRequired = Boolean(payload?.details?.mfaRequired);
    throw error;
  }

  return normalizeAuthResponse(await response.json());
};

export const loginWithFrontendUser = loginWithAdminUser;

export const resetPassword = async (authToken, oldPassword, newPassword) => {
  if (!authToken) {
    throw new Error("Authentication required.");
  }

  if (!oldPassword || !newPassword) {
    throw new Error("Please fill in all fields.");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify({
      currentPassword: oldPassword,
      newPassword,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to reset password.");
  }

  return {
    success: payload?.success ?? true,
    message: payload?.message || "Password updated successfully.",
  };
};

export const getAdminMfaStatus = async (authToken) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/mfa`, {
    headers: getAuthHeaders(authToken),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to fetch MFA status.");
  }

  return payload?.data || { enabled: false, pendingSetup: false };
};

export const createAdminMfaSetup = async (authToken) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/mfa/setup`, {
    method: "POST",
    headers: getAuthHeaders(authToken),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to start MFA setup.");
  }

  return payload?.data || null;
};

export const enableAdminMfa = async (authToken, code) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/mfa/enable`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify({ code }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to enable MFA.");
  }

  return payload?.data || { enabled: true };
};

export const disableAdminMfa = async (authToken, code) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/mfa/disable`, {
    method: "POST",
    headers: getAuthHeaders(authToken, true),
    body: JSON.stringify({ code }),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Failed to disable MFA.");
  }

  return payload?.data || { enabled: false };
};
