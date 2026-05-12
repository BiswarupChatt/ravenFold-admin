import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import SectionHeader from "@/components/SectionHeader";
import {
  fetchProducts,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
} from "@/lib/api/productsApi";

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Title A-Z", value: "title" },
  { label: "Title Z-A", value: "-title" },
  { label: "Recently updated", value: "updated" },
];

const formatLabel = (value) => {
  if (!value) return "-";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "archived":
      return "default";
    default:
      return "info";
  }
};

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    productType: "",
    sort: "newest",
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchProducts({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        status: filters.status,
        productType: filters.productType,
        sort: filters.sort,
      });

      setProducts(result.products || []);
      setPagination((current) => ({
        ...current,
        ...(result.pagination || {}),
      }));
    } catch (err) {
      setProducts([]);
      setError(err.message || "Unable to fetch products.");
    } finally {
      setLoading(false);
    }
  }, [
    filters.productType,
    filters.search,
    filters.sort,
    filters.status,
    pagination.limit,
    pagination.page,
  ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({
      ...current,
      search: searchInput.trim(),
    }));
  };

  const handleFilterChange = (field) => (event) => {
    setPagination((current) => ({ ...current, page: 1 }));
    setFilters((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handlePageChange = (_, pageIndex) => {
    setPagination((current) => ({
      ...current,
      page: pageIndex + 1,
    }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination((current) => ({
      ...current,
      page: 1,
      limit: Number(event.target.value),
    }));
  };

  const openProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <>
      <SectionHeader title="Products" />

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Stack
          component="form"
          onSubmit={handleSearchSubmit}
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", lg: "center" }}
        >
          <TextField
            label="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: { lg: 260 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            label="Status"
            value={filters.status}
            onChange={handleFilterChange("status")}
            size="small"
            sx={{ minWidth: { xs: "100%", lg: 160 } }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {PRODUCT_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {formatLabel(status)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Type"
            value={filters.productType}
            onChange={handleFilterChange("productType")}
            size="small"
            sx={{ minWidth: { xs: "100%", lg: 160 } }}
          >
            <MenuItem value="">All types</MenuItem>
            {PRODUCT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {formatLabel(type)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Sort"
            value={filters.sort}
            onChange={handleFilterChange("sort")}
            size="small"
            sx={{ minWidth: { xs: "100%", lg: 180 } }}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={1}>
            <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
              Search
            </Button>
            <Tooltip title="Refresh products">
              <IconButton onClick={loadProducts} aria-label="Refresh products">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table sx={{ minWidth: 900 }} aria-label="Products table">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="center">Variants</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Open</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                hover
                onClick={() => openProduct(product.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {product.title || "Untitled product"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {product.id}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{product.slug || "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={formatLabel(product.status)}
                    color={getStatusColor(product.status)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatLabel(product.productType)}</TableCell>
                <TableCell align="center">{product.hasVariants ? "Yes" : "No"}</TableCell>
                <TableCell sx={{ maxWidth: 220 }}>
                  <Typography variant="body2" noWrap>
                    {product.tags?.length ? product.tags.join(", ") : "-"}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {formatDate(product.updatedAt)}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Open product">
                    <IconButton
                      aria-label={`Open ${product.title || "product"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        openProduct(product.id);
                      }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {!loading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No products found.</Typography>
                </TableCell>
              </TableRow>
            )}

            {loading && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Loading products...</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total}
          page={Math.max(pagination.page - 1, 0)}
          rowsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>
    </>
  );
}
