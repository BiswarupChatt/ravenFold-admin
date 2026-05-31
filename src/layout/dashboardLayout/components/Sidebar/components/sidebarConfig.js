// src/modules/.../SIDEBAR_ITEMS.js

import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import RateReviewIcon from "@mui/icons-material/RateReview";

import ROUTES from "../../../../../routes/routes";

export const SIDEBAR_ITEMS = [
  {
    name: "Dashboard",
    path: ROUTES.ROOT,
    icon: DashboardIcon,
  },
  {
    name: "Category",
    path: ROUTES.CATEGORY,
    icon: CategoryIcon,
  },
  {
    name: "Product",
    path: ROUTES.PRODUCT,
    icon: Inventory2Icon,
  },
  {
    name: "Inventory",
    path: ROUTES.INVENTORY,
    icon: WarehouseIcon,
  },
  {
    name: "Cart",
    path: ROUTES.CART,
    icon: ShoppingCartIcon,
  },
  {
    name: "Order",
    path: ROUTES.ORDER,
    icon: ReceiptLongIcon,
  },
  {
    name: "Payment",
    path: "/payment",
    icon: PaymentsIcon,
  },
  {
    name: "Shipping",
    path: "/shipping",
    icon: LocalShippingIcon,
  },
  {
    name: "Coupon",
    path: "/coupon",
    icon: ConfirmationNumberIcon,
  },
  {
    name: "Review",
    path: "/review",
    icon: RateReviewIcon,
  },
];
