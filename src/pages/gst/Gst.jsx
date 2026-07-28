import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";

import DataTable from "@/components/DataTable";
import SectionHeader from "@/components/SectionHeader";
import {
  fetchAdminInvoices,
  fetchGstConfiguration,
  downloadAdminInvoice,
  downloadGstReport,
  fetchAdminInvoicePdfBlob,
  updateGstConfiguration,
  uploadGstImage,
} from "@/lib/api/gstApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import { DEFAULT_PAGINATION, DEFAULT_TABLE_PARAMS, formatCurrency, formatDate } from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";

const EMPTY_CONFIG = {
  authorisedSignatory: { designation: "Authorised Signatory", imageUrl: "", name: "Aurax & Co" },
  bankDetails: { accountName: "", accountNumber: "", bankName: "", branchName: "", ifsc: "" },
  brandName: "Raven Fold",
  businessLegalName: "Aurax & Co",
  businessLogoAsset: null,
  contactNumber: "",
  defaultGstRate: 0,
  email: "",
  gstin: "",
  invoiceNotes: "",
  invoiceTerms: "",
  pan: "",
  registeredAddress: { addressLine1: "", addressLine2: "", city: "", country: "India", pincode: "", state: "", stateCode: "" },
  tradeName: "",
  useFinancialYearNumbering: true,
};

const GST_STATE_OPTIONS = [
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "04", name: "Chandigarh" },
  { code: "22", name: "Chhattisgarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "07", name: "Delhi" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "38", name: "Ladakh" },
  { code: "31", name: "Lakshadweep" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "97", name: "Other Territory" },
  { code: "34", name: "Puducherry" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
];

const getStateCodeByName = (stateName = "") => (
  GST_STATE_OPTIONS.find((state) => state.name === stateName)?.code || ""
);

const getInvoiceNumberPreview = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  const quarter = month >= 4 && month <= 6 ? 1 : month >= 7 && month <= 9 ? 2 : month >= 10 && month <= 12 ? 3 : 4;

  return `RF${String(startYear).slice(-2)}${String(endYear).slice(-2)}${quarter}00001`;
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
  authorisedSignatory: {
    ...(form.authorisedSignatory || {}),
    designation: form.authorisedSignatory?.designation || "Authorised Signatory",
    name: form.authorisedSignatory?.name || "Aurax & Co",
  },
  brandName: form.brandName,
  businessLegalName: form.businessLegalName,
  businessLogoAsset: form.businessLogoAsset,
  contactNumber: form.contactNumber,
  defaultGstRate: form.defaultGstRate,
  email: form.email,
  gstin: form.gstin,
  invoiceNotes: form.invoiceNotes,
  invoiceTerms: form.invoiceTerms,
  pan: form.pan,
  registeredAddress: form.registeredAddress,
  tradeName: form.tradeName,
  useFinancialYearNumbering: Boolean(form.useFinancialYearNumbering),
});

