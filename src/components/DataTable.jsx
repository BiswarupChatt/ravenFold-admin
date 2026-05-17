import {
  Box,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const getValue = (row, field) => {
  if (!field) {
    return null;
  }

  return field.split(".").reduce((value, key) => value?.[key], row);
};

const getColumnKey = (column, index) => column.id || column.field || column.header || index;

const DataTable = ({
  columns = [],
  rows = [],
  getRowId = (row) => row.id,
  hoverRows = true,
  loading = false,
  error = "",
  loadingMessage = "Loading records...",
  emptyMessage = "No records found.",
  size = "small",
  minWidth = 840,
  maxWidth = "100%",
  pagination = null,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
}) => {
  const colSpan = Math.max(columns.length, 1);
  const tableRows = Array.isArray(rows) ? rows : [];
  const hasRows = tableRows.length > 0;
  const hasError = Boolean(error);
  const hasPagination = Boolean(pagination);
  const page = Math.max(Number(pagination?.page ?? 1) - 1, 0);
  const rowsPerPage = Number(pagination?.limit ?? rowsPerPageOptions[0]);
  const count = Number(pagination?.total ?? tableRows.length);

  const handlePageChange = (_event, nextPage) => {
    pagination?.onPageChange?.(nextPage + 1);
  };

  const handleRowsPerPageChange = (event) => {
    pagination?.onRowsPerPageChange?.(Number(event.target.value));
  };

  return (
    <Box sx={{ width: "100%", maxWidth, minWidth: 0, overflow: "hidden" }}>
      <TableContainer sx={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
        <Table size={size} sx={{ minWidth }}>
          <TableHead>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell
                  key={getColumnKey(column, columnIndex)}
                  align={column.align}
                  sx={{
                    width: column.width,
                    minWidth: column.minWidth,
                    ...column.headerSx,
                  }}
                >
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 4 }}>
                    <CircularProgress size={22} />
                    <Typography variant="body2" color="text.secondary">
                      {loadingMessage}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && !hasError && !hasRows ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && !hasError
              ? tableRows.map((row, rowIndex) => (
                  <TableRow key={getRowId(row, rowIndex)} hover={hoverRows}>
                    {columns.map((column, columnIndex) => (
                      <TableCell
                        key={getColumnKey(column, columnIndex)}
                        align={column.align}
                        sx={column.cellSx}
                      >
                        {column.render
                          ? column.render(row, rowIndex)
                          : getValue(row, column.field) ?? "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </TableContainer>

      {hasPagination ? (
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          slotProps={{
            actions: {
              previousButton: {
                disabled: loading || page === 0,
              },
              nextButton: {
                disabled: loading || page >= Math.max(Math.ceil(count / rowsPerPage) - 1, 0),
              },
            },
            select: {
              disabled: loading,
            },
          }}
        />
      ) : null}
    </Box>
  );
};

export default DataTable;
