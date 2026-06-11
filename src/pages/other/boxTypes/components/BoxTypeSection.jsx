import { useCallback, useEffect, useState } from "react";
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

import {
  createBoxType,
  deleteBoxType,
  fetchAdminBoxTypes,
  updateBoxType,
} from "@/lib/api/boxTypeApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  DEFAULT_PAGINATION,
  DEFAULT_TABLE_PARAMS,
  SEARCH_DEBOUNCE_MS,
  normalizeText,
} from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import BoxTypeDialog from "./BoxTypeDialog";
import BoxTypeTable from "./BoxTypeTable";
import DeleteBoxTypeDialog from "./DeleteBoxTypeDialog";

const EMPTY_FORM = {
  breadth: "",
  code: "",
  height: "",
  isActive: true,
  length: "",
  name: "",
  weight: "",
};

const toFormData = (boxType = {}) => ({
  breadth: boxType.breadth === null || boxType.breadth === undefined ? "" : String(boxType.breadth),
  code: boxType.code || "",
  height: boxType.height === null || boxType.height === undefined ? "" : String(boxType.height),
  isActive: boxType.isActive !== false,
  length: boxType.length === null || boxType.length === undefined ? "" : String(boxType.length),
  name: boxType.name || "",
  weight: boxType.weight === null || boxType.weight === undefined ? "" : String(boxType.weight),
});

const buildPayload = (formData) => {
  const payload = {
    breadth: formData.breadth,
    height: formData.height,
    isActive: Boolean(formData.isActive),
    length: formData.length,
    name: normalizeText(formData.name),
    weight: formData.weight,
  };
  const code = normalizeText(formData.code);

  if (code) {
    payload.code = code;
  }

  return payload;
};

const validatePayload = (payload) => {
  if (!payload.name) {
    return "Name is required.";
  }

  for (const [label, value] of [
    ["Length", payload.length],
    ["Breadth", payload.breadth],
    ["Height", payload.height],
    ["Weight", payload.weight],
  ]) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      return `${label} must be greater than 0.`;
    }
  }

  return "";
};

const BoxTypeSection = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [boxTypes, setBoxTypes] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState(EMPTY_FORM);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [editingBoxType, setEditingBoxType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingBoxType, setDeletingBoxType] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const loadBoxTypes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const boxTypeList = await fetchAdminBoxTypes(authToken, tableParams);

      setBoxTypes(boxTypeList.items);
      setPagination(boxTypeList.pagination);
    } catch (err) {
      setError(err.message || "Failed to load box types.");
      setBoxTypes([]);
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
    loadBoxTypes();
  }, [loadBoxTypes]);

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
    setEditingBoxType(null);
    setFormData(createFormData);
    setFormError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (boxType) => {
    setEditingBoxType(boxType);
    setFormData(toFormData(boxType));
    setFormError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setFormError("");
    setEditingBoxType(null);
  };

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setFormData((currentFormData) => {
      const nextFormData = {
        ...currentFormData,
        [name]: type === "checkbox" ? checked : value,
      };

      if (!editingBoxType) {
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
    const validationError = validatePayload(payload);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingBoxType) {
        await updateBoxType(authToken, editingBoxType.id, payload);
        toast.success("Box type updated successfully.");
      } else {
        await createBoxType(authToken, payload);
        toast.success("Box type created successfully.");
        setCreateFormData(EMPTY_FORM);
        setFormData(EMPTY_FORM);
      }

      setDialogOpen(false);
      setEditingBoxType(null);
      await loadBoxTypes();
    } catch (err) {
      setFormError(err.message || "Failed to save box type.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (boxType) => {
    const nextIsActive = !boxType.isActive;

    setStatusUpdatingId(boxType.id);
    setError("");

    try {
      await updateBoxType(authToken, boxType.id, { isActive: nextIsActive });
      toast.success(nextIsActive ? "Box type activated successfully." : "Box type deactivated successfully.");
      await loadBoxTypes();
    } catch (err) {
      setError(err.message || "Failed to update box type status.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleDelete = async () => {
    if (!deletingBoxType) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteBoxType(authToken, deletingBoxType.id);
      toast.success("Box type deleted successfully.");
      setDeletingBoxType(null);
      await loadBoxTypes();
    } catch (err) {
      setError(err.message || "Failed to delete box type.");
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
              Box Type Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage reusable package sizes for shipment creation.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search box types"
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
                      <IconButton edge="end" size="small" onClick={() => setSearchInput("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null,
              }}
            />

            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleOpenCreate}
            >
              Add Box Type
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}

          <BoxTypeTable
            deletingId={deletingBoxType?.id || ""}
            error={error}
            loading={loading}
            pagination={pagination}
            rows={boxTypes}
            statusUpdatingId={statusUpdatingId}
            onDelete={setDeletingBoxType}
            onEdit={handleOpenEdit}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onToggleStatus={handleToggleStatus}
          />
        </Box>
      </Paper>

      <BoxTypeDialog
        editingBoxType={editingBoxType}
        formData={formData}
        formError={formError}
        open={dialogOpen}
        saving={saving}
        onChange={handleFormChange}
        onClear={handleClearForm}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      <DeleteBoxTypeDialog
        boxType={deletingBoxType}
        deleting={deleting}
        open={Boolean(deletingBoxType)}
        onClose={() => setDeletingBoxType(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default BoxTypeSection;
