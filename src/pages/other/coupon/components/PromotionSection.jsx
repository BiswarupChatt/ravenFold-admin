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
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { fetchAdminCategories } from "@/lib/api/categoryApi";
import { fetchAdminProducts } from "@/lib/api/productApi";
import {
  createPromotion,
  deletePromotion,
  fetchAdminPromotions,
  updatePromotion,
  updatePromotionStatus,
} from "@/lib/api/promotionApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  DEFAULT_PAGINATION,
  DEFAULT_TABLE_PARAMS,
  normalizeText,
} from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import DeletePromotionDialog from "./DeletePromotionDialog";
import PromotionDialog from "./PromotionDialog";
import PromotionTable from "./PromotionTable";

const PROMOTION_TYPE_OPTIONS = [
  { value: "PERCENTAGE_DISCOUNT", label: "Percentage Discount" },
  { value: "FIXED_DISCOUNT", label: "Fixed Discount" },
  { value: "BUY_X_GET_Y", label: "Buy X Get Y" },
  { value: "FREE_SHIPPING", label: "Free Shipping" },
  { value: "CATEGORY_DISCOUNT", label: "Category Discount" },
  { value: "PRODUCT_DISCOUNT", label: "Product Discount" },
  { value: "COUPON", label: "Coupon" },
  { value: "FIRST_ORDER", label: "First Order" },
  { value: "NEW_USER", label: "New User" },
  { value: "CART_VALUE", label: "Cart Value" },
];

const APPLICABLE_ON_OPTIONS = [
  { value: "ALL_PRODUCTS", label: "All Products" },
  { value: "SPECIFIC_PRODUCTS", label: "Specific Products" },
  { value: "SPECIFIC_CATEGORIES", label: "Specific Categories" },
];

const DISCOUNT_METHOD_OPTIONS = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FIXED", label: "Fixed" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

const EMPTY_FORM = {
  applicableOn: "ALL_PRODUCTS",
  buyQuantity: "",
  categoryIds: [],
  couponCode: "",
  description: "",
  discountMethod: "PERCENTAGE",
  discountValue: "",
  endDate: "",
  getQuantity: "",
  isActive: true,
  isAutomatic: true,
  isStackable: false,
  maxDiscountAmount: "",
  minOrderAmount: "",
  perUserLimit: "",
  priority: "0",
  productIds: [],
  selectedCategories: [],
  selectedProducts: [],
  startDate: "",
  title: "",
  type: "PERCENTAGE_DISCOUNT",
  usageLimit: "",
};

const formatDateTimeInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (datePart) => String(datePart).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toFormData = (promotion = {}, productOptions = [], categoryOptions = []) => {
  const selectedProducts = productOptions.filter((option) => promotion.productIds?.includes(option.id));
  const selectedCategories = categoryOptions.filter((option) => promotion.categoryIds?.includes(option.id));

  return {
    applicableOn: promotion.applicableOn || "ALL_PRODUCTS",
    buyQuantity: promotion.buyQuantity === null || promotion.buyQuantity === undefined ? "" : String(promotion.buyQuantity),
    categoryIds: Array.isArray(promotion.categoryIds) ? promotion.categoryIds : [],
    couponCode: promotion.couponCode || "",
    description: promotion.description || "",
    discountMethod: promotion.discountMethod || "PERCENTAGE",
    discountValue: promotion.discountValue === null || promotion.discountValue === undefined ? "" : String(promotion.discountValue),
    endDate: formatDateTimeInput(promotion.endDate),
    getQuantity: promotion.getQuantity === null || promotion.getQuantity === undefined ? "" : String(promotion.getQuantity),
    isActive: promotion.isActive !== false,
    isAutomatic: promotion.isAutomatic !== false,
    isStackable: Boolean(promotion.isStackable),
    maxDiscountAmount: promotion.maxDiscountAmount === null || promotion.maxDiscountAmount === undefined ? "" : String(promotion.maxDiscountAmount),
    minOrderAmount: promotion.minOrderAmount === null || promotion.minOrderAmount === undefined ? "" : String(promotion.minOrderAmount),
    perUserLimit: promotion.perUserLimit === null || promotion.perUserLimit === undefined ? "" : String(promotion.perUserLimit),
    priority: promotion.priority === null || promotion.priority === undefined ? "0" : String(promotion.priority),
    productIds: Array.isArray(promotion.productIds) ? promotion.productIds : [],
    selectedCategories,
    selectedProducts,
    startDate: formatDateTimeInput(promotion.startDate),
    title: promotion.title || "",
    type: promotion.type || "PERCENTAGE_DISCOUNT",
    usageLimit: promotion.usageLimit === null || promotion.usageLimit === undefined ? "" : String(promotion.usageLimit),
  };
};

const parseOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : NaN;
};

const parseOptionalInteger = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) ? numberValue : NaN;
};

