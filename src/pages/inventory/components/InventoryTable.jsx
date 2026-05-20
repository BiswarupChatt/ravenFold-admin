import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import SyncAltIcon from "@mui/icons-material/SyncAlt";

import DataTable from "@/components/DataTable";
import { formatDateTime, formatNumber, getVariantLabel } from "./inventoryFormatters";

const InventoryTable = ({
  rows,
  loading,
  pagination,
  onEdit,
  onAdjust,
  onDelete,
  onHistory,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const inventoryColumns = [
    {
      id: "target",
      header: "Item",
      minWidth: 280,
      render: (stock) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>
            {stock.product?.name || stock.productId || "-"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stock.variant ? getVariantLabel(stock.variant) : stock.product?.sku || "Simple product"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "stock",
      header: "Stock",
      minWidth: 220,
      render: (stock) => (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`On hand ${formatNumber(stock.stockOnHand)}`} />
          <Chip size="small" label={`Reserved ${formatNumber(stock.reservedQuantity)}`} variant="outlined" />
          <Chip
            size="small"
            label={`Available ${formatNumber(stock.availableQuantity)}`}
            color={stock.isLowStock ? "warning" : "success"}
            variant={stock.isLowStock ? "filled" : "outlined"}
          />
        </Stack>
      ),
    },
    {
      id: "threshold",
      header: "Threshold",
      align: "right",
      minWidth: 120,
      render: (stock) => formatNumber(stock.lowStockThreshold),
    },
    {
      id: "tracking",
      header: "Tracking",
      minWidth: 160,
      render: (stock) => (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={stock.trackInventory ? "Tracked" : "Untracked"}
            color={stock.trackInventory ? "primary" : "default"}
            variant={stock.trackInventory ? "filled" : "outlined"}
          />
          {stock.allowBackorder ? <Chip size="small" label="Backorder" color="warning" /> : null}
        </Stack>
      ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      minWidth: 160,
      render: (stock) => formatDateTime(stock.updatedAt),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      minWidth: 170,
      render: (stock) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit stock">
            <IconButton size="small" onClick={() => onEdit(stock)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Adjust stock">
            <IconButton size="small" onClick={() => onAdjust(stock)}>
              <SyncAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Movement history">
            <IconButton size="small" onClick={() => onHistory(stock)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={stock.reservedQuantity > 0 ? "Release reservations before deleting" : "Delete stock"}>
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(stock)}
                disabled={stock.reservedQuantity > 0}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      columns={inventoryColumns}
      rows={rows}
      loading={loading}
      loadingMessage="Loading inventory..."
      emptyMessage="No inventory stock records found."
      minWidth={1220}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
    />
  );
};

export default InventoryTable;
