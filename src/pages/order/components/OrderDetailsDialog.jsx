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

const hasDisplayValue = (value) => value !== null && value !== undefined && value !== "";

const cleanReferenceValue = (value) => {
  const normalizedValue = String(value || "").trim();

  return ["", "0", "null", "undefined", "nan"].includes(normalizedValue.toLowerCase())
    ? ""
    : normalizedValue;
};

const getShiprocketReference = (order) => (
  cleanReferenceValue(order?.shiprocketOrderId) ||
  cleanReferenceValue(order?.shipment?.providerOrderId) ||
  cleanReferenceValue(order?.shipment?.providerShipmentId)
);

const getItemName = (item) =>
  item?.productSnapshot?.name ||
  item?.product?.name ||
  item?.name ||
  item?.productName ||
  item?.productId ||
  item?.sku ||
  "Product";

const getItemMeta = (item) => {
  const snapshot = item?.productSnapshot || {};
  const variantLabel = snapshot.variantLabel || snapshot.variantSku;
  const sku = snapshot.variantSku || snapshot.sku || item?.sku;

  return [variantLabel, sku, item?.variantName, item?.size, item?.color].filter(Boolean).join(" / ");
};

const formatLabel = (value = "") => {
  if (!value) return "-";

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const SummaryItem = ({ color = "text.primary", label, value }) => (
  <Box sx={{ minWidth: 150 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="h6"
      fontWeight={700}
      color={color}
      sx={{ overflowWrap: "anywhere" }}
    >
      {hasDisplayValue(value) ? value : "-"}
    </Typography>
  </Box>
);

const DetailItem = ({ label, mono = false, value }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={600}
      sx={{
        fontFamily: mono ? "monospace" : undefined,
        overflowWrap: "anywhere",
      }}
    >
      {hasDisplayValue(value) ? value : "-"}
    </Typography>
  </Box>
);

const DetailPanel = ({ children, subtitle, title }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      minWidth: 0,
      p: 1.5,
    }}
  >
    <Stack spacing={0.25} sx={{ mb: 1.25 }}>
      <Typography variant="subtitle2" fontWeight={700}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
    {children}
  </Box>
);

const TotalRow = ({ currency, label, negative = false, strong = false, value }) => {
  const numericValue = Number(value || 0);
  const formattedValue = formatOrderMoney(numericValue, currency);

  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography
        variant="body2"
        color={strong ? "text.primary" : "text.secondary"}
        fontWeight={strong ? 800 : 500}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={strong ? 900 : 700}>
        {negative && numericValue > 0 ? `-${formattedValue}` : formattedValue}
      </Typography>
    </Stack>
  );
};

