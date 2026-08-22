import { apiRequest } from "@/lib/api/apiClient";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

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
  try {
    const payload = await apiRequest({
      data: {
      email: email.trim(),
      ...(mfaCode.trim() ? { mfaCode: mfaCode.trim() } : {}),
      password,
      },
      errorMessage: "Login failed. Please try again.",
      method: "POST",
      requireAuth: false,
      url: "/api/auth/admin/login",
    });

    return normalizeAuthResponse(payload);
  } catch (error) {
    error.mfaRequired = Boolean(error?.response?.data?.details?.mfaRequired);
    throw error;
  }
};

export const loginWithFrontendUser = loginWithAdminUser;

export const resetPassword = async (authToken, oldPassword, newPassword) => {
  if (!authToken) {
    throw new Error("Authentication required.");
  }

  if (!oldPassword || !newPassword) {
    throw new Error("Please fill in all fields.");
  }

  const payload = await apiRequest({
    authMessage: "Authentication required.",
    authToken,
    data: {
      currentPassword: oldPassword,
      newPassword,
    },
    errorMessage: "Failed to reset password.",
    method: "POST",
    url: "/api/auth/change-password",
  });

  return {
    success: payload?.success ?? true,
    message: payload?.message || "Password updated successfully.",
  };
};

export const getAdminMfaStatus = async (authToken) => {
  const payload = await apiRequest({
    authMessage: "Authentication required.",
    authToken,
    errorMessage: "Failed to fetch MFA status.",
    url: "/api/auth/admin/mfa",
  });

  return payload?.data || { enabled: false, pendingSetup: false };
};

export const createAdminMfaSetup = async (authToken) => {
  const payload = await apiRequest({
    authMessage: "Authentication required.",
    authToken,
    errorMessage: "Failed to start MFA setup.",
    method: "POST",
    url: "/api/auth/admin/mfa/setup",
  });

  return payload?.data || null;
};

export const enableAdminMfa = async (authToken, code) => {
  const payload = await apiRequest({
    authMessage: "Authentication required.",
    authToken,
    data: { code },
    errorMessage: "Failed to enable MFA.",
    method: "POST",
    url: "/api/auth/admin/mfa/enable",
  });

  return payload?.data || { enabled: true };
};

export const disableAdminMfa = async (authToken, code) => {
  const payload = await apiRequest({
    authMessage: "Authentication required.",
    authToken,
    data: { code },
    errorMessage: "Failed to disable MFA.",
    method: "POST",
    url: "/api/auth/admin/mfa/disable",
  });

  return payload?.data || { enabled: false };
};
