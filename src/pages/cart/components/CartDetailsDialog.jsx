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
import {
  formatCartDateTime,
  formatCartMoney,
  getCartStatusMeta,
  getCustomerInitial,
  getCustomerName,
} from "./cartFormatters";

const getItemName = (item) => item.productSnapshot?.name || item.productId || "Product";

const getItemMeta = (item) => {
  const snapshot = item.productSnapshot || {};
  const variantLabel = snapshot.variantLabel || snapshot.variantSku;
  const sku = snapshot.variantSku || snapshot.sku;

  return [variantLabel, sku].filter(Boolean).join(" / ");
};

const CartDetailsDialog = ({
  open,
  cart,
  loading,
  onClose,
}) => {
  const status = getCartStatusMeta(cart?.status);
  const itemRows = Array.isArray(cart?.items) ? cart.items : [];
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
      render: (item) => formatCartMoney(item.priceAtTime, cart?.currency),
    },
    {
      id: "lineTotal",
      header: "Total",
      align: "right",
      minWidth: 120,
      render: (item) => (
        <Typography variant="body2" fontWeight={700}>
          {formatCartMoney(item.lineTotal, cart?.currency)}
        </Typography>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 7 }}>
        Cart details
        <IconButton
          aria-label="Close cart details"
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
              Loading cart details...
            </Typography>
          </Stack>
        ) : null}

        {!loading && cart ? (
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar src={cart.user?.avatar || ""} sx={{ width: 42, height: 42 }}>
                  {getCustomerInitial(cart)}
                </Avatar>
                <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {getCustomerName(cart)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {cart.user?.email || cart.userId || "-"}
                  </Typography>
                  {cart.user?.phone ? (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {cart.user.phone}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>

              <Chip
                size="small"
                label={status.label}
                color={status.color}
                variant={status.color === "default" ? "outlined" : "filled"}
                sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
              />
            </Stack>

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCartMoney(cart.subtotal, cart.currency)}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Items
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {Number(cart.itemCount || 0).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {Number(cart.totalQuantity || 0).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 180 }}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatCartDateTime(cart.updatedAt)}
                </Typography>
              </Box>
            </Stack>

            <DataTable
              columns={itemColumns}
              rows={itemRows}
              getRowId={(item) => item.id}
              emptyMessage="This cart has no items."
              minWidth={720}
              pagination={null}
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

export default CartDetailsDialog;
