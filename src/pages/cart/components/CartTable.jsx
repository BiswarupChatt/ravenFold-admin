import {
  Avatar,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

import DataTable from "@/components/DataTable";
import {
  formatCartDateTime,
  formatCartMoney,
  getCartStatusMeta,
  getCustomerInitial,
  getCustomerName,
} from "./cartFormatters";

const CartTable = ({
  rows,
  loading,
  error,
  pagination,
  onView,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const cartColumns = [
    {
      id: "customer",
      header: "Customer",
      minWidth: 300,
      render: (cart) => (
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar src={cart.user?.avatar || ""} sx={{ width: 34, height: 34, fontSize: 14 }}>
            {getCustomerInitial(cart)}
          </Avatar>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {getCustomerName(cart)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {cart.user?.email || cart.userId || "-"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      id: "status",
      header: "Status",
      minWidth: 130,
      render: (cart) => {
        const status = getCartStatusMeta(cart.status);

        return (
          <Chip
            size="small"
            label={status.label}
            color={status.color}
            variant={status.color === "default" ? "outlined" : "filled"}
          />
        );
      },
    },
    {
      id: "items",
      header: "Items",
      align: "right",
      minWidth: 120,
      render: (cart) => (
        <Stack spacing={0.25} alignItems="flex-end">
          <Typography variant="body2" fontWeight={700}>
            {Number(cart.itemCount || 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Number(cart.totalQuantity || 0).toLocaleString()} qty
          </Typography>
        </Stack>
      ),
    },
    {
      id: "subtotal",
      header: "Subtotal",
      align: "right",
      minWidth: 140,
      render: (cart) => (
        <Typography variant="body2" fontWeight={700}>
          {formatCartMoney(cart.subtotal, cart.currency)}
        </Typography>
      ),
    },
    {
      id: "updatedAt",
      header: "Last Updated",
      minWidth: 170,
      render: (cart) => formatCartDateTime(cart.updatedAt),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      minWidth: 90,
      render: (cart) => (
        <Tooltip title="View cart">
          <IconButton size="small" onClick={() => onView(cart)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <DataTable
      columns={cartColumns}
      rows={rows}
      loading={loading}
      error={error}
      loadingMessage="Loading carts..."
      emptyMessage="No carts with items found."
      minWidth={950}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
    />
  );
};

export default CartTable;
