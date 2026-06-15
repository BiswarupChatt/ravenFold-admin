import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
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

const DetailLine = ({ label, value, strong = false }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={strong ? 800 : 600}
      textAlign="right"
      sx={{ wordBreak: "break-word" }}
    >
      {hasDisplayValue(value) ? value : "N/A"}
    </Typography>
  </Stack>
);

const MetricTile = ({ label, value }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      bgcolor: "background.paper",
      px: 1.5,
      py: 1,
      minWidth: 0,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="subtitle1" fontWeight={800} noWrap>
      {hasDisplayValue(value) ? value : "N/A"}
    </Typography>
  </Box>
);

const InfoPanel = ({ children, subtitle, sx, title }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2.5,
      bgcolor: "background.paper",
      p: 1.75,
      ...sx,
    }}
  >
    <Stack spacing={0.25} sx={{ mb: 1.5 }}>
      <Typography variant="subtitle1" fontWeight={800}>
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
    <Box>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      <Stack spacing={0.35} sx={{ mt: 0.5 }}>
        {lines.length ? (
          lines.map((line) => (
            <Typography key={line} variant="body2" fontWeight={600}>
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

const CustomerPanel = ({ order }) => (
  <InfoPanel title="Customer">
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }}>
        {getCustomerInitial(order)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={900} noWrap>
          {getCustomerName(order)}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {order?.user?.email || order?.customer?.email || order?.email || "No email"}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {order?.user?.phone || order?.customer?.phone || order?.phone || "No phone"}
        </Typography>
      </Box>
    </Stack>
  </InfoPanel>
);

const PaymentPanel = ({ order }) => (
  <InfoPanel title="Payment">
    <Stack spacing={1}>
      <DetailLine
        label="Payment status"
        value={getPaymentStatusMeta(order?.paymentStatus).label}
        strong
      />
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
  </InfoPanel>
);

const ReferencePanel = ({ order, placedAt }) => (
  <InfoPanel title="Order references">
    <Stack spacing={1}>
      <DetailLine label="Order number" value={order?.orderNumber || order?.id} strong />
      <DetailLine label="Placed" value={placedAt} />
      <DetailLine
        label="Shiprocket ref"
        value={
          order?.shiprocketOrderId ||
          order?.shipment?.providerOrderId ||
          order?.shipment?.providerShipmentId
        }
      />
      <DetailLine label="Payment method" value={order?.paymentMethod || order?.payment?.method} />
    </Stack>
  </InfoPanel>
);

const OrderDetailsDialog = ({
  actionLoading = false,
  boxTypes = [],
  loading = false,
  onAssignShipmentAwb,
  onCancelShipment,
  onClose,
  onCreateProviderOrder,
  onCreateShipment,
  onFetchCourierOptions,
  onGenerateShipmentLabel,
  onGenerateShipmentManifest,
  onScheduleShipmentPickup,
  onSyncShipmentTracking,
  onUpdateOrderStatus,
  onUpdateShipmentStatus,
  open,
  order,
  providerPickupLocations = [],
}) => {
  const orderStatus = getOrderStatusMeta(order?.status);
  const paymentStatus = getPaymentStatusMeta(order?.paymentStatus);
  const placedAt = formatOrderDateTime(order?.placedAt || order?.createdAt);
  const orderNumber = order?.orderNumber || order?.id || "Order details";
  const itemRows = Array.isArray(order?.items) ? order.items : [];
  const metrics = [
    {
      label: "Total",
      value: formatOrderMoney(order?.pricing?.total ?? order?.totalPayable, order?.currency),
    },
    { label: "Items", value: order?.itemCount ?? itemRows.length ?? 0 },
    { label: "Quantity", value: order?.totalQuantity || 0 },
    { label: "Placed", value: placedAt },
    {
      label: "Shiprocket ref",
      value:
        order?.shiprocketOrderId ||
        order?.shipment?.providerOrderId ||
        order?.shipment?.providerShipmentId ||
        "Pending",
    },
  ];
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: { md: "92vh" },
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider", p: { xs: 2, md: 2.5 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1.5}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Order workspace
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ mt: 0.25 }}>
                {orderNumber}
              </Typography>
              {order ? (
                <Typography variant="body2" color="text.secondary">
                  {getCustomerName(order)} | {placedAt}
                </Typography>
              ) : null}
            </Box>

            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              {order ? (
                <>
                  <Chip
                    label={orderStatus.label}
                    color={orderStatus.color}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={paymentStatus.label}
                    color={paymentStatus.color}
                    variant="outlined"
                    size="small"
                  />
                </>
              ) : null}
              <IconButton aria-label="Close order details" onClick={onClose} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {order ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  sm: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(5, minmax(0, 1fr))",
                },
                gap: 1,
                mt: 2,
              }}
            >
              {metrics.map((metric) => (
                <MetricTile key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </Box>
          ) : null}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: "background.default" }}>
        {loading ? (
          <Box sx={{ display: "grid", minHeight: 360, placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : null}

        {!loading && order ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 380px" },
              minHeight: { md: "calc(92vh - 156px)" },
            }}
          >
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRight: { lg: "1px solid" },
                borderColor: "divider",
                minWidth: 0,
                overflow: "auto",
                p: { xs: 1.5, md: 2 },
              }}
            >
              <Stack spacing={2}>
                <ShipmentFulfillmentPanel
                  actionLoading={actionLoading}
                  boxTypes={boxTypes}
                  onAssignShipmentAwb={onAssignShipmentAwb}
                  onCancelShipment={onCancelShipment}
                  onCreateProviderOrder={onCreateProviderOrder}
                  onCreateShipment={onCreateShipment}
                  onFetchCourierOptions={onFetchCourierOptions}
                  onGenerateShipmentLabel={onGenerateShipmentLabel}
                  onGenerateShipmentManifest={onGenerateShipmentManifest}
                  onScheduleShipmentPickup={onScheduleShipmentPickup}
                  onSyncShipmentTracking={onSyncShipmentTracking}
                  onUpdateOrderStatus={onUpdateOrderStatus}
                  onUpdateShipmentStatus={onUpdateShipmentStatus}
                  order={order}
                  providerPickupLocations={providerPickupLocations}
                />

                <InfoPanel
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
                </InfoPanel>
              </Stack>
            </Box>

            <Box
              sx={{
                minWidth: 0,
                overflow: "auto",
                p: { xs: 1.5, md: 2 },
              }}
            >
              <Stack spacing={1.5}>
                <CustomerPanel order={order} />

                <InfoPanel title="Delivery">
                  <Stack spacing={1.5}>
                    <AddressBlock title="Shipping address" address={order.shippingAddress} />
                    <Divider />
                    <AddressBlock title="Billing address" address={order.billingAddress} />
                  </Stack>
                </InfoPanel>

                <PaymentPanel order={order} />
                <ReferencePanel order={order} placedAt={placedAt} />
              </Stack>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
