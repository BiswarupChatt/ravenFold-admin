import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  updateProduct,
  uploadProductImages,
} from "@/lib/api/productApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { useToast } from "@/hooks/ToastContext";
import AddEditViewProductModal from "./components/AddEditViewProductModal";
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

const SEARCH_DEBOUNCE_MS = 400;

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

const joinLines = (items = []) => items.join("\n");

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
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState(EMPTY_FORM);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
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
    if (saving || uploadingImages) {
      return;
    }

    setDialogOpen(false);
    setFormError("");
    setEditingProduct(null);
  };

  const setModalFormData = useCallback((nextFormDataOrUpdater) => {
    setFormData((currentFormData) => {
      const nextFormData = typeof nextFormDataOrUpdater === "function"
        ? nextFormDataOrUpdater(currentFormData)
        : nextFormDataOrUpdater;

      if (!editingProduct) {
        setCreateFormData(nextFormData);
      }

      return nextFormData;
    });
  }, [editingProduct]);

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setModalFormData((currentFormData) => ({
      ...currentFormData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImagesChange = useCallback((imageUrls) => {
    setModalFormData((currentFormData) => ({
      ...currentFormData,
      imageUrls: joinLines(imageUrls),
    }));
  }, [setModalFormData]);

  const handleUploadImages = useCallback(async (files) => {
    const fileList = Array.from(files || []);
    const imageFiles = fileList.filter((file) => file.type?.startsWith("image/"));

    if (fileList.length === 0) {
      return [];
    }

    if (imageFiles.length === 0) {
      const message = "Only image files can be uploaded.";

      setFormError(message);
      throw new Error(message);
    }

    if (imageFiles.length !== fileList.length) {
      toast.warning("Non-image files were skipped.");
    }

    setUploadingImages(true);
    setFormError("");

    try {
      const uploadedImages = await uploadProductImages(authToken, imageFiles);
      const uploadedUrls = uploadedImages.map((image) => image.url).filter(Boolean);

      setModalFormData((currentFormData) => ({
        ...currentFormData,
        imageUrls: joinLines([
          ...splitLines(currentFormData.imageUrls),
          ...uploadedUrls,
        ]),
      }));

      toast.success(
        uploadedUrls.length === 1
          ? "Image uploaded successfully."
          : `${uploadedUrls.length} images uploaded successfully.`
      );

      return uploadedUrls;
    } catch (err) {
      setFormError(err.message || "Failed to upload product images.");
      throw err;
    } finally {
      setUploadingImages(false);
    }
  }, [authToken, setModalFormData, toast]);

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
            <Typography variant="body2" color="text.secondary">
              Manage products, pricing, visibility, and catalog metadata.
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

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Add Product
              </Button>
            </Stack>
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

      <AddEditViewProductModal
        open={dialogOpen}
        formData={formData}
        formError={formError}
        saving={saving}
        uploadingImages={uploadingImages}
        editingProduct={editingProduct}
        categoryRows={categoryRows}
        productStatuses={PRODUCT_STATUSES}
        getHierarchyColor={getHierarchyColor}
        onClose={handleCloseDialog}
        onClear={handleClearForm}
        onChange={handleFormChange}
        onImagesChange={handleImagesChange}
        onUploadImages={handleUploadImages}
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