const ConfigurationTab = ({
  editable,
  form,
  logoUploading,
  loading,
  onCancel,
  onChange,
  onEdit,
  onLogoRemove,
  onLogoUpload,
  onSave,
  saving,
}) => {
  const fieldDisabled = loading || saving || !editable;

  return (
  <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
        <Box>
          <Typography variant="h6" fontWeight={700}>GST Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Values are snapshotted into orders and invoices at generation time.
          </Typography>
        </Box>
        {!editable ? (
          <Button variant="outlined" startIcon={<EditIcon />} disabled={loading || saving} onClick={onEdit}>
            Edit
          </Button>
        ) : null}
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField disabled={fieldDisabled} label="Brand name" name="brandName" value={form.brandName} onChange={onChange} fullWidth size="small" />
        <TextField disabled={fieldDisabled} label="Registered company name" name="businessLegalName" value={form.businessLegalName} onChange={onChange} fullWidth size="small" />
        <TextField disabled={fieldDisabled} label="Trade name" name="tradeName" value={form.tradeName} onChange={onChange} fullWidth size="small" />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField disabled={fieldDisabled} label="GSTIN" name="gstin" value={form.gstin} onChange={onChange} fullWidth size="small" />
        <TextField disabled={fieldDisabled} label="PAN" name="pan" value={form.pan} onChange={onChange} fullWidth size="small" />
        <TextField disabled label="State code" value={form.registeredAddress.stateCode} fullWidth size="small" InputProps={{ readOnly: true }} />
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField disabled={fieldDisabled} select label="State" name="registeredAddress.state" value={form.registeredAddress.state} onChange={onChange} fullWidth size="small">
          <MenuItem value="">Select state</MenuItem>
          {GST_STATE_OPTIONS.map((state) => (
            <MenuItem key={state.code} value={state.name}>{state.name}</MenuItem>
          ))}
        </TextField>
        <TextField disabled={fieldDisabled} label="City" name="registeredAddress.city" value={form.registeredAddress.city} onChange={onChange} fullWidth size="small" />
        <TextField disabled={fieldDisabled} label="PIN code" name="registeredAddress.pincode" value={form.registeredAddress.pincode} onChange={onChange} fullWidth size="small" />
      </Stack>
      <TextField disabled={fieldDisabled} label="Registered address line 1" name="registeredAddress.addressLine1" value={form.registeredAddress.addressLine1} onChange={onChange} fullWidth size="small" />
      <TextField disabled={fieldDisabled} label="Registered address line 2" name="registeredAddress.addressLine2" value={form.registeredAddress.addressLine2} onChange={onChange} fullWidth size="small" />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField disabled={fieldDisabled} label="Contact number" name="contactNumber" value={form.contactNumber} onChange={onChange} fullWidth size="small" />
        <TextField disabled={fieldDisabled} label="Email" name="email" value={form.email} onChange={onChange} fullWidth size="small" />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2" fontWeight={700}>Business logo</Typography>
        {form.businessLogoAsset?.url ? (
          <Box
            component="img"
            src={form.businessLogoAsset.url}
            alt=""
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              display: "block",
              maxHeight: 88,
              maxWidth: 180,
              objectFit: "contain",
              p: 1,
            }}
          />
        ) : null}
        {editable ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component="label" disabled={fieldDisabled || logoUploading} variant="outlined">
              {logoUploading ? "Uploading..." : form.businessLogoAsset?.url ? "Replace logo" : "Upload logo"}
              <input
                accept="image/*"
                hidden
                type="file"
                onChange={(event) => {
                  const [file] = Array.from(event.target.files || []);

                  if (file) {
                    onLogoUpload(file);
                  }

                  event.target.value = "";
                }}
              />
            </Button>
            {form.businessLogoAsset?.url ? (
              <Button color="error" disabled={fieldDisabled || logoUploading} onClick={onLogoRemove} variant="outlined">
                Remove
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
      <Divider />
      <TextField disabled label="Invoice format" value={getInvoiceNumberPreview()} fullWidth size="small" InputProps={{ readOnly: true }} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <TextField disabled={fieldDisabled} label="Default GST %" name="defaultGstRate" type="number" value={form.defaultGstRate} onChange={onChange} fullWidth size="small" inputProps={{ min: 0, max: 100, step: "0.001" }} />
      </Stack>
      <Divider />
      <TextField disabled={fieldDisabled} label="Invoice terms" name="invoiceTerms" value={form.invoiceTerms} onChange={onChange} fullWidth size="small" multiline minRows={2} />
      <TextField disabled={fieldDisabled} label="Invoice notes" name="invoiceNotes" value={form.invoiceNotes} onChange={onChange} fullWidth size="small" multiline minRows={2} />
      {editable ? (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="text" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={loading || saving} onClick={onSave}>
            {saving ? "Saving..." : "Save GST Settings"}
          </Button>
        </Stack>
      ) : null}
    </Stack>
  </Paper>
  );
};

const InvoicesTab = ({ authToken }) => {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [params, setParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState({
    error: "",
    invoice: null,
    loading: false,
    open: false,
    pdfUrl: "",
  });

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

  useEffect(() => () => {
    if (preview.pdfUrl) {
      URL.revokeObjectURL(preview.pdfUrl);
    }
  }, [preview.pdfUrl]);

  const closePreview = () => {
    setPreview({
      error: "",
      invoice: null,
      loading: false,
      open: false,
      pdfUrl: "",
    });
  };

  const viewInvoice = useCallback(async (invoice) => {
    setPreview({
      error: "",
      invoice,
      loading: true,
      open: true,
      pdfUrl: "",
    });

    try {
      const blob = await fetchAdminInvoicePdfBlob(authToken, invoice.id);
      const pdfUrl = URL.createObjectURL(blob);

      setPreview((current) => {
        if (!current.open || current.invoice?.id !== invoice.id) {
          URL.revokeObjectURL(pdfUrl);
          return current;
        }

        return {
          ...current,
          loading: false,
          pdfUrl,
        };
      });
    } catch (err) {
      setPreview((current) => ({
        ...current,
        error: err.message || "Failed to load invoice PDF.",
        loading: false,
      }));
    }
  }, [authToken]);

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
      minWidth: 120,
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <Button
            onClick={() => viewInvoice(row)}
            size="small"
            startIcon={<VisibilityIcon />}
          >
            View
          </Button>
        </Stack>
      ),
    },
  ], [viewInvoice]);

  return (
    <>
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

      <Dialog fullWidth maxWidth="lg" open={preview.open} onClose={closePreview}>
        <DialogTitle>
          Tax Invoice {preview.invoice?.invoiceNumber ? `- ${preview.invoice.invoiceNumber}` : ""}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "grey.100", p: 0 }}>
          {preview.error ? <Alert severity="error" sx={{ m: 2 }}>{preview.error}</Alert> : null}
          {preview.loading ? (
            <Box sx={{ alignItems: "center", display: "flex", minHeight: 160, justifyContent: "center" }}>
              <Typography color="text.secondary">Loading invoice PDF...</Typography>
            </Box>
          ) : null}
          {preview.pdfUrl ? (
            <Box
              component="iframe"
              src={preview.pdfUrl}
              title={preview.invoice?.invoiceNumber ? `Invoice ${preview.invoice.invoiceNumber}` : "Invoice preview"}
              sx={{
                border: 0,
                display: "block",
                height: { xs: "72vh", md: "78vh" },
                width: "100%",
              }}
            />
          ) : null}
          {!preview.loading && !preview.pdfUrl && !preview.error ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>No invoice selected.</Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button disabled startIcon={<EmailIcon />}>
            Send invoice to customer email
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={closePreview}>Close</Button>
          <Button
            disabled={!preview.invoice}
            onClick={async () => {
              try {
                await downloadAdminInvoice(authToken, preview.invoice.id, preview.invoice.invoiceNumber);
              } catch (err) {
                toast.error(err.message || "Failed to download invoice.");
              }
            }}
            startIcon={<DownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const Gst = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [tab, setTab] = useState("config");
  const [form, setForm] = useState(EMPTY_CONFIG);
  const [savedForm, setSavedForm] = useState(EMPTY_CONFIG);
  const [editingConfig, setEditingConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const loadedConfig = normalizeConfig(await fetchGstConfiguration(authToken));

      setForm(loadedConfig);
      setSavedForm(loadedConfig);
      setEditingConfig(false);
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

    setForm((current) => {
      if (name === "registeredAddress.state") {
        return {
          ...current,
          registeredAddress: {
            ...(current.registeredAddress || {}),
            state: value,
            stateCode: getStateCodeByName(value),
          },
        };
      }

      return setNestedValue(current, name, value);
    });
  };

  const handleLogoUpload = async (file) => {
    setLogoUploading(true);

    try {
      const logoAsset = await uploadGstImage(authToken, file);

      if (!logoAsset?.url) {
        throw new Error("Logo upload did not return a URL.");
      }

      setForm((current) => ({
        ...current,
        businessLogoAsset: logoAsset,
      }));
    } catch (err) {
      toast.error(err.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = () => {
    setForm((current) => ({
      ...current,
      businessLogoAsset: null,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updatedConfig = await updateGstConfiguration(authToken, buildConfigPayload(form));
      const normalizedConfig = normalizeConfig(updatedConfig);

      setForm(normalizedConfig);
      setSavedForm(normalizedConfig);
      setEditingConfig(false);
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
        <ConfigurationTab
          editable={editingConfig}
          form={form}
          logoUploading={logoUploading}
          loading={loading}
          onCancel={() => {
            setForm(savedForm);
            setEditingConfig(false);
          }}
          onChange={handleChange}
          onEdit={() => setEditingConfig(true)}
          onLogoRemove={handleLogoRemove}
          onLogoUpload={handleLogoUpload}
          onSave={handleSave}
          saving={saving}
        />
      ) : (
        <InvoicesTab authToken={authToken} />
      )}
    </>
  );
};

export default Gst;
