import { Navigate } from "react-router-dom";

import ROUTES from "./routes";

import DashboardLayout from "../layout/dashboardLayout/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Products from "../pages/products/Products";
import Account from "../pages/account/Account";
import Settings from "../pages/settings/Settings";
import NotFound from "../pages/NotFound";

// Auth layout / pages
import AuthLayout from "../layout/authLayout/AuthLayout";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/SignUp";

export const appRoutes = [
  {
    path: "/",
    element: (
      <DashboardLayout />
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.ROOT} replace /> },
      { path: ROUTES.ROOT.slice(1), element: <Dashboard /> },
      { path: ROUTES.PRODUCTS.slice(1), element: <Products /> },
      { path: ROUTES.ACCOUNT.slice(1), element: <Account /> },
      { path: ROUTES.SETTINGS.slice(1), element: <Settings /> },
      { path: ROUTES.NOT_FOUND, element: <NotFound /> },
    ],
  },
  {
    path: "/auth",
    element: (
      // <RedirectIfAuth>
      <AuthLayout />
      // </RedirectIfAuth>
    ),
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: "login", element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "*", element: <Navigate to="login" replace /> },
    ],
  },
  // fallback
  { path: "*", element: <NotFound /> },
];