const AddressBlock = ({ address, title }) => {
  const lines = formatAddressLines(address);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Stack spacing={0.3} sx={{ mt: 0.5 }}>
        {lines.length ? (
          lines.map((line) => (
            <Typography key={line} variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
              {line}
            </Typography>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No address available.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

const LabeledStatusChip = ({ label, meta }) => (
  <Stack spacing={0.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  </Stack>
);

const CustomerSummary = ({ order }) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
    <Avatar
      alt={getCustomerName(order)}
      src={order?.user?.avatar || ""}
      slotProps={{
        img: {
          referrerPolicy: "no-referrer",
        },
      }}
      sx={{ bgcolor: "primary.main", width: 42, height: 42 }}
    >
      {getCustomerInitial(order)}
    </Avatar>
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="subtitle1" fontWeight={700} noWrap>
        {getCustomerName(order)}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        {order?.user?.email || order?.customer?.email || order?.email || "No email"}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        {order?.user?.phone || order?.customer?.phone || order?.phone || "No phone"}
      </Typography>
    </Stack>
  </Stack>
);

const PaymentPanel = ({ order }) => (
  <DetailPanel title="Payment">
    <Stack spacing={1}>
      <DetailItem label="Payment status" value={getPaymentStatusMeta(order?.paymentStatus).label} />
      <Divider />
      <TotalRow
        label="MRP"
        value={order?.pricing?.mrpTotal ?? order?.totalMrp}
        currency={order?.currency}
      />
      <TotalRow
        label="Subtotal"
        value={order?.pricing?.subtotal ?? order?.subtotal}
        currency={order?.currency}
      />
      <TotalRow
        label="Bag discount"
        value={order?.pricing?.bagDiscountTotal ?? order?.bagDiscount}
        currency={order?.currency}
        negative
      />
      <TotalRow
        label="Coupon discount"
        value={order?.pricing?.couponDiscount ?? order?.couponDiscount}
        currency={order?.currency}
        negative
      />
      <TotalRow
        label="Shipping"
        value={order?.pricing?.shippingCharge ?? order?.shippingCharge}
        currency={order?.currency}
      />
      <Divider />
      <TotalRow
        label="Total payable"
        value={order?.pricing?.total ?? order?.totalPayable}
        currency={order?.currency}
        strong
      />
    </Stack>
  </DetailPanel>
);

const DeliveryPanel = ({ order }) => (
  <DetailPanel title="Delivery">
    <Stack spacing={1.5}>
      <AddressBlock title="Shipping address" address={order.shippingAddress} />
      <Divider />
      <AddressBlock title="Billing address" address={order.billingAddress} />
    </Stack>
  </DetailPanel>
);

const ReferencePanel = ({ order, placedAt, shiprocketReference }) => (
  <DetailPanel title="Order reference">
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
      }}
    >
      <DetailItem label="Order number" value={order?.orderNumber || order?.id} mono />
      <DetailItem label="Placed" value={placedAt} />
      <DetailItem label="Shiprocket ref" value={shiprocketReference || "Pending"} mono />
      <DetailItem label="Payment method" value={order?.paymentMethod || order?.payment?.method} />
    </Box>
  </DetailPanel>
);

const OrderDetailsDialog = ({
  actionLoading = false,
  boxTypes = [],
  loading = false,
  onClose,
  onCreateProviderOrder,
  onSyncShipmentTracking,
  onUpdateOrderStatus,
  open,
  order,
  trackingSyncWarning = "",
}) => {
  const orderStatus = getOrderStatusMeta(order?.status);
  const paymentStatus = getPaymentStatusMeta(order?.paymentStatus);
  const placedAt = formatOrderDateTime(order?.placedAt || order?.createdAt);
  const orderNumber = order?.orderNumber || order?.id || "Order";
  const itemRows = Array.isArray(order?.items) ? order.items : [];
  const shiprocketReference = getShiprocketReference(order);
  const itemColumns = [
    {
      id: "item",
      header: "Item",
      minWidth: 360,
      render: (item) => (
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          {item?.productSnapshot?.image ? (
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
      render: (item) => Number(item?.quantity || 0).toLocaleString(),
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      minWidth: 120,
      render: (item) => formatOrderMoney(item?.priceAtTime ?? item?.price, order?.currency),
    },
    {
      id: "lineTotal",
      header: "Total",
      align: "right",
      minWidth: 120,
      render: (item) => {
        const quantity = Number(item?.quantity || 0);
        const price = Number(item?.priceAtTime ?? item?.price ?? 0);
        const lineTotal = item?.lineTotal ?? price * quantity;

        return (
          <Typography variant="body2" fontWeight={800}>
            {formatOrderMoney(lineTotal, order?.currency)}
          </Typography>
        );
      },
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
              <CustomerSummary order={order} />

              <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  {orderNumber}
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <LabeledStatusChip label="Order" meta={orderStatus} />
                  <LabeledStatusChip label="Money" meta={paymentStatus} />
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
              <SummaryItem
                label="Total"
                value={formatOrderMoney(order?.pricing?.total ?? order?.totalPayable, order?.currency)}
              />
              <SummaryItem label="Items" value={Number(order?.itemCount ?? itemRows.length ?? 0).toLocaleString()} />
              <SummaryItem label="Quantity" value={Number(order?.totalQuantity || 0).toLocaleString()} />
              <SummaryItem label="Placed" value={placedAt || "-"} />
              <SummaryItem label="Shiprocket ref" value={shiprocketReference || "Pending"} />
            </Stack>

            <ShipmentFulfillmentPanel
              actionLoading={actionLoading}
              boxTypes={boxTypes}
              onCreateProviderOrder={onCreateProviderOrder}
              onSyncShipmentTracking={onSyncShipmentTracking}
              trackingSyncWarning={trackingSyncWarning}
              onUpdateOrderStatus={onUpdateOrderStatus}
              order={order}
            />

            <DetailPanel
              title="Ordered items"
              subtitle={`${itemRows.length} item line${itemRows.length === 1 ? "" : "s"}`}
            >
              <DataTable
                columns={itemColumns}
                rows={itemRows}
                getRowId={(item, index) => item?._id || item?.id || item?.productId || item?.sku || index}
                emptyMessage="This order has no items."
                minWidth={760}
                pagination={null}
              />
            </DetailPanel>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DeliveryPanel order={order} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <PaymentPanel order={order} />
              </Box>
            </Stack>

            <ReferencePanel
              order={order}
              placedAt={placedAt}
              shiprocketReference={shiprocketReference}
            />
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
