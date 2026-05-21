import { useCallback, useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Box,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

import SectionHeader from "@/components/SectionHeader";
import {
  adjustInventoryStock,
  deleteInventoryStock,
  fetchAdminInventoryStocks,
  fetchAdminStockMovements,
  updateInventoryStock,
} from "@/lib/api/inventoryApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { DEFAULT_PAGINATION, DEFAULT_TABLE_PARAMS, SEARCH_DEBOUNCE_MS } from "@/lib/utils/adminShared";
import { useToast } from "@/hooks/ToastContext";
import AdjustStockDialog from "./components/AdjustStockDialog";
import DeleteInventoryStockDialog from "./components/DeleteInventoryStockDialog";
import EditInventoryStockDialog from "./components/EditInventoryStockDialog";
import InventoryTable from "./components/InventoryTable";
import StockMovementsDialog from "./components/StockMovementsDialog";

const EMPTY_STOCK_FORM = {
  stockOnHand: "0",
  reservedQuantity: "0",
  lowStockThreshold: "5",
  trackInventory: true,
  allowBackorder: false,
};

const EMPTY_ADJUSTMENT_FORM = {
  quantity: "",
  note: "",
};

const MOVEMENT_TABLE_PARAMS = {
  page: 1,
  limit: 10,
};

const isNonNegativeInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;

const isNonZeroInteger = (value) => Number.isInteger(Number(value)) && Number(value) !== 0;

const buildStockFormFromStock = (stock) => ({
  stockOnHand: String(stock?.stockOnHand ?? 0),
  reservedQuantity: String(stock?.reservedQuantity ?? 0),
  lowStockThreshold: String(stock?.lowStockThreshold ?? 5),
  trackInventory: stock?.trackInventory !== false,
  allowBackorder: Boolean(stock?.allowBackorder),
});

const Inventory = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [stocks, setStocks] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK_FORM);
  const [stockFormError, setStockFormError] = useState("");
  const [savingStock, setSavingStock] = useState(false);
  const [adjustingStock, setAdjustingStock] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState(EMPTY_ADJUSTMENT_FORM);
  const [adjustmentError, setAdjustmentError] = useState("");
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [deletingStock, setDeletingStock] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [movementStock, setMovementStock] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movementParams, setMovementParams] = useState(MOVEMENT_TABLE_PARAMS);
  const [movementPagination, setMovementPagination] = useState(DEFAULT_PAGINATION);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const loadInventoryStocks = useCallback(async () => {
    setLoading(true);

    try {
      const stockList = await fetchAdminInventoryStocks(authToken, tableParams);

      setStocks(stockList.items);
      setPagination(stockList.pagination);
    } catch (err) {
      toast.error(err.message || "Failed to load inventory.");
      setStocks([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, tableParams, toast]);

  const loadStockMovements = useCallback(async () => {
    if (!movementStock?.id) {
      return;
    }

    setLoadingMovements(true);

    try {
      const movementList = await fetchAdminStockMovements(authToken, {
        ...movementParams,
        inventoryStockId: movementStock.id,
      });

      setMovements(movementList.items);
      setMovementPagination(movementList.pagination);
    } catch (err) {
      toast.error(err.message || "Failed to load stock movements.");
      setMovements([]);
      setMovementPagination({
        ...DEFAULT_PAGINATION,
        limit: movementParams.limit,
        page: movementParams.page,
      });
    } finally {
      setLoadingMovements(false);
    }
  }, [authToken, movementParams, movementStock, toast]);

  useEffect(() => {
    loadInventoryStocks();
  }, [loadInventoryStocks]);

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

  useEffect(() => {
    loadStockMovements();
  }, [loadStockMovements]);

  const openEditDialog = (stock) => {
    setEditingStock(stock);
    setStockForm(buildStockFormFromStock(stock));
    setStockFormError("");
    setStockDialogOpen(true);
  };

  const closeStockDialog = () => {
    if (savingStock) {
      return;
    }

    setStockDialogOpen(false);
    setEditingStock(null);
    setStockForm(EMPTY_STOCK_FORM);
    setStockFormError("");
  };

  const handleStockFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setStockForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateStockForm = () => {
    if (!isNonNegativeInteger(stockForm.stockOnHand)) {
      return "Stock on hand must be a non-negative whole number.";
    }

    if (!isNonNegativeInteger(stockForm.reservedQuantity)) {
      return "Reserved quantity must be a non-negative whole number.";
    }

    if (!isNonNegativeInteger(stockForm.lowStockThreshold)) {
      return "Low stock threshold must be a non-negative whole number.";
    }

    if (!stockForm.allowBackorder && Number(stockForm.reservedQuantity) > Number(stockForm.stockOnHand)) {
      return "Reserved quantity cannot exceed stock on hand unless backorders are allowed.";
    }

    return "";
  };

  const buildStockPayload = () => {
    const stockPayload = {
      stockOnHand: Number(stockForm.stockOnHand),
      reservedQuantity: Number(stockForm.reservedQuantity),
      lowStockThreshold: Number(stockForm.lowStockThreshold),
      trackInventory: Boolean(stockForm.trackInventory),
      allowBackorder: Boolean(stockForm.allowBackorder),
    };

    return stockPayload;
  };

  const handleSaveStock = async () => {
    if (!editingStock?.id) {
      return;
    }

    const validationError = validateStockForm();

    if (validationError) {
      setStockFormError(validationError);
      return;
    }

    setSavingStock(true);
    setStockFormError("");

    try {
      await updateInventoryStock(authToken, editingStock.id, buildStockPayload());
      toast.success("Inventory stock updated.");

      closeStockDialog();
      await loadInventoryStocks();
    } catch (err) {
      setStockFormError(err.message || "Failed to save inventory stock.");
    } finally {
      setSavingStock(false);
    }
  };

  const openAdjustmentDialog = (stock) => {
    setAdjustingStock(stock);
    setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
    setAdjustmentError("");
  };

  const closeAdjustmentDialog = () => {
    if (savingAdjustment) {
      return;
    }

    setAdjustingStock(null);
    setAdjustmentForm(EMPTY_ADJUSTMENT_FORM);
    setAdjustmentError("");
  };

  const handleAdjustmentFormChange = (event) => {
    const { name, value } = event.target;

    setAdjustmentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSaveAdjustment = async () => {
    if (!adjustingStock?.id) {
      return;
    }

    if (!isNonZeroInteger(adjustmentForm.quantity)) {
      setAdjustmentError("Adjustment quantity must be a non-zero whole number.");
      return;
    }

    setSavingAdjustment(true);
    setAdjustmentError("");

    try {
      await adjustInventoryStock(authToken, {
        inventoryStockId: adjustingStock.id,
        quantity: Number(adjustmentForm.quantity),
        note: adjustmentForm.note,
      });

      toast.success("Inventory adjusted.");
      closeAdjustmentDialog();
      await loadInventoryStocks();
    } catch (err) {
      setAdjustmentError(err.message || "Failed to adjust inventory.");
    } finally {
      setSavingAdjustment(false);
    }
  };

  const handleDeleteStock = async () => {
    if (!deletingStock?.id) {
      return;
    }

    setDeleting(true);

    try {
      await deleteInventoryStock(authToken, deletingStock.id);
      toast.success("Inventory stock deleted.");
      setDeletingStock(null);
      await loadInventoryStocks();
    } catch (err) {
      toast.error(err.message || "Failed to delete inventory stock.");
    } finally {
      setDeleting(false);
    }
  };

  const openMovementDialog = (stock) => {
    setMovementStock(stock);
    setMovementParams(MOVEMENT_TABLE_PARAMS);
  };

  const closeMovementDialog = () => {
    setMovementStock(null);
    setMovements([]);
    setMovementParams(MOVEMENT_TABLE_PARAMS);
    setMovementPagination(DEFAULT_PAGINATION);
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

  const handleMovementPageChange = (nextPage) => {
    setMovementParams((currentParams) => ({
      ...currentParams,
      page: nextPage,
    }));
  };

  const handleMovementRowsPerPageChange = (nextLimit) => {
    setMovementParams({
      page: 1,
      limit: nextLimit,
    });
  };

  const handleLowStockOnlyChange = (event) => {
    const { checked } = event.target;

    setTableParams((currentParams) => {
      const nextParams = {
        ...currentParams,
        page: 1,
      };

      if (checked) {
        nextParams.lowStock = true;
      } else {
        delete nextParams.lowStock;
      }

      return nextParams;
    });
  };

  return (
    <>
      <SectionHeader title="Inventory" />

      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: "100%", minWidth: 0, borderRadius: 2, overflow: "hidden" }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Inventory Management
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField
              size="small"
              placeholder="Search inventory"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <Tooltip title="Clear search">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => setSearchInput("")}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null,
              }}
            />
            <FormControlLabel
              control={(
                <Switch
                  checked={Boolean(tableParams.lowStock)}
                  onChange={handleLowStockOnlyChange}
                />
              )}
              label="Low stock"
            />
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          <InventoryTable
            rows={stocks}
            loading={loading}
            pagination={pagination}
            onEdit={openEditDialog}
            onAdjust={openAdjustmentDialog}
            onDelete={setDeletingStock}
            onHistory={openMovementDialog}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Paper>

      <EditInventoryStockDialog
        open={stockDialogOpen}
        stock={editingStock}
        form={stockForm}
        error={stockFormError}
        saving={savingStock}
        onClose={closeStockDialog}
        onChange={handleStockFormChange}
        onSave={handleSaveStock}
      />

      <AdjustStockDialog
        stock={adjustingStock}
        form={adjustmentForm}
        error={adjustmentError}
        saving={savingAdjustment}
        onClose={closeAdjustmentDialog}
        onChange={handleAdjustmentFormChange}
        onSave={handleSaveAdjustment}
      />

      <DeleteInventoryStockDialog
        stock={deletingStock}
        deleting={deleting}
        onClose={() => setDeletingStock(null)}
        onConfirm={handleDeleteStock}
      />

      <StockMovementsDialog
        stock={movementStock}
        movements={movements}
        loading={loadingMovements}
        pagination={movementPagination}
        onClose={closeMovementDialog}
        onPageChange={handleMovementPageChange}
        onRowsPerPageChange={handleMovementRowsPerPageChange}
      />
    </>
  );
};

export default Inventory;
