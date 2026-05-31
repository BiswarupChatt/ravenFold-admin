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
  formatOrderDateTime,
  formatOrderMoney,
  getCustomerInitial,
  getCustomerName,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "./orderFormatters";

const OrderTable = ({
  rows,
  loading,
  error,
  pagination,
  onView,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const orderColumns = [
    {
      id: "order",
      header: "Order",
      minWidth: 220,
      render: (order) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {order.orderNumber || order.id}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {formatOrderDateTime(order.placedAt || order.createdAt)}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      minWidth: 280,
      render: (order) => (
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar src={order.user?.avatar || ""} sx={{ width: 34, height: 34, fontSize: 14 }}>
            {getCustomerInitial(order)}
          </Avatar>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {getCustomerName(order)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {order.user?.email || order.userId || "-"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      id: "status",
      header: "Status",
      minWidth: 130,
      render: (order) => {
        const status = getOrderStatusMeta(order.status);

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
      id: "payment",
      header: "Payment",
      minWidth: 130,
      render: (order) => {
        const status = getPaymentStatusMeta(order.paymentStatus);

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
      render: (order) => (
        <Stack spacing={0.25} alignItems="flex-end">
          <Typography variant="body2" fontWeight={700}>
            {Number(order.itemCount || 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Number(order.totalQuantity || 0).toLocaleString()} qty
          </Typography>
        </Stack>
      ),
    },
    {
      id: "total",
      header: "Total",
      align: "right",
      minWidth: 140,
      render: (order) => (
        <Typography variant="body2" fontWeight={700}>
          {formatOrderMoney(order.totalPayable, order.currency)}
        </Typography>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      minWidth: 90,
      render: (order) => (
        <Tooltip title="View order">
          <IconButton size="small" onClick={() => onView(order)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <DataTable
      columns={orderColumns}
      rows={rows}
      loading={loading}
      error={error}
      loadingMessage="Loading orders..."
      emptyMessage="No orders found."
      minWidth={1110}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
    />
  );
};

export default OrderTable;