const buildPayload = (formData) => {
  const normalizedType = normalizeText(formData.type);
  const normalizedApplicableOn = normalizeText(formData.applicableOn) || "ALL_PRODUCTS";
  const usesCouponCode = normalizedType === "COUPON";
  const usesProductScope = normalizedType === "PRODUCT_DISCOUNT" || normalizedApplicableOn === "SPECIFIC_PRODUCTS";
  const usesCategoryScope = normalizedType === "CATEGORY_DISCOUNT" || normalizedApplicableOn === "SPECIFIC_CATEGORIES";
  const payload = {
    applicableOn: normalizedApplicableOn,
    categoryIds: usesCategoryScope ? formData.categoryIds : [],
    couponCode: usesCouponCode ? normalizeText(formData.couponCode).toUpperCase() : "",
    description: normalizeText(formData.description),
    isActive: Boolean(formData.isActive),
    isAutomatic: usesCouponCode ? false : Boolean(formData.isAutomatic),
    isStackable: Boolean(formData.isStackable),
    priority: Number(formData.priority || 0),
    productIds: usesProductScope ? formData.productIds : [],
    title: normalizeText(formData.title),
    type: normalizedType,
  };

  const optionalNumberFields = [
    "discountValue",
    "maxDiscountAmount",
    "minOrderAmount",
  ];

  optionalNumberFields.forEach((field) => {
    const value = parseOptionalNumber(formData[field]);

    if (value !== undefined) {
      payload[field] = value;
    }
  });

  const optionalIntegerFields = [
    "buyQuantity",
    "getQuantity",
    "usageLimit",
    "perUserLimit",
  ];

  optionalIntegerFields.forEach((field) => {
    const value = parseOptionalInteger(formData[field]);

    if (value !== undefined) {
      payload[field] = value;
    }
  });

  if (["COUPON", "CART_VALUE"].includes(normalizedType) && normalizeText(formData.discountMethod)) {
    payload.discountMethod = normalizeText(formData.discountMethod);
  }

  if (normalizeText(formData.startDate)) {
    payload.startDate = formData.startDate;
  }

  if (normalizeText(formData.endDate)) {
    payload.endDate = formData.endDate;
  }

  return payload;
};

const validatePayload = (payload) => {
  if (!payload.title) {
    return "Title is required.";
  }

  if (!payload.type) {
    return "Type is required.";
  }

  if (payload.priority && !Number.isInteger(payload.priority)) {
    return "Priority must be an integer.";
  }

  if (payload.type === "BUY_X_GET_Y") {
    if (!Number.isInteger(payload.buyQuantity) || payload.buyQuantity <= 0) {
      return "Buy quantity must be greater than 0 for Buy X Get Y promotions.";
    }

    if (!Number.isInteger(payload.getQuantity) || payload.getQuantity <= 0) {
      return "Get quantity must be greater than 0 for Buy X Get Y promotions.";
    }
  }

  return "";
};

