import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import DataTable from "@/components/DataTable";
import { formatDateTime, formatNumber, getStockTargetLabel } from "./inventoryFormatters";

const StockMovementsDialog = ({
  stock,
  movements,
  loading,
  pagination,
  onClose,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const movementColumns = [
    {
      id: "type",
      header: "Type",
      minWidth: 150,
      render: (movement) => <Chip size="small" label={movement.type} />,
    },
    {
      id: "quantity",
      header: "Qty",
      align: "right",
      minWidth: 90,
      render: (movement) => (
        <Typography
          variant="body2"
          color={movement.quantity < 0 ? "error.main" : "success.main"}
          fontWeight={700}
        >
          {movement.quantity > 0 ? "+" : ""}
          {formatNumber(movement.quantity)}
        </Typography>
      ),
    },
    {
      id: "stockAfter",
      header: "Stock",
      minWidth: 160,
      render: (movement) => `${formatNumber(movement.stockOnHandBefore)} -> ${formatNumber(movement.stockOnHandAfter)}`,
    },
    {
      id: "reservedAfter",
      header: "Reserved",
      minWidth: 170,
      render: (movement) => (
        `${formatNumber(movement.reservedQuantityBefore)} -> ${formatNumber(movement.reservedQuantityAfter)}`
      ),
    },
    {
      id: "note",
      header: "Note",
      minWidth: 200,
      render: (movement) => movement.note || "-",
    },
    {
      id: "createdAt",
      header: "Created",
      minWidth: 160,
      render: (movement) => formatDateTime(movement.createdAt),
    },
  ];

  return (
    <Dialog open={Boolean(stock)} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Stock Movements</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {stock ? (
            <Alert severity="info">{getStockTargetLabel(stock)}</Alert>
          ) : null}
          <DataTable
            columns={movementColumns}
            rows={movements}
            loading={loading}
            loadingMessage="Loading stock movements..."
            emptyMessage="No stock movements found."
            minWidth={980}
            pagination={{
              ...pagination,
              onPageChange,
              onRowsPerPageChange,
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockMovementsDialog;
