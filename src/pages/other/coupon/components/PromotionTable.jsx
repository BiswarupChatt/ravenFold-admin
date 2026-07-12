import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import DataTable from "@/components/DataTable";
import { formatCurrency, formatDateTime } from "@/lib/utils/utils";

const humanizeValue = (value = "") => (
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(" ")
);

const getScopeLabel = (promotion) => {
  if (promotion.type === "PRODUCT_DISCOUNT") {
    return `${promotion.productIds?.length || 0} product${promotion.productIds?.length === 1 ? "" : "s"}`;
  }

  if (promotion.type === "CATEGORY_DISCOUNT") {
    return `${promotion.categoryIds?.length || 0} categor${promotion.categoryIds?.length === 1 ? "y" : "ies"}`;
  }

  if (promotion.applicableOn === "SPECIFIC_PRODUCTS") {
    return `${promotion.productIds?.length || 0} product${promotion.productIds?.length === 1 ? "" : "s"}`;
  }

  if (promotion.applicableOn === "SPECIFIC_CATEGORIES") {
    return `${promotion.categoryIds?.length || 0} categor${promotion.categoryIds?.length === 1 ? "y" : "ies"}`;
  }

  return "All products";
};

const getDiscountLabel = (promotion) => {
  if (promotion.type === "FREE_SHIPPING") {
    return "Free shipping";
  }

  if (promotion.type === "BUY_X_GET_Y") {
    return `Buy ${promotion.buyQuantity || 0} / Get ${promotion.getQuantity || 0}`;
  }

  if (promotion.discountValue === null || promotion.discountValue === undefined || promotion.discountValue === "") {
    return "-";
  }

  if (promotion.discountMethod === "FIXED" || promotion.type === "FIXED_DISCOUNT") {
    return formatCurrency(promotion.discountValue);
  }

  return `${Number(promotion.discountValue)}%`;
};

const PromotionTable = ({
  deletingId = "",
  error = "",
  loading = false,
  pagination,
  rows = [],
  statusUpdatingId = "",
  onDelete,
  onEdit,
  onPageChange,
  onRowsPerPageChange,
  onToggleStatus,
}) => {
  const columns = [
    {
      header: "Promotion",
      minWidth: 240,
      render: (promotion) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {promotion.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {promotion.couponCode || humanizeValue(promotion.type)}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Type",
      minWidth: 180,
      render: (promotion) => (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={humanizeValue(promotion.type)} />
          {promotion.isAutomatic ? <Chip size="small" color="info" variant="outlined" label="Auto" /> : null}
          {promotion.isStackable ? <Chip size="small" color="secondary" variant="outlined" label="Stackable" /> : null}
        </Stack>
      ),
    },
    {
      header: "Scope",
      minWidth: 170,
      render: (promotion) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2">{getScopeLabel(promotion)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {humanizeValue(promotion.applicableOn)}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Discount",
      minWidth: 170,
      render: (promotion) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700}>
            {getDiscountLabel(promotion)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Used {Number(promotion.usedCount || 0).toLocaleString()} time{Number(promotion.usedCount || 0) === 1 ? "" : "s"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Schedule",
      minWidth: 190,
      render: (promotion) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2">
            {promotion.startDate ? formatDateTime(promotion.startDate) : "Starts immediately"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {promotion.endDate ? `Ends ${formatDateTime(promotion.endDate)}` : "No expiry"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Status",
      minWidth: 150,
      render: (promotion) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={promotion.isActive ? "Active" : "Inactive"}
            color={promotion.isActive ? "success" : "default"}
            size="small"
            variant={promotion.isActive ? "filled" : "outlined"}
          />
          {statusUpdatingId === promotion.id ? (
            <CircularProgress size={18} />
          ) : (
            <Switch
              checked={Boolean(promotion.isActive)}
              size="small"
              onChange={() => onToggleStatus(promotion)}
            />
          )}
        </Stack>
      ),
    },
    {
      align: "right",
      header: "Actions",
      minWidth: 120,
      render: (promotion) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit promotion">
            <IconButton size="small" onClick={() => onEdit(promotion)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete promotion">
            <span>
              <IconButton
                color="error"
                disabled={deletingId === promotion.id}
                size="small"
                onClick={() => onDelete(promotion)}
              >
                {deletingId === promotion.id ? <CircularProgress color="inherit" size={16} /> : <DeleteOutlineIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="No promotions found."
      error={error}
      getRowId={(row) => row.id}
      loading={loading}
      loadingMessage="Loading promotions..."
      minWidth={1180}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
      rows={rows}
    />
  );
};

export default PromotionTable;
