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
import { fetchAdminCart, fetchAdminCarts } from "@/lib/api/cartApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { DEFAULT_PAGINATION, DEFAULT_TABLE_PARAMS, SEARCH_DEBOUNCE_MS } from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import CartDetailsDialog from "./components/CartDetailsDialog";
import CartTable from "./components/CartTable";
import { CART_STATUS_OPTIONS } from "./components/cartFormatters";

const Cart = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [carts, setCarts] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartDetailsOpen, setCartDetailsOpen] = useState(false);
  const [selectedCart, setSelectedCart] = useState(null);
  const [loadingCartDetails, setLoadingCartDetails] = useState(false);

  const loadCarts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const cartList = await fetchAdminCarts(authToken, tableParams);

      setCarts(cartList.items);
      setPagination(cartList.pagination);
    } catch (err) {
      const message = err.message || "Failed to load carts.";

      setError(message);
      setCarts([]);
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
    loadCarts();
  }, [loadCarts]);

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

  const openCartDetails = async (cart) => {
    setSelectedCart(cart);
    setCartDetailsOpen(true);
    setLoadingCartDetails(true);

    try {
      setSelectedCart(await fetchAdminCart(authToken, cart.id));
    } catch (err) {
      toast.error(err.message || "Failed to load cart details.");
      setCartDetailsOpen(false);
      setSelectedCart(null);
    } finally {
      setLoadingCartDetails(false);
    }
  };

  const closeCartDetails = () => {
    setCartDetailsOpen(false);
    setSelectedCart(null);
  };

  return (
    <>
      <SectionHeader title="Cart" />

      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: "100%", minWidth: 0, borderRadius: 2, overflow: "hidden" }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Customer Carts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Carts listed here have at least one item.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search customer or item"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              sx={{ minWidth: { xs: "100%", md: 280 } }}
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
              label="Status"
              value={tableParams.status || "all"}
              onChange={handleStatusChange}
              sx={{ minWidth: { xs: "100%", md: 180 } }}
            >
              {CART_STATUS_OPTIONS.map((status) => (
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

          <CartTable
            rows={carts}
            loading={loading}
            error={error}
            pagination={pagination}
            onView={openCartDetails}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Paper>

      <CartDetailsDialog
        open={cartDetailsOpen}
        cart={selectedCart}
        loading={loadingCartDetails}
        onClose={closeCartDetails}
      />
    </>
  );
};

export default Cart;
