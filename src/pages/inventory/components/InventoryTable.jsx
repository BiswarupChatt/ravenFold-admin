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

const getStockStatus = (stock) => {
  if (!stock.trackInventory) {
    return { label: "Untracked", color: "default" };
  }

  if (stock.isLowStock) {
    return { label: "Low stock", color: "warning" };
  }

  if (Number(stock.availableQuantity || 0) <= 0) {
    return { label: stock.allowBackorder ? "Backorder" : "Out of stock", color: "error" };
  }

  return { label: "Healthy", color: "success" };
};

const getAvailabilityPercent = (stock) => {
  const stockOnHand = Number(stock.stockOnHand || 0);
  const availableQuantity = Number(stock.availableQuantity || 0);

  if (stockOnHand <= 0) {
    return 0;
  }

  return Math.min(Math.max((availableQuantity / stockOnHand) * 100, 0), 100);
};

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
      minWidth: 320,
      render: (stock) => (
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>
            {stock.product?.name || stock.productId || "-"}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary">
              {stock.variant ? getVariantLabel(stock.variant) : stock.product?.sku || "Simple product"}
            </Typography>
          </Stack>
        </Stack>
      ),
    },
    {
      id: "availability",
      header: "Availability",
      minWidth: 240,
      render: (stock) => {
        const percent = getAvailabilityPercent(stock);
        const barColor = stock.isLowStock ? "warning.main" : "success.main";

        return (
          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
              <Typography variant="body2" fontWeight={700}>
                {formatNumber(stock.availableQuantity)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                available
              </Typography>
            </Stack>
            <Box sx={{ height: 6, borderRadius: 999, bgcolor: "action.hover", overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${percent}%`,
                  minWidth: percent > 0 ? 8 : 0,
                  height: "100%",
                  borderRadius: 999,
                  bgcolor: barColor,
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatNumber(stock.stockOnHand)} on hand
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: "stockOnHand",
      header: "On Hand",
      align: "right",
      minWidth: 110,
      render: (stock) => (
        <Typography variant="body2" fontWeight={700}>
          {formatNumber(stock.stockOnHand)}
        </Typography>
      ),
    },
    {
      id: "reserved",
      header: "Reserved",
      align: "right",
      minWidth: 110,
      render: (stock) => (
        <Typography variant="body2" color={stock.reservedQuantity > 0 ? "warning.main" : "text.primary"}>
          {formatNumber(stock.reservedQuantity)}
        </Typography>
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
      id: "status",
      header: "Status",
      minWidth: 130,
      render: (stock) => {
        const status = getStockStatus(stock);

        return (
          <Stack spacing={0.75} alignItems="flex-start">
            <Chip
              size="small"
              label={status.label}
              color={status.color}
              variant={status.color === "default" ? "outlined" : "filled"}
            />
            {stock.allowBackorder && status.label !== "Backorder" ? (
              <Typography variant="caption" color="text.secondary">
                Backorder allowed
              </Typography>
            ) : null}
          </Stack>
        );
      },
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
      minWidth={1360}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
    />
  );
};

export default InventoryTable;
