import {
  Box,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import DataTable from "@/components/DataTable";

const CategoryTable = ({
  rows,
  loading,
  error,
  pagination,
  statusUpdatingId,
  getHierarchyColor,
  onToggleStatus,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const categoryColumns = [
    {
      id: "category",
      header: "Category",
      minWidth: 260,
      render: (category) => (
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
      ),
    },
    {
      id: "parent",
      header: "Parent",
      minWidth: 160,
      render: (category) => category.parentName,
    },
    {
      id: "image",
      header: "Image",
      minWidth: 220,
      render: (category) =>
        category.image ? (
          <Typography variant="body2" color="primary" noWrap sx={{ maxWidth: 220 }}>
            {category.image}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ),
    },
    {
      id: "status",
      header: "Status",
      minWidth: 160,
      render: (category) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch
            size="small"
            checked={category.isActive}
            disabled={statusUpdatingId === category.id}
            onChange={() => onToggleStatus(category)}
            inputProps={{ "aria-label": `toggle ${category.name} status` }}
          />
          <Typography
            variant="body2"
            color={category.isActive ? "success.main" : "text.secondary"}
          >
            {category.isActive ? "Active" : "Inactive"}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "children",
      header: "Children",
      align: "right",
      minWidth: 110,
      render: (category) => category.childCount,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      minWidth: 140,
      render: (category) => (
        <>
          <Tooltip title="Edit category">
            <IconButton size="small" onClick={() => onEdit(category)}>
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
                onClick={() => onDelete(category)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <DataTable
      columns={categoryColumns}
      rows={rows}
      loading={loading}
      error={error}
      loadingMessage="Loading categories..."
      emptyMessage="No categories found."
      minWidth={1050}
      pagination={{
        ...pagination,
        onPageChange,
        onRowsPerPageChange,
      }}
    />
  );
};

export default CategoryTable;
