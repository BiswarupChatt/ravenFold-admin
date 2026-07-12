// src/modules/.../SIDEBAR_ITEMS.js

import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AllInboxIcon from "@mui/icons-material/AllInbox";

import ROUTES from "../../../../../routes/routes";

export const SIDEBAR_ITEMS = [
  {
    name: "Dashboard",
    path: ROUTES.ROOT,
    icon: DashboardIcon,
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
    name: "Order",
    path: ROUTES.ORDER,
    icon: ReceiptLongIcon,
  },
  {
    name: "Other",
    icon: MoreHorizIcon,
    children: [
      {
        name: "Category",
        path: ROUTES.OTHER_CATEGORY,
        icon: CategoryIcon,
      },
      {
        name: "Cart",
        path: ROUTES.OTHER_CART,
        icon: ShoppingCartIcon,
      },
      {
        name: "Payment",
        path: ROUTES.OTHER_PAYMENT,
        icon: PaymentsIcon,
      },
      {
        name: "Coupon",
        path: ROUTES.OTHER_COUPON,
        icon: ConfirmationNumberIcon,
      },
      {
        name: "Review",
        path: ROUTES.OTHER_REVIEW,
        icon: RateReviewIcon,
      },
      {
        name: "Box Types",
        path: ROUTES.OTHER_BOX_TYPES,
        icon: AllInboxIcon,
      },
    ],
  },
];
