import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

import SectionHeader from "@/components/SectionHeader";
import { fetchAdminCategoryTree } from "@/lib/api/categoryApi";
import { deleteProduct, fetchAdminProducts } from "@/lib/api/productApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  DEFAULT_PAGINATION,
  DEFAULT_TABLE_PARAMS,
  SEARCH_DEBOUNCE_MS,
} from "@/lib/utils/adminShared";
import { useToast } from "@/hooks/ToastContext";
import ROUTES from "@/routes/routes";
import DeleteProductModal from "./components/DeleteProductModal";
import ProductTable from "./components/ProductTable";

const flattenCategoryTree = (items = [], depth = 0) => {
  return items.flatMap((category) => {
    const children = Array.isArray(category.children) ? category.children : [];
    const row = {
      ...category,
      depth,
    };

    return [
      row,
      ...flattenCategoryTree(children, depth + 1),
    ];
  });
};

const Product = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categoryRows = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  const categoryNameById = useMemo(() => {
    return new Map(categoryRows.map((category) => [category.id, category.name]));
  }, [categoryRows]);

  const productRows = useMemo(() => {
    return products.map((product) => ({
      ...product,
      categoryName: categoryNameById.get(product.categoryId) || "-",
    }));
  }, [categoryNameById, products]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const productList = await fetchAdminProducts(authToken, tableParams);

      setProducts(productList.items);
      setPagination(productList.pagination);
    } catch (err) {
      setError(err.message || "Failed to load products.");
      setProducts([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, tableParams]);

  const loadCategoryTree = useCallback(async () => {
    try {
      setCategoryTree(await fetchAdminCategoryTree(authToken));
    } catch (err) {
      setError(err.message || "Failed to load product categories.");
      setCategoryTree([]);
    }
  }, [authToken]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCategoryTree();
  }, [loadCategoryTree]);

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

  const handleViewProduct = (product) => {
    navigate(`${ROUTES.PRODUCT}/${product.id}`);
  };

  const handleDelete = async () => {
    if (!deletingProduct) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteProduct(authToken, deletingProduct.id);
      toast.success("Product deleted successfully.");
      setDeletingProduct(null);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
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

  return (
    <>
      <SectionHeader title="Product" />

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
              Product Management
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search products"
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

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`${ROUTES.PRODUCT}/new`)}
            >
              Add Product
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <ProductTable
            rows={productRows}
            loading={loading}
            error={error}
            pagination={pagination}
            onView={handleViewProduct}
            onDelete={setDeletingProduct}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Paper>

      <DeleteProductModal
        open={Boolean(deletingProduct)}
        product={deletingProduct}
        deleting={deleting}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default Product;
