import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";

import DataTable from "@/components/DataTable";
import SectionHeader from "@/components/SectionHeader";
import {
  fetchAdminInvoices,
  fetchGstConfiguration,
  downloadAdminInvoice,
  downloadGstReport,
  regenerateInvoicePdf,
  updateGstConfiguration,
} from "@/lib/api/gstApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { DEFAULT_PAGINATION, DEFAULT_TABLE_PARAMS, formatCurrency, formatDate } from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";

const EMPTY_CONFIG = {
  authorisedSignatory: { designation: "", imageUrl: "", name: "" },
  bankDetails: { accountName: "", accountNumber: "", bankName: "", branchName: "", ifsc: "" },
  brandName: "Raven Fold",
  businessLegalName: "Aurax & Co",
  businessLogoUrl: "",
  contactNumber: "",
  defaultGstRate: 0,
  email: "",
  gstin: "",
  invoiceNotes: "",
  invoiceNumberFormat: "{PREFIX}/{FY}/{SEQ}",
  invoicePrefix: "RF",
  invoiceTerms: "",
  nextInvoiceNumber: 1,
  pan: "",
  registeredAddress: { addressLine1: "", addressLine2: "", city: "", country: "India", pincode: "", state: "", stateCode: "" },
  shippingGstRate: 0,
  shippingGstTreatment: "taxable",
  tradeName: "",
  useFinancialYearNumbering: true,
};

const normalizeConfig = (config = {}) => ({
  ...EMPTY_CONFIG,
  ...config,
  authorisedSignatory: { ...EMPTY_CONFIG.authorisedSignatory, ...(config.authorisedSignatory || {}) },
  bankDetails: { ...EMPTY_CONFIG.bankDetails, ...(config.bankDetails || {}) },
  registeredAddress: { ...EMPTY_CONFIG.registeredAddress, ...(config.registeredAddress || {}) },
});

const setNestedValue = (source, path, value) => {
  const [group, field] = path.split(".");

  if (!field) {
    return { ...source, [path]: value };
  }

  return {
    ...source,
    [group]: {
      ...(source[group] || {}),
      [field]: value,
    },
  };
};

const buildConfigPayload = (form) => ({
  authorisedSignatory: form.authorisedSignatory,
  bankDetails: form.bankDetails,
  brandName: form.brandName,
  businessLegalName: form.businessLegalName,
  businessLogoUrl: form.businessLogoUrl,
  contactNumber: form.contactNumber,
  defaultGstRate: form.defaultGstRate,
  email: form.email,
  gstin: form.gstin,
  invoiceNotes: form.invoiceNotes,
  invoiceNumberFormat: form.invoiceNumberFormat,
  invoicePrefix: form.invoicePrefix,
  invoiceTerms: form.invoiceTerms,
  nextInvoiceNumber: form.nextInvoiceNumber,
  pan: form.pan,
  registeredAddress: form.registeredAddress,
  shippingGstRate: form.shippingGstRate,
  shippingGstTreatment: form.shippingGstTreatment,
  tradeName: form.tradeName,
  useFinancialYearNumbering: Boolean(form.useFinancialYearNumbering),
});

const ConfigurationTab = ({ form, loading, onChange, onSave, saving }) => (
  <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6" fontWeight={700}>GST Configuration</Typography>
        <Typography variant="body2" color="text.secondary">
          Values are snapshotted into orders and invoices at generation time.
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="Brand name" name="brandName" value={form.brandName} onChange={onChange} fullWidth size="small" />
        <TextField label="Registered company name" name="businessLegalName" value={form.businessLegalName} onChange={onChange} fullWidth size="small" />
        <TextField label="Trade name" name="tradeName" value={form.tradeName} onChange={onChange} fullWidth size="small" />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="GSTIN" name="gstin" value={form.gstin} onChange={onChange} fullWidth size="small" />
        <TextField label="PAN" name="pan" value={form.pan} onChange={onChange} fullWidth size="small" />
        <TextField label="State code" name="registeredAddress.stateCode" value={form.registeredAddress.stateCode} onChange={onChange} fullWidth size="small" />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="State" name="registeredAddress.state" value={form.registeredAddress.state} onChange={onChange} fullWidth size="small" />
        <TextField label="City" name="registeredAddress.city" value={form.registeredAddress.city} onChange={onChange} fullWidth size="small" />
        <TextField label="PIN code" name="registeredAddress.pincode" value={form.registeredAddress.pincode} onChange={onChange} fullWidth size="small" />
      </Stack>
      <TextField label="Registered address line 1" name="registeredAddress.addressLine1" value={form.registeredAddress.addressLine1} onChange={onChange} fullWidth size="small" />
      <TextField label="Registered address line 2" name="registeredAddress.addressLine2" value={form.registeredAddress.addressLine2} onChange={onChange} fullWidth size="small" />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="Contact number" name="contactNumber" value={form.contactNumber} onChange={onChange} fullWidth size="small" />
        <TextField label="Email" name="email" value={form.email} onChange={onChange} fullWidth size="small" />
        <TextField label="Logo URL" name="businessLogoUrl" value={form.businessLogoUrl} onChange={onChange} fullWidth size="small" />
      </Stack>
      <Divider />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="Invoice prefix" name="invoicePrefix" value={form.invoicePrefix} onChange={onChange} fullWidth size="small" />
        <TextField label="Invoice format" name="invoiceNumberFormat" value={form.invoiceNumberFormat} onChange={onChange} fullWidth size="small" />
        <TextField label="Starting number" name="nextInvoiceNumber" type="number" value={form.nextInvoiceNumber} onChange={onChange} fullWidth size="small" inputProps={{ min: 1 }} />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="Default GST %" name="defaultGstRate" type="number" value={form.defaultGstRate} onChange={onChange} fullWidth size="small" inputProps={{ min: 0, max: 100, step: "0.001" }} />
        <TextField select label="Shipping GST" name="shippingGstTreatment" value={form.shippingGstTreatment} onChange={onChange} fullWidth size="small">
          <MenuItem value="taxable">Taxable</MenuItem>
          <MenuItem value="exempt">Exempt</MenuItem>
        </TextField>
        <TextField label="Shipping GST %" name="shippingGstRate" type="number" value={form.shippingGstRate} onChange={onChange} fullWidth size="small" inputProps={{ min: 0, max: 100, step: "0.001" }} />
      </Stack>
      <Divider />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="Signatory name" name="authorisedSignatory.name" value={form.authorisedSignatory.name} onChange={onChange} fullWidth size="small" />
        <TextField label="Designation" name="authorisedSignatory.designation" value={form.authorisedSignatory.designation} onChange={onChange} fullWidth size="small" />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField label="Bank name" name="bankDetails.bankName" value={form.bankDetails.bankName} onChange={onChange} fullWidth size="small" />
        <TextField label="Account number" name="bankDetails.accountNumber" value={form.bankDetails.accountNumber} onChange={onChange} fullWidth size="small" />
        <TextField label="IFSC" name="bankDetails.ifsc" value={form.bankDetails.ifsc} onChange={onChange} fullWidth size="small" />
      </Stack>
      <TextField label="Invoice terms" name="invoiceTerms" value={form.invoiceTerms} onChange={onChange} fullWidth size="small" multiline minRows={2} />
      <TextField label="Invoice notes" name="invoiceNotes" value={form.invoiceNotes} onChange={onChange} fullWidth size="small" multiline minRows={2} />
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<SaveIcon />} disabled={loading || saving} onClick={onSave}>
          {saving ? "Saving..." : "Save GST Settings"}
        </Button>
      </Stack>
    </Stack>
  </Paper>
);

