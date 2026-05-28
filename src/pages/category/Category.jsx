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
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  fetchAdminCategoryTree,
  updateCategory,
} from "@/lib/api/categoryApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  CATEGORY_DEFAULT_PAGINATION as DEFAULT_PAGINATION,
  CATEGORY_TABLE_PARAMS as DEFAULT_TABLE_PARAMS,
  SEARCH_DEBOUNCE_MS,
  flattenCategoryTree,
  getHierarchyColor,
  normalizeText,
} from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import AddEditCategoryModal from "./components/AddEditCategoryModal";
import CategoryTable from "./components/CategoryTable";
import DeleteCategoryModal from "./components/DeleteCategoryModal";

const EMPTY_FORM = {
  name: "",
  slug: "",
  parentCategoryId: "",
  image: "",
  isActive: true,
};

const collectDescendantIds = (category) => {
  const children = Array.isArray(category?.children) ? category.children : [];

  return children.flatMap((child) => [
    child.id,
    ...collectDescendantIds(child),
  ]);
};

const buildPayload = (formData) => {
  const payload = {
    name: normalizeText(formData.name),
    parentCategoryId: formData.parentCategoryId || null,
    image: normalizeText(formData.image),
    isActive: Boolean(formData.isActive),
  };

  const slug = normalizeText(formData.slug);

  if (slug) {
    payload.slug = slug;
  }

  return payload;
};

const Category = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [categories, setCategories] = useState([]);
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
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const categoryRows = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);

  const categoryMetaById = useMemo(() => {
    return new Map(categoryRows.map((category) => [category.id, category]));
  }, [categoryRows]);

  const categoryTableRows = useMemo(() => {
    return categories.flatMap((category) => {
      const categoryMeta = categoryMetaById.get(category.id);
      const parentCategory = category.parentCategoryId
        ? categoryMetaById.get(category.parentCategoryId)
        : null;

      const categoryWithMeta = {
        ...category,
        children: categoryMeta?.children || [],
        childCount: categoryMeta?.childCount || 0,
        depth: categoryMeta?.depth || 0,
        parentName: categoryMeta?.parentName || parentCategory?.name || "Root",
      };

      return flattenCategoryTree([categoryWithMeta], categoryWithMeta.depth, categoryWithMeta.parentName);
    });
  }, [categories, categoryMetaById]);

  const disabledParentIds = useMemo(() => {
    if (!editingCategory) {
      return new Set();
    }

    return new Set([
      editingCategory.id,
      ...collectDescendantIds(editingCategory),
    ]);
  }, [editingCategory]);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryList, nextCategoryTree] = await Promise.all([
        fetchAdminCategories(authToken, tableParams),
        fetchAdminCategoryTree(authToken),
      ]);

      setCategories(categoryList.items);
      setPagination(categoryList.pagination);
      setCategoryTree(nextCategoryTree);
    } catch (err) {
      setError(err.message || "Failed to load categories.");
      setCategories([]);
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
    loadCategories();
  }, [loadCategories]);

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
    setEditingCategory(null);
    setFormData(createFormData);
    setFormError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (category) => {
    const editableCategory = categoryMetaById.get(category.id) || category;

    setEditingCategory(editableCategory);
    setFormData({
      name: category.name || "",
      slug: category.slug || "",
      parentCategoryId: category.parentCategoryId || "",
      image: category.image || "",
      isActive: Boolean(category.isActive),
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setFormError("");
    setEditingCategory(null);
  };

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData((currentFormData) => {
      const nextFormData = {
        ...currentFormData,
        [name]: type === "checkbox" ? checked : value,
      };

      if (!editingCategory) {
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

    if (!payload.name) {
      setFormError("Category name is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingCategory) {
        await updateCategory(authToken, editingCategory.id, payload);
        toast.success("Category updated successfully.");
      } else {
        await createCategory(authToken, payload);
        toast.success("Category created successfully.");
        setCreateFormData(EMPTY_FORM);
        setFormData(EMPTY_FORM);
      }

      setDialogOpen(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (err) {
      setFormError(err.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (category) => {
    const nextIsActive = !category.isActive;

    setStatusUpdatingId(category.id);
    setError("");

    try {
      await updateCategory(authToken, category.id, { isActive: nextIsActive });
      toast.success(
        nextIsActive
          ? "Category activated successfully."
          : "Category deactivated successfully."
      );
      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to update category status.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteCategory(authToken, deletingCategory.id);
      toast.success("Category deleted successfully.");
      setDeletingCategory(null);
      await loadCategories();
    } catch (err) {
      setError(err.message || "Failed to delete category.");
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
      rootOnly: true,
    }));
  };

  return (
    <>
      <SectionHeader title="Category" />

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
              Category Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage category hierarchy, visibility, and metadata.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search categories"
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
                Add Category
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

          <CategoryTable
            rows={categoryTableRows}
            loading={loading}
            error={error}
            pagination={pagination}
            statusUpdatingId={statusUpdatingId}
            getHierarchyColor={getHierarchyColor}
            onToggleStatus={handleToggleStatus}
            onEdit={handleOpenEdit}
            onDelete={setDeletingCategory}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Paper>

      <AddEditCategoryModal
        open={dialogOpen}
        formData={formData}
        formError={formError}
        saving={saving}
        editingCategory={editingCategory}
        categoryRows={categoryRows}
        disabledParentIds={disabledParentIds}
        getHierarchyColor={getHierarchyColor}
        onClose={handleCloseDialog}
        onClear={handleClearForm}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
      />

      <DeleteCategoryModal
        open={Boolean(deletingCategory)}
        category={deletingCategory}
        deleting={deleting}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default Category;
