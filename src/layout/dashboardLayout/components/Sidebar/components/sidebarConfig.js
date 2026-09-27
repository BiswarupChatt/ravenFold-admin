// src/modules/.../SIDEBAR_ITEMS.js

import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import CampaignIcon from "@mui/icons-material/Campaign";
import ArticleIcon from "@mui/icons-material/Article";
import TuneIcon from "@mui/icons-material/Tune";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";

import ROUTES from "../../../../../routes/routes";

export const SIDEBAR_ITEMS = [
  {
    name: "Dashboard",
    path: ROUTES.ROOT,
    icon: DashboardIcon,
  },
  {
    name: "Catalog",
    icon: CategoryIcon,
    children: [
      {
        name: "Products",
        path: ROUTES.PRODUCT,
        icon: Inventory2Icon,
      },
      {
        name: "Category",
        path: ROUTES.OTHER_CATEGORY,
        icon: CategoryIcon,
      },
      {
        name: "Inventory",
        path: ROUTES.INVENTORY,
        icon: WarehouseIcon,
      },
    ],
  },
  {
    name: "Sales",
    icon: ReceiptLongIcon,
    children: [
      {
        name: "Orders",
        path: ROUTES.ORDER,
        icon: ReceiptLongIcon,
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
    ],
  },
  {
    name: "Marketing",
    icon: CampaignIcon,
    children: [
      { name: "Promotions", path: ROUTES.OTHER_COUPON, icon: ConfirmationNumberIcon },
      { name: "Announcement Banners", path: ROUTES.OTHER_ANNOUNCEMENT_BANNERS, icon: CampaignIcon },
      { name: "Popup Campaigns", path: ROUTES.POPUP_CAMPAIGNS, icon: MarkEmailReadIcon },
      { name: "Leads", path: ROUTES.LEADS, icon: PeopleAltIcon },
    ],
  },
  {
    name: "Storefront",
    icon: StorefrontIcon,
    children: [
      { name: "Homepage Builder", path: ROUTES.HOMEPAGE_BUILDER, icon: ViewQuiltIcon },
      { name: "Storefront Settings", path: ROUTES.STOREFRONT_SETTINGS, icon: TuneIcon },
      { name: "Policy Pages", path: ROUTES.POLICY_PAGES, icon: ArticleIcon },
    ],
  },
  {
    name: "Customers",
    icon: PeopleAltIcon,
    children: [
      {
        name: "Customers",
        path: ROUTES.CUSTOMER,
        icon: PeopleAltIcon,
      },
      {
        name: "Review",
        path: ROUTES.OTHER_REVIEW,
        icon: RateReviewIcon,
      },
    ],
  },
  {
    name: "Settings",
    icon: SettingsIcon,
    children: [
      {
        name: "GST",
        path: ROUTES.GST,
        icon: RequestQuoteIcon,
      },
      {
        name: "Box Types",
        path: ROUTES.OTHER_BOX_TYPES,
        icon: AllInboxIcon,
      },
    ],
  },
];
