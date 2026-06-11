import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import DataTable from "@/components/DataTable";

const formatLocationMeta = (location = {}) => (
  [location.city, location.state, location.pincode].filter(Boolean).join(", ")
);

const PickupLocationTable = ({
  deletingId = "",
  error = "",
  loading = false,
  pagination,
  rows = [],
  statusUpdatingId = "",
  onDelete,
  onEdit,
  onPageChange,
  onRowsPerPageChange,
  onToggleStatus,
}) => {
  const columns = [
    {
      id: "location",
      header: "Location",
      minWidth: 260,
      render: (location) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {location.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {location.code}
          </Typography>
        </Box>
      ),
    },
    {
      id: "pickupLocation",
      header: "Pickup Alias",
      minWidth: 220,
      render: (location) => (
        <Typography variant="body2">
          {location.pickupLocation || "-"}
        </Typography>
      ),
    },
    {
      id: "address",
      header: "Address",
      minWidth: 280,
      render: (location) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {location.addressLine1 || "-"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {formatLocationMeta(location) || location.country || "-"}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      minWidth: 140,
      render: (location) => (
        <Typography variant="body2">
          {location.phone || "-"}
        </Typography>
      ),
    },
    {
      id: "status",
      header: "Status",
      minWidth: 150,
      render: (location) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={location.isActive ? "Active" : "Inactive"}
            color={location.isActive ? "success" : "default"}
            size="small"
            variant={location.isActive ? "filled" : "outlined"}
          />
          {statusUpdatingId === location.id ? (
            <CircularProgress size={18} />
          ) : (
            <Switch
              checked={Boolean(location.isActive)}
              size="small"
              onChange={() => onToggleStatus(location)}
            />
          )}
        </Stack>
      ),
    },
    {
      id: "actions",
      align: "right",
      header: "Actions",
      minWidth: 120,
      render: (location) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit pickup location">
            <IconButton size="small" onClick={() => onEdit(location)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete pickup location">
            <span>
              <IconButton
                color="error"
                disabled={deletingId === location.id}
                size="small"
                onClick={() => onDelete(location)}
              >
                {deletingId === location.id ? <CircularProgress color="inherit" size={16} /> : <DeleteOutlineIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      emptyMessage="No pickup locations found."
      error={error}
      getRowId={(row) => row.id}
      loading={loading}
      loadingMessage="Loading pickup locations..."
      minWidth={1170}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
      rows={rows}
    />
  );
};

export default PickupLocationTable;
