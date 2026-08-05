import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";

import DataTable from "@/components/DataTable";
import SectionHeader from "@/components/SectionHeader";
import { useToast } from "@/hooks/ToastContext";
import {
  approveAdminReview,
  deleteAdminReview,
  fetchAdminReview,
  fetchAdminReviews,
  hideAdminReview,
  rejectAdminReview,
  restoreAdminReview,
} from "@/lib/api/reviewApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  DEFAULT_PAGINATION,
  DEFAULT_TABLE_PARAMS,
  SEARCH_DEBOUNCE_MS,
  formatDate,
  getUserDisplayName,
} from "@/lib/utils/utils";
import ReviewDetailsDialog from "./ReviewDetailsDialog";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Hidden", value: "HIDDEN" },
];

const RATING_OPTIONS = [
  { label: "All ratings", value: "all" },
  { label: "5 stars", value: "5" },
  { label: "4 stars", value: "4" },
  { label: "3 stars", value: "3" },
  { label: "2 stars", value: "2" },
  { label: "1 star", value: "1" },
];

const STATUS_COLOR = {
  APPROVED: "success",
  HIDDEN: "default",
  PENDING: "warning",
  REJECTED: "error",
};

const getStatusLabel = (status = "") => {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
};

const getActionSuccessMessage = (action) => {
  if (action === "approve") {
    return "Review approved successfully.";
  }

  if (action === "reject") {
    return "Review rejected successfully.";
  }

  if (action === "hide") {
    return "Review hidden successfully.";
  }

  if (action === "restore") {
    return "Review restored successfully.";
  }

  return "Review deleted successfully.";
};

const StatusChip = ({ status = "" }) => (
  <Chip
    color={STATUS_COLOR[status] || "default"}
    label={getStatusLabel(status)}
    size="small"
    variant={status === "HIDDEN" ? "outlined" : "filled"}
  />
);

