import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import DataTable from "@/components/DataTable";
import SectionHeader from "@/components/SectionHeader";
import {
  deletePolicy,
  fetchAdminPolicies,
  publishPolicy,
  unpublishPolicy,
} from "@/lib/api/policyPageApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  DEFAULT_PAGINATION,
  DEFAULT_TABLE_PARAMS,
  SEARCH_DEBOUNCE_MS,
  formatDateTime,
} from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import ROUTES from "@/routes/routes";

const STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

const PolicyPages = () => {
  const authToken = useAtomValue(authTokenAtom);
  const navigate = useNavigate();
  const toast = useToast();
  const [policies, setPolicies] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionPolicy, setActionPolicy] = useState(null);
  const [actionType, setActionType] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const search = searchInput.trim();

      setTableParams((currentParams) => {
        if ((currentParams.search || "") === search) {
          return currentParams;
        }

        const nextParams = { ...currentParams, page: 1 };

        if (search) {
          nextParams.search = search;
        } else {
          delete nextParams.search;
        }

        return nextParams;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo(() => ({
    ...tableParams,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  }), [statusFilter, tableParams]);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const policyList = await fetchAdminPolicies(authToken, queryParams);

      setPolicies(policyList.items);
      setPagination(policyList.pagination);
    } catch (err) {
      setError(err.message || "Failed to load policy pages.");
      setPolicies([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, queryParams, tableParams.limit, tableParams.page]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const openAction = (policy, type) => {
    setActionPolicy(policy);
    setActionType(type);
  };

  const closeAction = () => {
    if (acting) {
      return;
    }

    setActionPolicy(null);
    setActionType("");
  };

  const handleConfirmAction = async () => {
    if (!actionPolicy || !actionType) {
      return;
    }

    setActing(true);
    setError("");

    try {
      if (actionType === "publish") {
        await publishPolicy(authToken, actionPolicy.id, {});
        toast.success("Policy published successfully.");
      } else if (actionType === "unpublish") {
        await unpublishPolicy(authToken, actionPolicy.id);
        toast.success("Policy unpublished successfully.");
      } else if (actionType === "delete") {
        await deletePolicy(authToken, actionPolicy.id);
        toast.success("Policy deleted successfully.");
      }

      setActionPolicy(null);
      setActionType("");
      await loadPolicies();
    } catch (err) {
      setError(err.message || "Policy action failed.");
    } finally {
      setActing(false);
    }
  };

  const columns = [
    {
      header: "Policy",
      minWidth: 300,
      render: (policy) => (
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" fontWeight={700}>
              {policy.title}
            </Typography>
            {policy.isSystemPolicy ? <Chip label="System" size="small" variant="outlined" /> : null}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            /{policy.slug}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Status",
      minWidth: 130,
      render: (policy) => (
        <Chip
          color={policy.status === "published" ? "success" : "default"}
          label={policy.status === "published" ? "Published" : "Draft"}
          size="small"
          variant={policy.status === "published" ? "filled" : "outlined"}
        />
      ),
    },
    {
      align: "center",
      header: "Published",
      minWidth: 120,
      render: (policy) => (
        <Tooltip title={policy.status === "published" ? "Unpublish policy" : "Publish policy"}>
          <span>
            <Switch
              checked={policy.status === "published"}
              disabled={acting || (policy.status !== "published" && !policy.contentText)}
              onChange={() => openAction(policy, policy.status === "published" ? "unpublish" : "publish")}
              size="small"
            />
          </span>
        </Tooltip>
      ),
    },
    {
      header: "Footer",
      minWidth: 180,
      render: (policy) => (
        <Box sx={{ minWidth: 0 }}>
          <Chip
            color={policy.showInFooter ? "success" : "default"}
            label={policy.showInFooter ? "Visible" : "Hidden"}
            size="small"
            variant={policy.showInFooter ? "filled" : "outlined"}
          />
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {policy.showInFooter ? policy.footerLabel || policy.title : "Not shown in footer"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Updated",
      minWidth: 220,
      render: (policy) => (
        <Box>
          <Typography variant="body2">{formatDateTime(policy.updatedAt)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {policy.updatedBy?.name || policy.updatedBy?.email || "Unknown user"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Version",
      minWidth: 100,
      render: (policy) => `v${policy.version || 1}`,
    },
    {
      align: "right",
      header: "Actions",
      minWidth: 120,
      render: (policy) => (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <Tooltip title="Edit policy">
            <IconButton size="small" onClick={() => navigate(`${ROUTES.POLICY_PAGES}/${policy.id}/edit`)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={policy.isSystemPolicy ? "System policies cannot be deleted" : "Delete policy"}>
            <span>
              <IconButton
                color="error"
                disabled={policy.isSystemPolicy}
                size="small"
                onClick={() => openAction(policy, "delete")}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const actionLabel = actionType === "delete"
    ? "Delete Policy"
    : actionType === "unpublish"
      ? "Unpublish Policy"
      : "Publish Policy";

  return (
    <>
      <SectionHeader title="Policy Pages" />

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Policy Page Management
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Manage draft and published storefront legal content.
            </Typography>
          </Box>

          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => navigate(`${ROUTES.POLICY_PAGES}/new`)}
          >
            Add Policy
          </Button>
        </Stack>

        <Divider />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ p: 2 }}
        >
          <TextField
            label="Search"
            size="small"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            InputProps={{
              endAdornment: searchInput ? (
                <Tooltip title="Clear search">
                  <IconButton size="small" onClick={() => setSearchInput("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null,
            }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Status"
            select
            size="small"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setTableParams((currentParams) => ({ ...currentParams, page: 1 }));
            }}
            sx={{ minWidth: 180 }}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Box sx={{ px: 2, pb: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}

          <DataTable
            columns={columns}
            emptyMessage="No policy pages found."
            error={error}
            getRowId={(row) => row.id}
            loading={loading}
            loadingMessage="Loading policy pages..."
            minWidth={1290}
            pagination={{
              ...pagination,
              onPageChange: (nextPage) => {
                setTableParams((currentParams) => ({
                  ...currentParams,
                  page: nextPage,
                }));
              },
              onRowsPerPageChange: (nextLimit) => {
                setTableParams((currentParams) => ({
                  ...currentParams,
                  limit: nextLimit,
                  page: 1,
                }));
              },
            }}
            rows={policies}
          />
        </Box>
      </Paper>

      <Dialog open={Boolean(actionPolicy)} onClose={closeAction} maxWidth="xs" fullWidth>
        <DialogTitle>{actionLabel}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            {actionType === "delete"
              ? `Delete ${actionPolicy?.title || "this policy"}?`
              : actionType === "unpublish"
                ? `Unpublish ${actionPolicy?.title || "this policy"}?`
                : `Publish ${actionPolicy?.title || "this policy"}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={acting} onClick={closeAction}>
            Cancel
          </Button>
          <Button
            color={actionType === "delete" ? "error" : "primary"}
            disabled={acting}
            onClick={handleConfirmAction}
            startIcon={acting ? <CircularProgress color="inherit" size={16} /> : null}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PolicyPages;
