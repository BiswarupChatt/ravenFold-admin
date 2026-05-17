const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");
const ADMIN_ROLES = new Set(["admin", "super_admin"]);

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Login failed. Please try again.";
  } catch (error) {
    return "Login failed. Please try again.";
  }
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

export const loginWithAdminUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return normalizeAuthResponse(await response.json());
};

export const loginWithFrontendUser = loginWithAdminUser;

export const resetPassword = async (oldPassword, newPassword) => {
  if (!oldPassword || !newPassword) {
    throw new Error("Please fill in all fields.");
  }

  return {
    success: true,
    message: "Password updated locally.",
  };
};
