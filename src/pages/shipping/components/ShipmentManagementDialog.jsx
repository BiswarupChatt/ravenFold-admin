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

import {
  formatAddressLines,
  formatOrderDateTime,
  formatOrderMoney,
  getCustomerInitial,
  getCustomerName,
  getOrderStatusMeta,
  getPaymentStatusMeta,
} from "@/pages/order/components/orderFormatters";
import ShipmentFulfillmentPanel from "./ShipmentFulfillmentPanel";

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

const StatusChip = ({ meta }) => (
  <Chip
    size="small"
    label={meta.label}
    color={meta.color}
    variant={meta.color === "default" ? "outlined" : "filled"}
  />
);

const ShipmentManagementDialog = ({
  actionLoading = false,
  loading = false,
  onCancelShipment,
  onClose,
  onCreateShipment,
  onMarkPacked,
  onUpdateShipmentStatus,
  open,
  order,
}) => {
  const orderStatus = getOrderStatusMeta(order?.status);
  const paymentStatus = getPaymentStatusMeta(order?.paymentStatus);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 7 }}>
        Shipping details
        <IconButton
          aria-label="Close shipping details"
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
              Loading shipping details...
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
                  <StatusChip meta={orderStatus} />
                  <StatusChip meta={paymentStatus} />
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

            <AddressBlock title="Shipping address" address={order.shippingAddress} />

            <ShipmentFulfillmentPanel
              actionLoading={actionLoading}
              order={order}
              onCancelShipment={onCancelShipment}
              onCreateShipment={onCreateShipment}
              onMarkPacked={onMarkPacked}
              onUpdateShipmentStatus={onUpdateShipmentStatus}
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

export default ShipmentManagementDialog;
