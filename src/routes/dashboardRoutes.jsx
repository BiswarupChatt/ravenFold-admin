import { lazy } from "react";
import { Navigate } from "react-router-dom";

import ROUTES from "./routes";

const DashboardLayout = lazy(() => import("../layout/dashboardLayout/DashboardLayout"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Account = lazy(() => import("../pages/account/Account"));
const Category = lazy(() => import("../pages/other/category/Category"));
const Product = lazy(() => import("../pages/product/Product"));
const ProductDetailsPage = lazy(() => import("../pages/product/ProductDetailsPage"));
const Inventory = lazy(() => import("../pages/inventory/Inventory"));
const Cart = lazy(() => import("../pages/other/cart/Cart"));
const Order = lazy(() => import("../pages/order/Order"));
const Gst = lazy(() => import("../pages/gst/Gst"));
const Payment = lazy(() => import("../pages/other/payment/Payment"));
const Other = lazy(() => import("../pages/other/Other"));
const BoxTypes = lazy(() => import("../pages/other/boxTypes/BoxTypes"));
const Coupon = lazy(() => import("../pages/other/coupon/Coupon"));
const AnnouncementBanner = lazy(() => import("../pages/other/announcementBanner/AnnouncementBanner"));
const Review = lazy(() => import("../pages/other/review/Review"));
const Customer = lazy(() => import("../pages/customer/Customer"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Auth layout / pages
const AuthLayout = lazy(() => import("../layout/authLayout/AuthLayout"));
const Login = lazy(() => import("../pages/auth/Login"));
const Signup = lazy(() => import("../pages/auth/SignUp"));

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
      { path: ROUTES.GST.slice(1), element: <Gst /> },
      { path: ROUTES.PAYMENT.slice(1), element: <Navigate to={ROUTES.OTHER_PAYMENT} replace /> },
      { path: ROUTES.OTHER_PAYMENT.slice(1), element: <Payment /> },
      { path: ROUTES.OTHER.slice(1), element: <Other /> },
      { path: ROUTES.OTHER_COUPON.slice(1), element: <Coupon /> },
      { path: ROUTES.OTHER_ANNOUNCEMENT_BANNERS.slice(1), element: <AnnouncementBanner /> },
      { path: ROUTES.OTHER_REVIEW.slice(1), element: <Review /> },
      { path: ROUTES.OTHER_BOX_TYPES.slice(1), element: <BoxTypes /> },
      { path: ROUTES.CUSTOMER.slice(1), element: <Customer /> },
      { path: ROUTES.ACCOUNT.slice(1), element: <Account /> },
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
