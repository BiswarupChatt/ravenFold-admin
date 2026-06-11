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
import { fetchAdminBoxTypes } from "@/lib/api/boxTypeApi";
import { fetchAdminOrder, fetchAdminOrders, updateAdminOrderStatus } from "@/lib/api/orderApi";
import {
  cancelAdminShipment,
  createAdminShipment,
  fetchAdminPickupLocations,
  updateAdminShipmentStatus,
} from "@/lib/api/shippingApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { DEFAULT_PAGINATION, DEFAULT_TABLE_PARAMS, SEARCH_DEBOUNCE_MS } from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import OrderDetailsDialog from "./components/OrderDetailsDialog";
import OrderTable from "./components/OrderTable";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "./components/orderFormatters";

const Order = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [boxTypes, setBoxTypes] = useState([]);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [fulfillmentActionLoading, setFulfillmentActionLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const orderList = await fetchAdminOrders(authToken, tableParams);

      setOrders(orderList.items);
      setPagination(orderList.pagination);
    } catch (err) {
      const message = err.message || "Failed to load orders.";

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

  const openOrderDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
    setLoadingOrderDetails(true);

    try {
      const [nextOrder, boxTypeList, pickupLocationList] = await Promise.all([
        fetchAdminOrder(authToken, order.id),
        fetchAdminBoxTypes(authToken, { isActive: true, limit: 100 }),
        fetchAdminPickupLocations(authToken, { isActive: true, limit: 100 }),
      ]);

      setSelectedOrder(nextOrder);
      setBoxTypes(boxTypeList.items);
      setPickupLocations(pickupLocationList.items);
    } catch (err) {
      toast.error(err.message || "Failed to load order details.");
      setOrderDetailsOpen(false);
      setSelectedOrder(null);
      setBoxTypes([]);
      setPickupLocations([]);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const refreshSelectedOrder = async (orderId) => {
    const nextOrder = await fetchAdminOrder(authToken, orderId);

    setSelectedOrder(nextOrder);
    await loadOrders();

    return nextOrder;
  };

  const runFulfillmentAction = async (action, successMessage, errorMessage = "Failed to update fulfilment.") => {
    if (!selectedOrder?.id) {
      return;
    }

    setFulfillmentActionLoading(true);

    try {
      await action();
      await refreshSelectedOrder(selectedOrder.id);
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message || errorMessage);
    } finally {
      setFulfillmentActionLoading(false);
    }
  };

  const handleCreateShipment = async (payload) => {
    await runFulfillmentAction(
      () => createAdminShipment(authToken, selectedOrder.id, payload),
      "Shipment created.",
      "Failed to create shipment.",
    );
  };

  const handleUpdateShipmentStatus = async (shipmentId, payload) => {
    await runFulfillmentAction(
      () => updateAdminShipmentStatus(authToken, shipmentId, payload),
      "Shipment updated.",
      "Failed to update shipment.",
    );
  };

  const handleCancelShipment = async (shipmentId, payload) => {
    await runFulfillmentAction(
      () => cancelAdminShipment(authToken, shipmentId, payload),
      "Shipment cancelled.",
      "Failed to cancel shipment.",
    );
  };

  const handleUpdateOrderStatus = async (payload) => {
    await runFulfillmentAction(
      () => updateAdminOrderStatus(authToken, selectedOrder.id, payload),
      "Order status updated.",
      "Failed to update order status.",
    );
  };

  const closeOrderDetails = () => {
    if (fulfillmentActionLoading) {
      return;
    }

    setOrderDetailsOpen(false);
    setSelectedOrder(null);
    setBoxTypes([]);
    setPickupLocations([]);
  };

  return (
    <>
      <SectionHeader title="Order" />

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
              Customer Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track checkout orders, payment state, and customer snapshots.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search order, customer, or item"
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

          <OrderTable
            rows={orders}
            loading={loading}
            error={error}
            pagination={pagination}
            onView={openOrderDetails}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Paper>

      <OrderDetailsDialog
        actionLoading={fulfillmentActionLoading}
        boxTypes={boxTypes}
        open={orderDetailsOpen}
        order={selectedOrder}
        loading={loadingOrderDetails}
        onCancelShipment={handleCancelShipment}
        onClose={closeOrderDetails}
        onCreateShipment={handleCreateShipment}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        pickupLocations={pickupLocations}
        onUpdateShipmentStatus={handleUpdateShipmentStatus}
      />
    </>
  );
};

export default Order;