function Review() {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [reviews, setReviews] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dialogActionLoading, setDialogActionLoading] = useState(false);
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const reviewList = await fetchAdminReviews(authToken, tableParams);

      setReviews(reviewList.items);
      setPagination(reviewList.pagination);
      setPendingCount(reviewList.pendingCount);
    } catch (err) {
      setError(err.message || "Failed to load reviews.");
      setReviews([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  }, [authToken, tableParams]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextSearch = searchInput.trim();

      setTableParams((current) => {
        if ((current.search || "") === nextSearch) {
          return current;
        }

        const nextParams = {
          ...current,
          page: 1,
        };

        if (nextSearch) {
          nextParams.search = nextSearch;
        } else {
          delete nextParams.search;
        }

        return nextParams;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const handleOpenDetails = async (reviewId) => {
    try {
      setSelectedReview(await fetchAdminReview(authToken, reviewId));
      setDetailsOpen(true);
    } catch (loadError) {
      toast.error(loadError.message || "Failed to load review.");
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedReview(null);
  };

  const handleModerationAction = async (action, payload = {}) => {
    if (!selectedReview?.id) {
      return;
    }

    setDialogActionLoading(true);

    try {
      let nextReview = null;

      if (action === "approve") {
        nextReview = await approveAdminReview(authToken, selectedReview.id, payload);
      } else if (action === "reject") {
        nextReview = await rejectAdminReview(authToken, selectedReview.id, payload);
      } else if (action === "delete") {
        await deleteAdminReview(authToken, selectedReview.id);
      }

      toast.success(getActionSuccessMessage(action));
      await loadReviews();

      if (action === "delete") {
        handleCloseDetails();
      } else if (nextReview) {
        setSelectedReview(nextReview);
      }
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update review.");
    } finally {
      setDialogActionLoading(false);
    }
  };

  const handleToggleVisibility = async (review) => {
    if (!review?.id) {
      return;
    }

    const canToggle = review.status === "APPROVED" || review.status === "HIDDEN";

    if (!canToggle) {
      return;
    }

    setVisibilityUpdatingId(review.id);

    try {
      const nextReview = review.status === "APPROVED"
        ? await hideAdminReview(authToken, review.id)
        : await restoreAdminReview(authToken, review.id);

      if (selectedReview?.id === review.id) {
        setSelectedReview(nextReview);
      }

      toast.success(getActionSuccessMessage(review.status === "APPROVED" ? "hide" : "restore"));
      await loadReviews();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update review visibility.");
    } finally {
      setVisibilityUpdatingId("");
    }
  };

  const columns = useMemo(() => ([
    {
      header: "Product",
      minWidth: 240,
      render: (review) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {review.product?.name || review.orderItem?.productSnapshot?.name || "Product"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {review.variant?.label || review.product?.slug || "No variant details"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Customer",
      minWidth: 220,
      render: (review) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {getUserDisplayName(review.customer) || "Customer"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {review.customer?.email || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Review",
      minWidth: 260,
      render: (review) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {review.title || "Customer review"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {review.comment || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Rating",
      minWidth: 90,
      render: (review) => (
        <Typography variant="body2" fontWeight={700}>
          {Number(review.rating || 0)}/5
        </Typography>
      ),
    },
    {
      header: "Submitted",
      minWidth: 130,
      render: (review) => formatDate(review.createdAt),
    },
    {
      header: "Status",
      minWidth: 130,
      render: (review) => <StatusChip status={review.status} />,
    },
    {
      header: "Visible",
      minWidth: 170,
      render: (review) => {
        const canToggle = review.status === "APPROVED" || review.status === "HIDDEN";
        const isVisible = review.status === "APPROVED";
        const visibilityLabel = review.status === "APPROVED"
          ? "Visible"
          : review.status === "HIDDEN"
            ? "Hidden"
            : "Admin only";

        return (
          <Stack direction="row" spacing={1} alignItems="center">
            {visibilityUpdatingId === review.id ? (
              <CircularProgress size={18} />
            ) : (
              <Switch
                checked={isVisible}
                disabled={!canToggle}
                inputProps={{ "aria-label": `toggle ${review.product?.name || "review"} visibility` }}
                size="small"
                onChange={() => handleToggleVisibility(review)}
              />
            )}
          </Stack>
        );
      },
    },
    {
      align: "right",
      header: "Actions",
      minWidth: 90,
      render: (review) => (
        <Tooltip title="View review details">
          <IconButton size="small" onClick={() => handleOpenDetails(review.id)}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ]), [handleOpenDetails, visibilityUpdatingId]);

  return (
    <Stack spacing={2}>
      <SectionHeader title="Review" />

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Stack
          alignItems={{ xs: "stretch", xl: "center" }}
          direction={{ xs: "column", xl: "row" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Review Moderation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending reviews: {pendingCount}
            </Typography>
          </Box>

          <Stack
            alignItems={{ xs: "stretch", md: "center" }}
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
          >
            <TextField
              size="small"
              placeholder="Search product, customer, email, order, or review text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              sx={{ minWidth: { xs: "100%", md: 320 } }}
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
              size="small"
              label="Status"
              value={tableParams.status || "all"}
              onChange={(event) => {
                const nextStatus = event.target.value;

                setTableParams((current) => {
                  const nextParams = {
                    ...current,
                    page: 1,
                  };

                  if (nextStatus === "all") {
                    delete nextParams.status;
                  } else {
                    nextParams.status = nextStatus;
                  }

                  return nextParams;
                });
              }}
              sx={{ minWidth: { xs: "100%", md: 160 } }}
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Rating"
              value={tableParams.rating || "all"}
              onChange={(event) => {
                const nextRating = event.target.value;

                setTableParams((current) => {
                  const nextParams = {
                    ...current,
                    page: 1,
                  };

                  if (nextRating === "all") {
                    delete nextParams.rating;
                  } else {
                    nextParams.rating = nextRating;
                  }

                  return nextParams;
                });
              }}
              sx={{ minWidth: { xs: "100%", md: 140 } }}
            >
              {RATING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}

          <DataTable
            columns={columns}
            emptyMessage="No reviews found."
            error={error}
            getRowId={(row) => row.id}
            loading={loading}
            loadingMessage="Loading reviews..."
            minWidth={1260}
            pagination={{
              ...pagination,
              onPageChange: (nextPage) => {
                setTableParams((current) => ({
                  ...current,
                  page: nextPage,
                }));
              },
              onRowsPerPageChange: (nextLimit) => {
                setTableParams((current) => ({
                  ...current,
                  limit: nextLimit,
                  page: 1,
                }));
              },
            }}
            rows={reviews}
          />
        </Box>
      </Paper>

      <ReviewDetailsDialog
        onAction={handleModerationAction}
        onClose={handleCloseDetails}
        open={detailsOpen}
        processing={dialogActionLoading}
        review={selectedReview}
      />
    </Stack>
  );
}

export default Review;