const PromotionSection = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [promotions, setPromotions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tableParams, setTableParams] = useState(DEFAULT_TABLE_PARAMS);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [couponCodeFilter, setCouponCodeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingPromotion, setDeletingPromotion] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");

  const queryParams = useMemo(() => {
    const params = {
      ...tableParams,
    };

    if (typeFilter !== "all") {
      params.type = typeFilter;
    }

    if (statusFilter !== "all") {
      params.isActive = statusFilter;
    }

    if (normalizeText(couponCodeFilter)) {
      params.couponCode = normalizeText(couponCodeFilter).toUpperCase();
    }

    return params;
  }, [couponCodeFilter, statusFilter, tableParams, typeFilter]);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const promotionList = await fetchAdminPromotions(authToken, queryParams);

      setPromotions(promotionList.items);
      setPagination(promotionList.pagination);
    } catch (err) {
      setError(err.message || "Failed to load promotions.");
      setPromotions([]);
      setPagination({
        ...DEFAULT_PAGINATION,
        limit: tableParams.limit,
        page: tableParams.page,
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, queryParams, tableParams.limit, tableParams.page]);

  const loadReferenceOptions = useCallback(async () => {
    try {
      const [productList, categoryList] = await Promise.all([
        fetchAdminProducts(authToken, { limit: 100, page: 1 }),
        fetchAdminCategories(authToken, { limit: 100, page: 1 }),
      ]);

      setProductOptions(productList.items);
      setCategoryOptions(categoryList.items);

      setFormData((currentFormData) => ({
        ...currentFormData,
        selectedCategories: categoryList.items.filter((option) => currentFormData.categoryIds.includes(option.id)),
        selectedProducts: productList.items.filter((option) => currentFormData.productIds.includes(option.id)),
      }));
    } catch (err) {
      toast.warning(err.message || "Unable to load all product and category options.");
    }
  }, [authToken, toast]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  useEffect(() => {
    loadReferenceOptions();
  }, [loadReferenceOptions]);

  const handleOpenCreate = () => {
    setEditingPromotion(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData(toFormData(promotion, productOptions, categoryOptions));
    setFormError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingPromotion(null);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { checked, name, type, value } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormData((currentFormData) => {
      const nextFormData = {
        ...currentFormData,
        [name]: nextValue,
      };

      if (name === "type") {
        if (value === "COUPON") {
          nextFormData.isAutomatic = false;
        }

        if (value === "BUY_X_GET_Y") {
          nextFormData.discountMethod = "";
          nextFormData.discountValue = "";
          nextFormData.maxDiscountAmount = "";
          nextFormData.buyQuantity = nextFormData.buyQuantity || "1";
          nextFormData.getQuantity = nextFormData.getQuantity || "1";
        }
      }

      return nextFormData;
    });
  };

  const handleMultiValueChange = (field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      categoryIds: field === "selectedCategories" ? value.map((category) => category.id) : currentFormData.categoryIds,
      productIds: field === "selectedProducts" ? value.map((product) => product.id) : currentFormData.productIds,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const payload = buildPayload(formData);
    const validationError = validatePayload(payload);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingPromotion) {
        await updatePromotion(authToken, editingPromotion.id, payload);
        toast.success("Promotion updated successfully.");
      } else {
        await createPromotion(authToken, payload);
        toast.success("Promotion created successfully.");
        setFormData(EMPTY_FORM);
      }

      setDialogOpen(false);
      setEditingPromotion(null);
      await loadPromotions();
    } catch (err) {
      setFormError(err.message || "Failed to save promotion.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (promotion) => {
    const nextIsActive = !promotion.isActive;

    setStatusUpdatingId(promotion.id);
    setError("");

    try {
      await updatePromotionStatus(authToken, promotion.id, nextIsActive);
      toast.success(nextIsActive ? "Promotion activated successfully." : "Promotion deactivated successfully.");
      await loadPromotions();
    } catch (err) {
      setError(err.message || "Failed to update promotion status.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const handleDelete = async () => {
    if (!deletingPromotion) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deletePromotion(authToken, deletingPromotion.id);
      toast.success("Promotion deleted successfully.");
      setDeletingPromotion(null);
      await loadPromotions();
    } catch (err) {
      setError(err.message || "Failed to delete promotion.");
    } finally {
      setDeleting(false);
    }
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

  return (
    <>
      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: "100%", minWidth: 0, borderRadius: 2, overflow: "hidden" }}
      >
        <Stack
          direction={{ xs: "column", xl: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", xl: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Promotion Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage automatic promotions, coupons, and checkout discount rules.
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              size="small"
              label="Coupon Code"
              placeholder="Filter by coupon code"
              value={couponCodeFilter}
              onChange={(event) => {
                setCouponCodeFilter(event.target.value);
                setTableParams((currentParams) => ({ ...currentParams, page: 1 }));
              }}
              sx={{ minWidth: { xs: "100%", md: 200 } }}
            />

            <TextField
              select
              size="small"
              label="Type"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setTableParams((currentParams) => ({ ...currentParams, page: 1 }));
              }}
              sx={{ minWidth: { xs: "100%", md: 180 } }}
            >
              <MenuItem value="all">All Types</MenuItem>
              {PROMOTION_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setTableParams((currentParams) => ({ ...currentParams, page: 1 }));
              }}
              sx={{ minWidth: { xs: "100%", md: 160 } }}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Button startIcon={<AddIcon />} variant="contained" onClick={handleOpenCreate}>
              Add Promotion
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          ) : null}

          <PromotionTable
            deletingId={deletingPromotion?.id || ""}
            error={error}
            loading={loading}
            pagination={pagination}
            rows={promotions}
            statusUpdatingId={statusUpdatingId}
            onDelete={setDeletingPromotion}
            onEdit={handleOpenEdit}
            onPageChange={handleTablePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onToggleStatus={handleToggleStatus}
          />
        </Box>
      </Paper>

      <PromotionDialog
        applicableOnOptions={APPLICABLE_ON_OPTIONS}
        categoryOptions={categoryOptions}
        discountMethodOptions={DISCOUNT_METHOD_OPTIONS}
        editingPromotion={editingPromotion}
        formData={formData}
        formError={formError}
        open={dialogOpen}
        productOptions={productOptions}
        promotionTypeOptions={PROMOTION_TYPE_OPTIONS}
        saving={saving}
        onChange={handleFormChange}
        onClear={() => {
          setFormData(EMPTY_FORM);
          setFormError("");
        }}
        onClose={handleCloseDialog}
        onMultiValueChange={handleMultiValueChange}
        onSubmit={handleSubmit}
      />

      <DeletePromotionDialog
        deleting={deleting}
        open={Boolean(deletingPromotion)}
        promotion={deletingPromotion}
        onClose={() => setDeletingPromotion(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default PromotionSection;
