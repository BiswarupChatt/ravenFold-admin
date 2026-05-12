const FRONTEND_ADMIN = {
  username: "admin",
  password: "admin",
  token: "frontend-admin-token",
  user: {
    id: "frontend-admin",
    email: "admin@example.com",
    name: "Admin",
    role: "admin",
  },
};

export const loginWithFrontendUser = async (username, password) => {
  const normalizedUsername = username.trim();

  if (
    normalizedUsername !== FRONTEND_ADMIN.username ||
    password !== FRONTEND_ADMIN.password
  ) {
    throw new Error("Invalid credentials. Use admin / admin for now.");
  }

  return {
    token: FRONTEND_ADMIN.token,
    admin: FRONTEND_ADMIN.user,
  };
};

export const resetPassword = async (oldPassword, newPassword) => {
  if (!oldPassword || !newPassword) {
    throw new Error("Please fill in all fields.");
  }

  return {
    success: true,
    message: "Password updated locally.",
  };
};
