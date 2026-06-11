import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import DataTable from "@/components/DataTable";
import ShipmentFulfillmentPanel from "./ShipmentFulfillmentPanel";
import {
  formatAddressLines,
  formatOrderDateTime,
  formatOrderMoney,
  getCustomerInitial,
  getCustomerName,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "./orderFormatters";

const getItemName = (item) => item.productSnapshot?.name || item.productId || "Product";

const getItemMeta = (item) => {
  const snapshot = item.productSnapshot || {};
  const variantLabel = snapshot.variantLabel || snapshot.variantSku;
  const sku = snapshot.variantSku || snapshot.sku;

  return [variantLabel, sku].filter(Boolean).join(" / ");
};

const SummaryItem = ({ label, value }) => (
  <Box sx={{ minWidth: 150 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={700}>
      {value}
    </Typography>
  </Box>
);

const TotalRow = ({ label, value, strong = false }) => (
  <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color={strong ? "text.primary" : "text.secondary"} fontWeight={strong ? 700 : 400}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={strong ? 800 : 600}>
      {value}
    </Typography>
  </Stack>
);

const AddressBlock = ({ title, address }) => {
  const lines = formatAddressLines(address);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        minWidth: 0,
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      {lines.length > 0 ? (
        <Stack spacing={0.25}>
          {lines.map((line, index) => (
            <Typography key={`${line}-${index}`} variant="body2" color="text.secondary">
              {line}
            </Typography>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No address saved.
        </Typography>
      )}
    </Box>
  );
};

const OrderDetailsDialog = ({
  actionLoading = false,
  boxTypes = [],
  loading,
  onCancelShipment,
  onClose,
  onCreateShipment,
  onMarkPacked,
  onUpdateShipmentStatus,
  open,
  order,
  pickupLocations = [],
}) => {
  const orderStatus = getOrderStatusMeta(order?.status);
  const paymentStatus = getPaymentStatusMeta(order?.paymentStatus);
  const itemRows = Array.isArray(order?.items) ? order.items : [];
  const itemColumns = [
    {
      id: "item",
      header: "Item",
      minWidth: 360,
      render: (item) => (
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          {item.productSnapshot?.image ? (
            <Box
              component="img"
              src={item.productSnapshot.image}
              alt={getItemName(item)}
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1,
                objectFit: "cover",
                bgcolor: "action.hover",
                flexShrink: 0,
              }}
            />
          ) : (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1,
                bgcolor: "action.hover",
                flexShrink: 0,
              }}
            />
          )}
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {getItemName(item)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {getItemMeta(item) || "-"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      id: "quantity",
      header: "Qty",
      align: "right",
      minWidth: 80,
      render: (item) => Number(item.quantity || 0).toLocaleString(),
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      minWidth: 120,
      render: (item) => formatOrderMoney(item.priceAtTime, order?.currency),
    },
    {
      id: "lineTotal",
      header: "Total",
      align: "right",
      minWidth: 120,
      render: (item) => (
        <Typography variant="body2" fontWeight={700}>
          {formatOrderMoney(item.lineTotal, order?.currency)}
        </Typography>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 7 }}>
        Order details
        <IconButton
          aria-label="Close order details"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 5 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              Loading order details...
            </Typography>
          </Stack>
        ) : null}

        {!loading && order ? (
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "flex-start" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar src={order.user?.avatar || ""} sx={{ width: 42, height: 42 }}>
                  {getCustomerInitial(order)}
                </Avatar>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {getCustomerName(order)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {order.user?.email || order.userId || "-"}
                  </Typography>
                  {order.user?.phone ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {order.user.phone}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>

              <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  {order.orderNumber || order.id}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    label={orderStatus.label}
                    color={orderStatus.color}
                    variant={orderStatus.color === "default" ? "outlined" : "filled"}
                  />
                  <Chip
                    size="small"
                    label={paymentStatus.label}
                    color={paymentStatus.color}
                    variant={paymentStatus.color === "default" ? "outlined" : "filled"}
                  />
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
              <SummaryItem label="Total" value={formatOrderMoney(order.totalPayable, order.currency)} />
              <SummaryItem label="Items" value={Number(order.itemCount || 0).toLocaleString()} />
              <SummaryItem label="Total Quantity" value={Number(order.totalQuantity || 0).toLocaleString()} />
              <SummaryItem label="Placed" value={formatOrderDateTime(order.placedAt || order.createdAt)} />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AddressBlock title="Shipping address" address={order.shippingAddress} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <AddressBlock title="Billing address" address={order.billingAddress} />
              </Box>
            </Stack>

            <ShipmentFulfillmentPanel
              actionLoading={actionLoading}
              boxTypes={boxTypes}
              order={order}
              onCancelShipment={onCancelShipment}
              onCreateShipment={onCreateShipment}
              onMarkPacked={onMarkPacked}
              pickupLocations={pickupLocations}
              onUpdateShipmentStatus={onUpdateShipmentStatus}
            />

            <DataTable
              columns={itemColumns}
              rows={itemRows}
              getRowId={(item) => item.id}
              emptyMessage="This order has no items."
              minWidth={760}
              pagination={null}
            />

            <Box sx={{ alignSelf: { xs: "stretch", md: "flex-end" }, width: { xs: "100%", md: 320 } }}>
              <Stack spacing={1}>
                <TotalRow label="MRP" value={formatOrderMoney(order.totalMrp, order.currency)} />
                <TotalRow label="Subtotal" value={formatOrderMoney(order.subtotal, order.currency)} />
                <TotalRow label="Bag discount" value={`-${formatOrderMoney(order.bagDiscount, order.currency)}`} />
                <TotalRow label="Coupon discount" value={`-${formatOrderMoney(order.couponDiscount, order.currency)}`} />
                <TotalRow label="Shipping" value={formatOrderMoney(order.shippingCharge, order.currency)} />
                <Divider />
                <TotalRow label="Total payable" value={formatOrderMoney(order.totalPayable, order.currency)} strong />
              </Stack>
            </Box>
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDetailsDialog;
