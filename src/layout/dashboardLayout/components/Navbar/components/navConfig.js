// usage example
// {
//   name: "Reports",
//   children: [
//     { name: "Sales", path: "/reports/sales" },
//     {
//       name: "Finance",
//       children: [
//         { name: "Invoices", path: "/reports/finance/invoices" },
//       ],
//     },
//   ],
// },


import UserRoundIcon from "../../../../../assets/icons/UserRoundIcon";
import ROUTES from "../../../../../routes/routes";

// Define the base structure without the logout function
export const getNavItems = (handleLogout) => [
  {
    name: "Profile",
    icon: UserRoundIcon,
    children: [
      { name: "Account", path: ROUTES.ACCOUNT },
      { name: "Settings", path: ROUTES.SETTINGS },
      { name: "Logout", action: handleLogout },
    ],
  },
];
