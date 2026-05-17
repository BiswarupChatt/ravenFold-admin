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
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const productColumns = [
    {
      id: "product",
      header: "Product",
      minWidth: 260,
      render: (product) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {product.slug || "-"}
          </Typography>
        </Box>
      ),
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
      minWidth: 140,
      render: (product) => (
        <>
          <Tooltip title="Edit product">
            <IconButton size="small" onClick={() => onEdit(product)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete product">
            <IconButton size="small" color="error" onClick={() => onDelete(product)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
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
      minWidth={1270}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
    />
  );
};

export default ProductTable;