const InvoicesTab = ({ authToken }) => {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [params, setParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchAdminInvoices(authToken, params);

      setInvoices(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || "Failed to load invoices.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, params]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const columns = useMemo(() => [
    { field: "invoiceNumber", header: "Invoice", minWidth: 180 },
    { field: "orderNumber", header: "Order", minWidth: 150 },
    { header: "Date", minWidth: 120, render: (row) => formatDate(row.invoiceDate) },
    { field: "invoiceType", header: "Type", minWidth: 90 },
    { field: "supplyType", header: "Supply", minWidth: 130 },
    { header: "Taxable", align: "right", minWidth: 120, render: (row) => formatCurrency(row.totals?.totalTaxableValue, "INR") },
    { header: "GST", align: "right", minWidth: 120, render: (row) => formatCurrency(row.totals?.totalGst, "INR") },
    { header: "Total", align: "right", minWidth: 120, render: (row) => formatCurrency(row.totals?.grandTotal, "INR") },
    {
      header: "Actions",
      minWidth: 220,
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <Button
            onClick={async () => {
              try {
                await downloadAdminInvoice(authToken, row.id, row.invoiceNumber);
              } catch (err) {
                toast.error(err.message || "Failed to download invoice.");
              }
            }}
            size="small"
            startIcon={<DownloadIcon />}
          >
            PDF
          </Button>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={async () => {
              try {
                await regenerateInvoicePdf(authToken, row.id);
                toast.success("Invoice PDF regenerated.");
                await loadInvoices();
              } catch (err) {
                toast.error(err.message || "Failed to regenerate invoice PDF.");
              }
            }}
          >
            Regenerate
          </Button>
        </Stack>
      ),
    },
  ], [authToken, loadInvoices, toast]);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" sx={{ p: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>GST Invoices</Typography>
          <Typography variant="body2" color="text.secondary">Search and export invoice data for return preparation.</Typography>
        </Box>
        <Button
          onClick={async () => {
            try {
              await downloadGstReport(authToken, params);
            } catch (err) {
              toast.error(err.message || "Failed to export GST report.");
            }
          }}
          variant="outlined"
          startIcon={<DownloadIcon />}
        >
          Export CSV
        </Button>
      </Stack>
      <Divider />
      <Box sx={{ p: 2 }}>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <DataTable
          columns={columns}
          rows={invoices}
          loading={loading}
          minWidth={1280}
          pagination={{
            ...pagination,
            onPageChange: (page) => setParams((current) => ({ ...current, page })),
            onRowsPerPageChange: (limit) => setParams((current) => ({ ...current, limit, page: 1 })),
          }}
        />
      </Box>
    </Paper>
  );
};

const Gst = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [tab, setTab] = useState("config");
  const [form, setForm] = useState(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setForm(normalizeConfig(await fetchGstConfiguration(authToken)));
    } catch (err) {
      setError(err.message || "Failed to load GST configuration.");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => setNestedValue(current, name, value));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updatedConfig = await updateGstConfiguration(authToken, buildConfigPayload(form));

      setForm(normalizeConfig(updatedConfig));
      toast.success("GST configuration saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save GST configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionHeader title="GST" />
      {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert> : null}
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Configuration" value="config" />
        <Tab label="Invoices" value="invoices" />
      </Tabs>
      {tab === "config" ? (
        <ConfigurationTab form={form} loading={loading} onChange={handleChange} onSave={handleSave} saving={saving} />
      ) : (
        <InvoicesTab authToken={authToken} />
      )}
    </>
  );
};

export default Gst;
