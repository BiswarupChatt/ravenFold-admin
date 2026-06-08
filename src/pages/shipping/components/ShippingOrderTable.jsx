import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

import DataTable from "@/components/DataTable";
import {
  formatOrderDateTime,
  getCustomerInitial,
  getCustomerName,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "@/pages/order/components/orderFormatters";
import {
  formatProviderName,
  getLatestShipment,
  getShipmentStatusMeta,
} from "./shippingFormatters";

const ShipmentStatusChip = ({ status }) => {
  const meta = getShipmentStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  );
};

const OrderStatusChip = ({ status }) => {
  const meta = getOrderStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  );
};

const PaymentStatusChip = ({ status }) => {
  const meta = getPaymentStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  );
};

const getShipToLine = (address = {}) => {
  return [address.city, address.state, address.pincode].filter(Boolean).join(", ") || "-";
};

const getShipmentLabel = (shipment) => {
  if (!shipment) {
    return "-";
  }

  return [formatProviderName(shipment.provider), shipment.courierName].filter(Boolean).join(" / ");
};

const ShippingOrderTable = ({
  rows,
  loading,
  error,
  pagination,
  onView,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const columns = [
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
      minWidth: 260,
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
      id: "shipTo",
      header: "Ship To",
      minWidth: 180,
      render: (order) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {order.shippingAddress?.fullName || getCustomerName(order)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {getShipToLine(order.shippingAddress)}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "orderStatus",
      header: "Order",
      minWidth: 120,
      render: (order) => <OrderStatusChip status={order.status} />,
    },
    {
      id: "paymentStatus",
      header: "Payment",
      minWidth: 130,
      render: (order) => <PaymentStatusChip status={order.paymentStatus} />,
    },
    {
      id: "shipmentStatus",
      header: "Shipment",
      minWidth: 150,
      render: (order) => {
        const shipment = getLatestShipment(order.shipments);

        return <ShipmentStatusChip status={shipment?.status || "not_created"} />;
      },
    },
    {
      id: "courier",
      header: "Courier / AWB",
      minWidth: 210,
      render: (order) => {
        const shipment = getLatestShipment(order.shipments);

        return (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {getShipmentLabel(shipment)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {shipment?.awbCode || "No AWB"}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      minWidth: 90,
      render: (order) => (
        <Tooltip title="Manage shipment">
          <IconButton size="small" onClick={() => onView(order)}>
            <LocalShippingOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        loadingMessage="Loading shipping orders..."
        emptyMessage="No shipping orders found."
        minWidth={1360}
        pagination={{
          ...pagination,
          onPageChange,
          onRowsPerPageChange,
        }}
      />
    </Box>
  );
};

export default ShippingOrderTable;
