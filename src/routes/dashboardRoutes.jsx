import { Navigate } from "react-router-dom";

import ROUTES from "./routes";

import DashboardLayout from "../layout/dashboardLayout/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Account from "../pages/account/Account";
import Settings from "../pages/settings/Settings";
import Category from "../pages/other/category/Category";
import Product from "../pages/product/Product";
import ProductDetailsPage from "../pages/product/ProductDetailsPage";
import Inventory from "../pages/inventory/Inventory";
import Cart from "../pages/other/cart/Cart";
import Order from "../pages/order/Order";
import Payment from "../pages/other/payment/Payment";
import Other from "../pages/other/Other";
import BoxTypes from "../pages/other/boxTypes/BoxTypes";
import Coupon from "../pages/other/coupon/Coupon";
import PickupLocations from "../pages/other/pickupLocations/PickupLocations";
import Review from "../pages/other/review/Review";
import Customer from "../pages/customer/Customer";
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
      { path: ROUTES.CATEGORY.slice(1), element: <Navigate to={ROUTES.OTHER_CATEGORY} replace /> },
      { path: ROUTES.OTHER_CATEGORY.slice(1), element: <Category /> },
      { path: `${ROUTES.PRODUCT.slice(1)}/new`, element: <ProductDetailsPage mode="create" /> },
      { path: `${ROUTES.PRODUCT.slice(1)}/:productId/edit`, element: <ProductDetailsPage mode="edit" /> },
      { path: `${ROUTES.PRODUCT.slice(1)}/:productId`, element: <ProductDetailsPage mode="view" /> },
      { path: ROUTES.PRODUCT.slice(1), element: <Product /> },
      { path: ROUTES.INVENTORY.slice(1), element: <Inventory /> },
      { path: ROUTES.CART.slice(1), element: <Navigate to={ROUTES.OTHER_CART} replace /> },
      { path: ROUTES.OTHER_CART.slice(1), element: <Cart /> },
      { path: ROUTES.ORDER.slice(1), element: <Order /> },
      { path: ROUTES.PAYMENT.slice(1), element: <Navigate to={ROUTES.OTHER_PAYMENT} replace /> },
      { path: ROUTES.OTHER_PAYMENT.slice(1), element: <Payment /> },
      { path: ROUTES.OTHER.slice(1), element: <Other /> },
      { path: ROUTES.OTHER_COUPON.slice(1), element: <Coupon /> },
      { path: ROUTES.OTHER_REVIEW.slice(1), element: <Review /> },
      { path: ROUTES.OTHER_BOX_TYPES.slice(1), element: <BoxTypes /> },
      { path: ROUTES.OTHER_PICKUP_LOCATIONS.slice(1), element: <PickupLocations /> },
      { path: ROUTES.CUSTOMER.slice(1), element: <Customer /> },
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
