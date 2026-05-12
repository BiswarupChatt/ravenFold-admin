import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";

import SectionHeader from "@/components/SectionHeader";
import { useToast } from "@/hooks/ToastContext";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  fetchProduct,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  updateProduct,
} from "@/lib/api/productsApi";
import { formatCurrency, formatLabel } from "@/utils/methods/formatters";

const emptyForm = {
  title: "",
  slug: "",
  status: "draft",
  productType: "simple",
  shortDescription: "",
  description: "",
  tags: "",
  hasVariants: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  shippingHeight: "0",
  shippingLength: "0",
  shippingWeight: "0",
  shippingWidth: "0",
};

const listToInput = (value) => {
  return Array.isArray(value) ? value.join(", ") : "";
};

const numberToInput = (value) => {
  return value === undefined || value === null ? "0" : String(value);
};

const inputToList = (value) => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const inputToNonNegativeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const createFormState = (product) => ({
  title: product?.title || "",
  slug: product?.slug || "",
  status: product?.status || "draft",
  productType: product?.productType || "simple",
  shortDescription: product?.shortDescription || "",
  description: product?.description || "",
  tags: listToInput(product?.tags),
  hasVariants: Boolean(product?.hasVariants),
  seoTitle: product?.seo?.title || "",
  seoDescription: product?.seo?.description || "",
  seoKeywords: listToInput(product?.seo?.keywords),
  shippingHeight: numberToInput(product?.shipping?.height),
  shippingLength: numberToInput(product?.shipping?.length),
  shippingWeight: numberToInput(product?.shipping?.weight),
  shippingWidth: numberToInput(product?.shipping?.width),
});

const createUpdatePayload = (form) => ({
  title: form.title.trim(),
  slug: form.slug.trim().toLowerCase(),
  status: form.status,
  productType: form.productType,
  shortDescription: form.shortDescription.trim(),
  description: form.description.trim(),
  tags: inputToList(form.tags).map((tag) => tag.toLowerCase()),
  hasVariants: form.hasVariants,
  seo: {
    title: form.seoTitle.trim(),
    description: form.seoDescription.trim(),
    keywords: inputToList(form.seoKeywords).map((keyword) => keyword.toLowerCase()),
  },
  shipping: {
    height: inputToNonNegativeNumber(form.shippingHeight),
    length: inputToNonNegativeNumber(form.shippingLength),
    weight: inputToNonNegativeNumber(form.shippingWeight),
    width: inputToNonNegativeNumber(form.shippingWidth),
  },
});

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const authToken = useAtomValue(authTokenAtom);

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchProduct(productId);
      setProduct(result);
      setForm(createFormState(result));
    } catch (err) {
      setProduct(null);
      setError(err.message || "Unable to fetch product.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.slug.trim()) {
      setError("Title and slug are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const result = await updateProduct(productId, createUpdatePayload(form), authToken);
      setProduct(result);
      setForm(createFormState(result));
      toast.success("Product updated.");
    } catch (err) {
      setError(err.message || "Unable to update product.");
      toast.error(err.message || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/products")}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
        >
          Back to products
        </Button>

        {product?.id && (
          <Chip label={`ID: ${product.id}`} variant="outlined" sx={{ maxWidth: "100%" }} />
        )}
      </Stack>

      <SectionHeader title="Product Details" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : !product ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Product details could not be loaded.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/products")}
          >
            Back to products
          </Button>
        </Paper>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {product?.title || "Untitled product"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product?.slug || "No slug"}
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving || !form.title.trim() || !form.slug.trim()}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <TextField
                label="Title"
                value={form.title}
                onChange={handleChange("title")}
                required
                fullWidth
              />
              <TextField
                label="Slug"
                value={form.slug}
                onChange={handleChange("slug")}
                required
                fullWidth
                helperText="Lowercase letters, numbers, and hyphens."
              />
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={handleChange("status")}
                fullWidth
              >
                {PRODUCT_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {formatLabel(status)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Product type"
                value={form.productType}
                onChange={handleChange("productType")}
                fullWidth
              >
                {PRODUCT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {formatLabel(type)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Short description"
                value={form.shortDescription}
                onChange={handleChange("shortDescription")}
                inputProps={{ maxLength: 300 }}
                multiline
                minRows={3}
                fullWidth
                sx={{ gridColumn: { md: "1 / -1" } }}
              />
              <TextField
                label="Description"
                value={form.description}
                onChange={handleChange("description")}
                multiline
                minRows={5}
                fullWidth
                sx={{ gridColumn: { md: "1 / -1" } }}
              />
              <TextField
                label="Tags"
                value={form.tags}
                onChange={handleChange("tags")}
                fullWidth
                helperText="Separate tags with commas."
                sx={{ gridColumn: { md: "1 / -1" } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.hasVariants}
                    onChange={handleChange("hasVariants")}
                    inputProps={{ "aria-label": "Has variants" }}
                  />
                }
                label="Has variants"
              />
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              SEO
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <TextField
                label="SEO title"
                value={form.seoTitle}
                onChange={handleChange("seoTitle")}
                fullWidth
              />
              <TextField
                label="SEO keywords"
                value={form.seoKeywords}
                onChange={handleChange("seoKeywords")}
                fullWidth
                helperText="Separate keywords with commas."
              />
              <TextField
                label="SEO description"
                value={form.seoDescription}
                onChange={handleChange("seoDescription")}
                multiline
                minRows={3}
                fullWidth
                sx={{ gridColumn: { md: "1 / -1" } }}
              />
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Shipping
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <TextField
                label="Weight"
                type="number"
                value={form.shippingWeight}
                onChange={handleChange("shippingWeight")}
                inputProps={{ min: 0, step: "0.01" }}
                fullWidth
              />
              <TextField
                label="Length"
                type="number"
                value={form.shippingLength}
                onChange={handleChange("shippingLength")}
                inputProps={{ min: 0, step: "0.01" }}
                fullWidth
              />
              <TextField
                label="Width"
                type="number"
                value={form.shippingWidth}
                onChange={handleChange("shippingWidth")}
                inputProps={{ min: 0, step: "0.01" }}
                fullWidth
              />
              <TextField
                label="Height"
                type="number"
                value={form.shippingHeight}
                onChange={handleChange("shippingHeight")}
                inputProps={{ min: 0, step: "0.01" }}
                fullWidth
              />
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" fontWeight={700}>
                Variants
              </Typography>
              <Chip
                label={`${product?.variants?.length || 0} variants`}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Divider sx={{ mb: 2 }} />

            {product?.variants?.length ? (
              <TableContainer>
                <Table size="small" sx={{ minWidth: 700 }} aria-label="Product variants table">
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Compare at</TableCell>
                      <TableCell>Default</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell>{variant.sku || "-"}</TableCell>
                        <TableCell>{formatLabel(variant.status)}</TableCell>
                        <TableCell>{formatCurrency(variant.price)}</TableCell>
                        <TableCell>{formatCurrency(variant.compareAtPrice)}</TableCell>
                        <TableCell>{variant.isDefault ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">No variants found for this product.</Typography>
            )}
          </Paper>
        </Box>
      )}
    </>
  );
}
