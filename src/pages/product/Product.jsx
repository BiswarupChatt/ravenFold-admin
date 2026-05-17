import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

import SectionHeader from "@/components/SectionHeader";
import { fetchAdminCategoryTree } from "@/lib/api/categoryApi";
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  updateProduct,
} from "@/lib/api/productApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { useToast } from "@/hooks/ToastContext";
import AddEditProductModal from "./components/AddEditProductModal";
import DeleteProductModal from "./components/DeleteProductModal";
import ProductTable from "./components/ProductTable";

const EMPTY_FORM = {
  name: "",
  slug: "",
  categoryId: "",
  sku: "",
  basePrice: "",
  salePrice: "",
  status: "draft",
  shortDescription: "",
  description: "",
  imageUrls: "",
  tags: "",
  hasVariants: false,
  isFeatured: false,
};

const DEFAULT_TABLE_PARAMS = {
  page: 1,
  limit: 10,
};

const DEFAULT_PAGINATION = {
  page: DEFAULT_TABLE_PARAMS.page,
  limit: DEFAULT_TABLE_PARAMS.limit,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const PRODUCT_STATUSES = ["draft", "active", "inactive"];

const HIERARCHY_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#be123c",
];

const getHierarchyColor = (depth = 0) => {
  return HIERARCHY_COLORS[depth % HIERARCHY_COLORS.length];
};

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

const splitLines = (value) => {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const splitTags = (value) => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildPayload = (formData) => {
  const payload = {
    name: formData.name.trim(),
    categoryId: formData.categoryId,
    sku: formData.sku.trim(),
    basePrice: formData.basePrice,
    salePrice: formData.salePrice === "" ? null : formData.salePrice,
    status: formData.status,
    shortDescription: formData.shortDescription.trim(),
    description: formData.description.trim(),
    images: splitLines(formData.imageUrls),
    tags: splitTags(formData.tags),
    hasVariants: Boolean(formData.hasVariants),
    isFeatured: Boolean(formData.isFeatured),
  };

  if (formData.slug.trim()) {
    payload.slug = formData.slug.trim();
  }

  return payload;
};

const productToFormData = (product) => {
  return {
    name: product.name || "",
    slug: product.slug || "",
    categoryId: product.categoryId || "",
    sku: product.sku || "",
    basePrice: product.basePrice === null || product.basePrice === undefined
      ? ""
      : String(product.basePrice),
    salePrice: product.salePrice === null || product.salePrice === undefined
      ? ""
      : String(product.salePrice),
    status: product.status || "draft",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    imageUrls: Array.isArray(product.images) ? product.images.join("\n") : "",
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    hasVariants: Boolean(product.hasVariants),
    isFeatured: Boolean(product.isFeatured),
  };
};

const Product = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState(EMPTY_FORM);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
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
      const [productList, nextCategoryTree] = await Promise.all([
        fetchAdminProducts(authToken, tableParams),
        fetchAdminCategoryTree(authToken),
      ]);

      setProducts(productList.items);
      setPagination(productList.pagination);
      setCategoryTree(nextCategoryTree);
    } catch (err) {
      setError(err.message || "Failed to load products.");
      setProducts([]);
      setCategoryTree([]);
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
    loadProducts();
  }, [loadProducts]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData(createFormData);
    setFormError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData(productToFormData(product));
    setFormError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setFormError("");
    setEditingProduct(null);
  };

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData((currentFormData) => {
      const nextFormData = {
        ...currentFormData,
        [name]: type === "checkbox" ? checked : value,
      };

      if (!editingProduct) {
        setCreateFormData(nextFormData);
      }

      return nextFormData;
    });
  };

  const handleClearForm = () => {
    setCreateFormData(EMPTY_FORM);
    setFormData(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async () => {
    const payload = buildPayload(formData);
    const basePrice = Number(payload.basePrice);
    const salePrice = payload.salePrice === null ? null : Number(payload.salePrice);

    if (!payload.name) {
      setFormError("Product name is required.");
      return;
    }

    if (!payload.categoryId) {
      setFormError("Category is required.");
      return;
    }

    if (!payload.sku) {
      setFormError("SKU is required.");
      return;
    }

    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setFormError("Base price must be a valid non-negative number.");
      return;
    }

    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0)) {
      setFormError("Sale price must be a valid non-negative number.");
      return;
    }

    if (salePrice !== null && salePrice > basePrice) {
      setFormError("Sale price cannot be greater than base price.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingProduct) {
        await updateProduct(authToken, editingProduct.id, payload);
        toast.success("Product updated successfully.");
      } else {
        await createProduct(authToken, payload);
        toast.success("Product created successfully.");
        setCreateFormData(EMPTY_FORM);
        setFormData(EMPTY_FORM);
      }

      setDialogOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      setFormError(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
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
    setTableParams({
      page: 1,
      limit: nextLimit,
    });
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
            <Typography variant="body2" color="text.secondary">
              Manage products, pricing, visibility, and catalog metadata.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Refresh products">
              <span>
                <IconButton
                  color="primary"
                  onClick={loadProducts}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
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
            onEdit={handleOpenEdit}
            onDelete={setDeletingProduct}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Paper>

      <AddEditProductModal
        open={dialogOpen}
        formData={formData}
        formError={formError}
        saving={saving}
        editingProduct={editingProduct}
        categoryRows={categoryRows}
        productStatuses={PRODUCT_STATUSES}
        getHierarchyColor={getHierarchyColor}
        onClose={handleCloseDialog}
        onClear={handleClearForm}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />

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
