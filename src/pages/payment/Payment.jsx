import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

import DataTable from "@/components/DataTable";
import SectionHeader from "@/components/SectionHeader";
import { useToast } from "@/hooks/ToastContext";
import {
  createAdminRefund,
  fetchAdminPaymentAttempts,
  fetchAdminPayments,
  fetchAdminRefunds,
} from "@/lib/api/paymentApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { DEFAULT_PAGINATION, DEFAULT_TABLE_PARAMS, SEARCH_DEBOUNCE_MS } from "@/lib/utils/utils";
import {
  ATTEMPT_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TABS,
  PROVIDER_OPTIONS,
  REFUND_STATUS_OPTIONS,
  formatPaymentDate,
  formatPaymentMoney,
  getCustomerAvatar,
  getCustomerEmail,
  getCustomerLabel,
  getCustomerPhone,
  getOrderLabel,
  getStatusMeta,
} from "./components/paymentFormatters";
import PaymentRecordDialog from "./components/PaymentRecordDialog";

const getStatusOptions = (tab) => {
  if (tab === "attempts") {
    return ATTEMPT_STATUS_OPTIONS;
  }

  if (tab === "refunds") {
    return REFUND_STATUS_OPTIONS;
  }

  return PAYMENT_STATUS_OPTIONS;
};

const StatusChip = ({ status }) => {
  const meta = getStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  );
};

const getRecordAmount = (record = {}) => record.order?.totalPayable ?? record.amount;

const getRecordTime = (record = {}) => record.paidAt || record.processedAt || record.createdAt;

const getCustomerInitial = (record = {}) => {
  const customer = getCustomerLabel(record);

  return customer && customer !== "-" ? customer.charAt(0).toUpperCase() : "?";
};

const getCompactColumns = ({ onView }) => [
  {
    id: "order",
    header: "Order",
    minWidth: 210,
    render: (record) => (
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {getOrderLabel(record)}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {formatPaymentDate(getRecordTime(record))}
        </Typography>
      </Stack>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    minWidth: 280,
    render: (record) => (
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar
          alt={getCustomerLabel(record)}
          src={getCustomerAvatar(record)}
          slotProps={{
            img: {
              referrerPolicy: "no-referrer",
            },
          }}
          sx={{
            width: 34,
            height: 34,
            fontSize: 14,
            fontWeight: 700,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            border: "1px solid",
            borderColor: "primary.light",
          }}
        >
          {getCustomerInitial(record)}
        </Avatar>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {getCustomerLabel(record)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {getCustomerEmail(record)}
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    id: "mobile",
    header: "Mobile",
    minWidth: 130,
    render: (record) => getCustomerPhone(record),
  },
  {
    id: "amount",
    header: "Order Amount",
    align: "right",
    minWidth: 130,
    render: (record) => formatPaymentMoney(getRecordAmount(record), record.currency),
  },
  {
    id: "status",
    header: "Status",
    minWidth: 150,
    render: (record) => <StatusChip status={record.status} />,
  },
  {
    id: "actions",
    header: "Actions",
    align: "right",
    minWidth: 90,
    render: (record) => (
      <Tooltip title="View payment details">
        <IconButton size="small" onClick={() => onView(record)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
];

const getFetcher = (tab) => {
  if (tab === "attempts") {
    return fetchAdminPaymentAttempts;
  }

  if (tab === "refunds") {
    return fetchAdminRefunds;
  }

  return fetchAdminPayments;
};

function Payment() {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("payments");
  const [rows, setRows] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecordType, setSelectedRecordType] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const statusOptions = getStatusOptions(activeTab);
  const columns = useMemo(
    () => getCompactColumns({
      onView: (record) => {
        setSelectedRecord(record);
        setSelectedRecordType(activeTab);
      },
    }),
    [activeTab],
  );

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const fetcher = getFetcher(activeTab);
      const result = await fetcher(authToken, tableParams);

      setRows(result.items);
      setPagination(result.pagination);
    } catch (err) {
      const message = err.message || "Failed to load payment records.";

      setError(message);
      setRows([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, authToken, tableParams, toast]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

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

  const handleTabChange = (_event, nextTab) => {
    setActiveTab(nextTab);
    setSearchInput("");
    setTableParams(DEFAULT_TABLE_PARAMS);
  };

  const handleProviderChange = (event) => {
    const nextProvider = event.target.value;

    setTableParams((currentParams) => {
      const nextParams = {
        ...currentParams,
        page: 1,
      };

      if (nextProvider === "all") {
        delete nextParams.provider;
      } else {
        nextParams.provider = nextProvider;
      }

      return nextParams;
    });
  };

  const handleStatusChange = (event) => {
    const nextStatus = event.target.value;

    setTableParams((currentParams) => {
      const nextParams = {
        ...currentParams,
        page: 1,
      };

      if (nextStatus === "all") {
        delete nextParams.status;
      } else {
        nextParams.status = nextStatus;
      }

      return nextParams;
    });
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
      limit: nextLimit,
      page: 1,
    }));
  };

  const closeRecordDialog = () => {
    if (refundSubmitting) {
      return;
    }

    setSelectedRecord(null);
    setSelectedRecordType("");
  };

  const handleRefundSubmit = async ({ amount, orderStatus, payment, reason }) => {
    if (!payment) {
      return;
    }

    setRefundSubmitting(true);

    try {
      await createAdminRefund(authToken, {
        amount,
        orderStatus,
        paymentId: payment.id,
        reason,
      });

      toast.success("Refund initiated.");
      setSelectedRecord(null);
      setSelectedRecordType("");
      await loadRecords();
    } catch (err) {
      const message = err.message || "Failed to initiate refund.";

      toast.error(message);
      throw new Error(message);
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <>
      <SectionHeader title="Payment" />

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", xl: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Payment Operations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review captured payments, checkout attempts, and refund logs.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              size="small"
              placeholder="Search provider reference"
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
              label="Provider"
              value={tableParams.provider || "all"}
              onChange={handleProviderChange}
              sx={{ minWidth: { xs: "100%", md: 150 } }}
            >
              {PROVIDER_OPTIONS.map((provider) => (
                <MenuItem key={provider.value} value={provider.value}>
                  {provider.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Status"
              value={tableParams.status || "all"}
              onChange={handleStatusChange}
              sx={{ minWidth: { xs: "100%", md: 180 } }}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        <Divider />

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          {PAYMENT_TABS.map((tab) => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>

        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}

          <DataTable
            columns={columns}
            rows={rows}
            loading={loading}
            error={error}
            emptyMessage="No payment records found."
            minWidth={980}
            pagination={{
              ...pagination,
              onPageChange: handleTablePageChange,
              onRowsPerPageChange: handleRowsPerPageChange,
            }}
          />
        </Box>
      </Paper>

      <PaymentRecordDialog
        onClose={closeRecordDialog}
        onRefund={handleRefundSubmit}
        open={Boolean(selectedRecord)}
        record={selectedRecord}
        refundSubmitting={refundSubmitting}
        type={selectedRecordType}
      />
    </>
  );
}

export default Payment;
