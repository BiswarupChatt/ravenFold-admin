import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddBusinessIcon from '@mui/icons-material/AddBusiness';

import DataTable from "@/components/DataTable";

const statusColors = {
  active: "success",
  draft: "default",
  inactive: "warning",
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const ProductTable = ({
  rows,
  loading,
  error,
  pagination,
  onView,
  onAddStock,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const productColumns = [
    {
      id: "product",
      header: "Product",
      minWidth: 260,
      render: (product) => {
        const primaryImage = Array.isArray(product.images) ? product.images[0] : "";

        return (
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1,
                bgcolor: "action.hover",
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {primaryImage ? (
                <Box
                  component="img"
                  src={primaryImage}
                  alt=""
                  loading="lazy"
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="button"
                type="button"
                variant="body2"
                fontWeight={600}
                noWrap
                onClick={() => onView(product)}
                sx={{
                  display: "block",
                  width: "100%",
                  p: 0,
                  border: 0,
                  bgcolor: "transparent",
                  color: "primary.main",
                  cursor: "pointer",
                  font: "inherit",
                  fontWeight: 600,
                  textAlign: "left",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                {product.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {product.slug || "-"}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      minWidth: 180,
      render: (product) => product.categoryName || "-",
    },
    {
      id: "sku",
      header: "SKU",
      minWidth: 150,
      render: (product) => product.sku || "-",
    },
    {
      id: "price",
      header: "Price",
      align: "right",
      minWidth: 150,
      render: (product) => (
        <Box>
          <Typography variant="body2">{formatMoney(product.basePrice)}</Typography>
          {product.salePrice !== null && product.salePrice !== undefined ? (
            <Typography variant="caption" color="success.main">
              Sale {formatMoney(product.salePrice)}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      id: "status",
      header: "Status",
      minWidth: 120,
      render: (product) => (
        <Chip
          size="small"
          label={product.status || "draft"}
          color={statusColors[product.status] || "default"}
          variant={product.status === "draft" ? "outlined" : "filled"}
        />
      ),
    },
    {
      id: "flags",
      header: "Flags",
      minWidth: 180,
      render: (product) => (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {product.hasVariants ? <Chip size="small" label="Variants" /> : null}
          {product.isFeatured ? <Chip size="small" label="Featured" color="primary" /> : null}
          {!product.hasVariants && !product.isFeatured ? (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          ) : null}
        </Stack>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      minWidth: 130,
      render: (product) => formatDate(product.createdAt),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      minWidth: 130,
      render: (product) => (
        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
          <Tooltip title="Add stock">
            <IconButton size="small" color="primary" aria-label="Add stock" onClick={() => onAddStock(product)}>
              <AddBusinessIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete product">
            <IconButton size="small" color="error" onClick={() => onDelete(product)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      columns={productColumns}
      rows={rows}
      loading={loading}
      error={error}
      loadingMessage="Loading products..."
      emptyMessage="No products found."
      minWidth={1300}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
    />
  );
};

export default ProductTable;
