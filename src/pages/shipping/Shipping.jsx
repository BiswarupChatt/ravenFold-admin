import { useCallback, useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

import SectionHeader from "@/components/SectionHeader";
import { useToast } from "@/hooks/ToastContext";
import { fetchAdminOrder, fetchAdminOrders } from "@/lib/api/orderApi";
import {
  cancelAdminShipment,
  createAdminShipment,
  markAdminOrderPacked,
  updateAdminShipmentStatus,
} from "@/lib/api/shippingApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { DEFAULT_PAGINATION, DEFAULT_TABLE_PARAMS, SEARCH_DEBOUNCE_MS } from "@/lib/utils/utils";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/pages/order/components/orderFormatters";
import ShipmentManagementDialog from "./components/ShipmentManagementDialog";
import ShippingOrderTable from "./components/ShippingOrderTable";

const INITIAL_SHIPPING_TABLE_PARAMS = {
  ...DEFAULT_TABLE_PARAMS,
  paymentStatus: "paid",
};

const Shipping = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [tableParams, setTableParams] = useState(INITIAL_SHIPPING_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingDetailsOpen, setShippingDetailsOpen] = useState(false);
  const [loadingShippingDetails, setLoadingShippingDetails] = useState(false);
  const [shipmentActionLoading, setShipmentActionLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const orderList = await fetchAdminOrders(authToken, tableParams);

      setOrders(orderList.items);
      setPagination(orderList.pagination);
    } catch (err) {
      const message = err.message || "Failed to load shipping orders.";

      setError(message);
      setOrders([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, tableParams]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const search = searchInput.trim();

      setTableParams((currentParams) => {
        if ((currentParams.search || "") === search) {
          return currentParams;
        }

        const nextParams = {
          ...currentParams,
          page: 1,
        };

        if (search) {
          nextParams.search = search;
        } else {
          delete nextParams.search;
        }

        return nextParams;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;

    setTableParams((currentParams) => {
      const nextParams = {
        ...currentParams,
        page: 1,
      };

      if (nextStatus === "all") {
        delete nextParams.status;
      } else {
        nextParams.status = nextStatus;
      }

      return nextParams;
    });
  };

  const handlePaymentStatusChange = (event) => {
    const nextStatus = event.target.value;

    setTableParams((currentParams) => {
      const nextParams = {
        ...currentParams,
        page: 1,
      };

      if (nextStatus === "all") {
        delete nextParams.paymentStatus;
      } else {
        nextParams.paymentStatus = nextStatus;
      }

      return nextParams;
    });
  };

  const handleTablePageChange = (nextPage) => {
    setTableParams((currentParams) => ({
      ...currentParams,
      page: nextPage,
    }));
  };

  const handleRowsPerPageChange = (nextLimit) => {
    setTableParams((currentParams) => ({
      ...currentParams,
      page: 1,
      limit: nextLimit,
    }));
  };

  const openShippingDetails = async (order) => {
    setSelectedOrder(order);
    setShippingDetailsOpen(true);
    setLoadingShippingDetails(true);

    try {
      setSelectedOrder(await fetchAdminOrder(authToken, order.id));
    } catch (err) {
      toast.error(err.message || "Failed to load shipping details.");
      setShippingDetailsOpen(false);
      setSelectedOrder(null);
    } finally {
      setLoadingShippingDetails(false);
    }
  };

  const refreshSelectedOrder = async (orderId) => {
    const nextOrder = await fetchAdminOrder(authToken, orderId);

    setSelectedOrder(nextOrder);
    await loadOrders();

    return nextOrder;
  };

  const runShipmentAction = async (action, successMessage) => {
    if (!selectedOrder?.id) {
      return;
    }

    setShipmentActionLoading(true);

    try {
      await action();
      await refreshSelectedOrder(selectedOrder.id);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message || "Failed to update shipment.");
    } finally {
      setShipmentActionLoading(false);
    }
  };

  const handleMarkPacked = async (payload) => {
    await runShipmentAction(
      () => markAdminOrderPacked(authToken, selectedOrder.id, payload),
      "Order marked packed.",
    );
  };

  const handleCreateShipment = async (payload) => {
    await runShipmentAction(
      () => createAdminShipment(authToken, selectedOrder.id, payload),
      "Shipment created.",
    );
  };

  const handleUpdateShipmentStatus = async (shipmentId, payload) => {
    await runShipmentAction(
      () => updateAdminShipmentStatus(authToken, shipmentId, payload),
      "Shipment updated.",
    );
  };

  const handleCancelShipment = async (shipmentId, payload) => {
    await runShipmentAction(
      () => cancelAdminShipment(authToken, shipmentId, payload),
      "Shipment cancelled.",
    );
  };

  const closeShippingDetails = () => {
    if (shipmentActionLoading) {
      return;
    }

    setShippingDetailsOpen(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <SectionHeader title="Shipping" />

      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: "100%", minWidth: 0, borderRadius: 2, overflow: "hidden" }}
      >
        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", xl: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Shipment Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pack paid orders, create shipments, and update delivery status.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search order, customer, or destination"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              sx={{ minWidth: { xs: "100%", md: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <Tooltip title="Clear search">
                      <IconButton edge="end" size="small" onClick={() => setSearchInput("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null,
              }}
            />

            <TextField
              select
              size="small"
              label="Order Status"
              value={tableParams.status || "all"}
              onChange={handleStatusChange}
              sx={{ minWidth: { xs: "100%", md: 170 } }}
            >
              {ORDER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Payment"
              value={tableParams.paymentStatus || "all"}
              onChange={handlePaymentStatusChange}
              sx={{ minWidth: { xs: "100%", md: 160 } }}
            >
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}

          <ShippingOrderTable
            rows={orders}
            loading={loading}
            error={error}
            pagination={pagination}
            onView={openShippingDetails}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Paper>

      <ShipmentManagementDialog
        actionLoading={shipmentActionLoading}
        loading={loadingShippingDetails}
        onCancelShipment={handleCancelShipment}
        onClose={closeShippingDetails}
        onCreateShipment={handleCreateShipment}
        onMarkPacked={handleMarkPacked}
        onUpdateShipmentStatus={handleUpdateShipmentStatus}
        open={shippingDetailsOpen}
        order={selectedOrder}
      />
    </>
  );
};

export default Shipping;
