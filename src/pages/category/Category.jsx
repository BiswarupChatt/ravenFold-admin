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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";

import SectionHeader from "@/components/SectionHeader";
import {
  createCategory,
  deleteCategory,
  fetchAdminCategoryTree,
  updateCategory,
} from "@/lib/api/categoryApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { useToast } from "@/hooks/ToastContext";
import AddEditCategoryModal from "./components/AddEditCategoryModal";
import DeleteCategoryModal from "./components/DeleteCategoryModal";

const EMPTY_FORM = {
  name: "",
  slug: "",
  parentCategoryId: "",
  image: "",
  isActive: true,
};

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

const flattenCategoryTree = (items = [], depth = 0, parentName = "Root") => {
  return items.flatMap((category) => {
    const children = Array.isArray(category.children) ? category.children : [];
    const row = {
      ...category,
      depth,
      parentName,
      childCount: children.length,
    };

    return [
      row,
      ...flattenCategoryTree(children, depth + 1, category.name),
    ];
  });
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
    name: formData.name.trim(),
    parentCategoryId: formData.parentCategoryId || null,
    image: formData.image.trim(),
    isActive: Boolean(formData.isActive),
  };

  if (formData.slug.trim()) {
    payload.slug = formData.slug.trim();
  }

  return payload;
};

const Category = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const categoryRows = useMemo(() => flattenCategoryTree(categories), [categories]);

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
      const categoryTree = await fetchAdminCategoryTree(authToken);

      setCategories(categoryTree);
    } catch (err) {
      setError(err.message || "Failed to load categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
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
  };

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      }

      setDialogOpen(false);
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

  return (
    <>
      <SectionHeader title="Category" />

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
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

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Refresh categories">
              <span>
                <IconButton
                  color="primary"
                  onClick={loadCategories}
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
              Add Category
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

          <TableContainer>
            <Table size="small" sx={{ minWidth: 840 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Children</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 4 }}>
                        <CircularProgress size={22} />
                        <Typography variant="body2" color="text.secondary">
                          Loading categories...
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!loading && !error && categoryRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ py: 5, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          No categories found.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!loading
                  ? categoryRows.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              pl: category.depth * 3,
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                bgcolor: getHierarchyColor(category.depth),
                                boxShadow: `0 0 0 3px ${getHierarchyColor(category.depth)}22`,
                                flexShrink: 0,
                              }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {category.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {category.slug || "-"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{category.parentName}</TableCell>
                        <TableCell>
                          {category.image ? (
                            <Typography variant="body2" color="primary" noWrap sx={{ maxWidth: 160 }}>
                              {category.image}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Switch
                              size="small"
                              checked={category.isActive}
                              disabled={statusUpdatingId === category.id}
                              onChange={() => handleToggleStatus(category)}
                              inputProps={{ "aria-label": `toggle ${category.name} status` }}
                            />
                            <Typography
                              variant="body2"
                              color={category.isActive ? "success.main" : "text.secondary"}
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{category.childCount}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit category">
                            <IconButton size="small" onClick={() => handleOpenEdit(category)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              category.childCount > 0
                                ? "Delete child categories first"
                                : "Delete category"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={category.childCount > 0}
                                onClick={() => setDeletingCategory(category)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          </TableContainer>
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
