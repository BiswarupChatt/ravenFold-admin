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

const formatDimensions = (boxType) => (
  `${boxType.length ?? "-"} x ${boxType.breadth ?? "-"} x ${boxType.height ?? "-"} cm`
);

const BoxTypeTable = ({
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
      header: "Box Type",
      minWidth: 220,
      render: (boxType) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {boxType.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {boxType.code}
          </Typography>
        </Box>
      ),
    },
    {
      header: "Dimensions",
      minWidth: 190,
      render: (boxType) => (
        <Typography variant="body2">
          {formatDimensions(boxType)}
        </Typography>
      ),
    },
    {
      header: "Weight",
      minWidth: 110,
      render: (boxType) => (
        <Typography variant="body2">
          {boxType.weight ?? "-"} kg
        </Typography>
      ),
    },
    {
      header: "Status",
      minWidth: 150,
      render: (boxType) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={boxType.isActive ? "Active" : "Inactive"}
            color={boxType.isActive ? "success" : "default"}
            size="small"
            variant={boxType.isActive ? "filled" : "outlined"}
          />
          {statusUpdatingId === boxType.id ? (
            <CircularProgress size={18} />
          ) : (
            <Switch
              checked={Boolean(boxType.isActive)}
              size="small"
              onChange={() => onToggleStatus(boxType)}
            />
          )}
        </Stack>
      ),
    },
    {
      align: "right",
      header: "Actions",
      minWidth: 120,
      render: (boxType) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit box type">
            <IconButton size="small" onClick={() => onEdit(boxType)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete box type">
            <span>
              <IconButton
                color="error"
                disabled={deletingId === boxType.id}
                size="small"
                onClick={() => onDelete(boxType)}
              >
                {deletingId === boxType.id ? <CircularProgress color="inherit" size={16} /> : <DeleteOutlineIcon fontSize="small" />}
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
      emptyMessage="No box types found."
      error={error}
      getRowId={(row) => row.id}
      loading={loading}
      loadingMessage="Loading box types..."
      minWidth={860}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
      rows={rows}
    />
  );
};

export default BoxTypeTable;
