import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { fetchAdminCategoryTree } from "@/lib/api/categoryApi";
import {
  createProduct,
  fetchAdminProduct,
  updateProduct,
  uploadProductImages,
} from "@/lib/api/productApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  PRODUCT_STATUSES,
  flattenCategoryTree,
  getHierarchyColor,
  joinLines,
  normalizeAttributes,
  normalizeText,
  splitCommaSeparatedValues,
  splitLines,
} from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import ROUTES from "@/routes/routes";
import ProductDetailsForm from "./components/ProductDetailsForm";
import {
  PRODUCT_FORM_SECTION_FIELDS,
  PRODUCT_FORM_SECTION_IDS,
  PRODUCT_FORM_SECTION_LABELS,
} from "./productFormSections";

const EMPTY_FORM = {
  name: "",
  slug: "",
  categoryId: "",
  sku: "",
  basePrice: "",
  salePrice: "",
  status: "draft",
  shortDescription: "",
  description: "",
  imageUrls: "",
  tags: "",
  attributes: [],
  shippingRequiresShipping: true,
  shippingWeightValue: "",
  shippingWeightUnit: "kg",
  shippingLength: "",
  shippingWidth: "",
  shippingHeight: "",
  shippingDimensionUnit: "cm",
  shippingClass: "",
  shippingFreeShippingEligible: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoCanonicalUrl: "",
  seoNoIndex: false,
  hasVariants: false,
  isFeatured: false,
};

const buildPayload = (formData) => {
  const payload = {
    name: normalizeText(formData.name),
    categoryId: formData.categoryId,
    sku: normalizeText(formData.sku),
    basePrice: formData.basePrice,
    salePrice: formData.salePrice === "" ? null : formData.salePrice,
    status: formData.status,
    shortDescription: normalizeText(formData.shortDescription),
    description: normalizeText(formData.description),
    images: splitLines(formData.imageUrls),
    tags: splitCommaSeparatedValues(formData.tags),
    attributes: normalizeAttributes(formData.attributes),
    shipping: {
      requiresShipping: Boolean(formData.shippingRequiresShipping),
      weight: {
        value: formData.shippingWeightValue === "" ? null : formData.shippingWeightValue,
        unit: formData.shippingWeightUnit,
      },
      dimensions: {
        length: formData.shippingLength === "" ? null : formData.shippingLength,
        width: formData.shippingWidth === "" ? null : formData.shippingWidth,
        height: formData.shippingHeight === "" ? null : formData.shippingHeight,
        unit: formData.shippingDimensionUnit,
      },
      shippingClass: normalizeText(formData.shippingClass),
      isFreeShippingEligible: Boolean(formData.shippingFreeShippingEligible),
    },
    seo: {
      title: normalizeText(formData.seoTitle),
      description: normalizeText(formData.seoDescription),
      keywords: splitCommaSeparatedValues(formData.seoKeywords),
      canonicalUrl: normalizeText(formData.seoCanonicalUrl),
      noIndex: Boolean(formData.seoNoIndex),
    },
    metaTitle: normalizeText(formData.seoTitle),
    metaDescription: normalizeText(formData.seoDescription),
    hasVariants: Boolean(formData.hasVariants),
    isFeatured: Boolean(formData.isFeatured),
  };

  const slug = normalizeText(formData.slug);

  if (slug) {
    payload.slug = slug;
  }

  return payload;
};

const buildDetailsPayload = (formData) => {
  const payload = {
    name: normalizeText(formData.name),
    sku: normalizeText(formData.sku),
    basePrice: formData.basePrice,
    salePrice: formData.salePrice === "" ? null : formData.salePrice,
    shortDescription: normalizeText(formData.shortDescription),
    description: normalizeText(formData.description),
  };
  const slug = normalizeText(formData.slug);

  if (slug) {
    payload.slug = slug;
  }

  return payload;
};

const buildSettingsPayload = (formData) => ({
  status: formData.status,
  hasVariants: Boolean(formData.hasVariants),
  isFeatured: Boolean(formData.isFeatured),
});

const buildOrganizationPayload = (formData) => {
  const payload = {
    categoryId: formData.categoryId,
    tags: splitCommaSeparatedValues(formData.tags),
  };
  const slug = normalizeText(formData.slug);

  if (slug) {
    payload.slug = slug;
  }

  return payload;
};

const buildMediaPayload = (formData) => ({
  images: splitLines(formData.imageUrls),
});

const buildShippingPayload = (formData) => ({
  shipping: {
    requiresShipping: Boolean(formData.shippingRequiresShipping),
    weight: {
      value: formData.shippingWeightValue === "" ? null : formData.shippingWeightValue,
      unit: formData.shippingWeightUnit,
    },
    dimensions: {
      length: formData.shippingLength === "" ? null : formData.shippingLength,
      width: formData.shippingWidth === "" ? null : formData.shippingWidth,
      height: formData.shippingHeight === "" ? null : formData.shippingHeight,
      unit: formData.shippingDimensionUnit,
    },
    shippingClass: normalizeText(formData.shippingClass),
    isFreeShippingEligible: Boolean(formData.shippingFreeShippingEligible),
  },
});

const buildAttributesPayload = (formData) => ({
  attributes: normalizeAttributes(formData.attributes),
});

const buildSeoPayload = (formData) => ({
  seo: {
    title: normalizeText(formData.seoTitle),
    description: normalizeText(formData.seoDescription),
    keywords: splitCommaSeparatedValues(formData.seoKeywords),
    canonicalUrl: normalizeText(formData.seoCanonicalUrl),
    noIndex: Boolean(formData.seoNoIndex),
  },
  metaTitle: normalizeText(formData.seoTitle),
  metaDescription: normalizeText(formData.seoDescription),
});

const buildSectionPayload = (sectionId, formData) => {
  switch (sectionId) {
    case PRODUCT_FORM_SECTION_IDS.DETAILS:
      return buildDetailsPayload(formData);
    case PRODUCT_FORM_SECTION_IDS.SETTINGS:
      return buildSettingsPayload(formData);
    case PRODUCT_FORM_SECTION_IDS.ORGANIZATION:
      return buildOrganizationPayload(formData);
    case PRODUCT_FORM_SECTION_IDS.MEDIA:
      return buildMediaPayload(formData);
    case PRODUCT_FORM_SECTION_IDS.SHIPPING:
      return buildShippingPayload(formData);
    case PRODUCT_FORM_SECTION_IDS.ATTRIBUTES:
      return buildAttributesPayload(formData);
    case PRODUCT_FORM_SECTION_IDS.SEO:
      return buildSeoPayload(formData);
    default:
      return {};
  }
};

const mergeFormDataSection = (currentFormData, savedFormData, sectionId) => {
  const sectionFields = PRODUCT_FORM_SECTION_FIELDS[sectionId] || [];

  return sectionFields.reduce((nextFormData, field) => ({
    ...nextFormData,
    [field]: savedFormData[field] ?? EMPTY_FORM[field],
  }), currentFormData);
};

const validateProductDetailsPayload = (payload) => {
  const basePrice = Number(payload.basePrice);
  const salePrice = payload.salePrice === null ? null : Number(payload.salePrice);

  if (!payload.name) {
    return "Product name is required.";
  }

  if (!payload.sku) {
    return "SKU is required.";
  }

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return "Base price must be a valid non-negative number.";
  }

  if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0)) {
    return "Sale price must be a valid non-negative number.";
  }

  if (salePrice !== null && salePrice > basePrice) {
    return "Sale price cannot be greater than base price.";
  }

  return "";
};

const validateOrganizationPayload = (payload) => {
  if (!payload.categoryId) {
    return "Category is required.";
  }

  return "";
};

const validateAttributesPayload = (payload) => {
  const attributes = Array.isArray(payload.attributes) ? payload.attributes : [];
  const incompleteAttribute = attributes.find((attribute) => !attribute.name || !attribute.value);

  if (incompleteAttribute) {
    return "Each attribute needs both a name and value.";
  }

  const attributeNames = attributes.map((attribute) => attribute.name.toLowerCase());
  const hasDuplicateAttributeNames = new Set(attributeNames).size !== attributeNames.length;

  if (hasDuplicateAttributeNames) {
    return "Attribute names must be unique.";
  }

  return "";
};

const validateShippingPayload = (payload) => {
  const optionalShippingNumbers = [
    ["Shipping weight", payload.shipping?.weight?.value],
    ["Shipping length", payload.shipping?.dimensions?.length],
    ["Shipping width", payload.shipping?.dimensions?.width],
    ["Shipping height", payload.shipping?.dimensions?.height],
  ];

  for (const [label, value] of optionalShippingNumbers) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue) || numberValue < 0) {
      return `${label} must be a valid non-negative number.`;
    }
  }

  return "";
};

const validatePayload = (payload) => (
  validateProductDetailsPayload(payload) ||
  validateOrganizationPayload(payload) ||
  validateAttributesPayload(payload) ||
  validateShippingPayload(payload)
);

const validateSectionPayload = (sectionId, payload) => {
  switch (sectionId) {
    case PRODUCT_FORM_SECTION_IDS.DETAILS:
      return validateProductDetailsPayload(payload);
    case PRODUCT_FORM_SECTION_IDS.ORGANIZATION:
      return validateOrganizationPayload(payload);
    case PRODUCT_FORM_SECTION_IDS.ATTRIBUTES:
      return validateAttributesPayload(payload);
    case PRODUCT_FORM_SECTION_IDS.SHIPPING:
      return validateShippingPayload(payload);
    default:
      return "";
  }
};

const getProductFromResponse = (response) => response?.data || null;

const getProductId = (product) => product?.id || product?._id || "";

const productToFormData = (product) => {
  const shipping = product.shipping || {};
  const seo = product.seo || {};

  return {
    name: product.name || "",
    slug: product.slug || "",
    categoryId: product.categoryId || "",
    sku: product.sku || "",
    basePrice: product.basePrice === null || product.basePrice === undefined
      ? ""
      : String(product.basePrice),
    salePrice: product.salePrice === null || product.salePrice === undefined
      ? ""
      : String(product.salePrice),
    status: product.status || "draft",
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    imageUrls: Array.isArray(product.images) ? product.images.join("\n") : "",
    tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
    attributes: normalizeAttributes(product.attributes),
    shippingRequiresShipping: shipping.requiresShipping !== false,
    shippingWeightValue: shipping.weight?.value === null || shipping.weight?.value === undefined
      ? ""
      : String(shipping.weight.value),
    shippingWeightUnit: shipping.weight?.unit || "kg",
    shippingLength: shipping.dimensions?.length === null || shipping.dimensions?.length === undefined
      ? ""
      : String(shipping.dimensions.length),
    shippingWidth: shipping.dimensions?.width === null || shipping.dimensions?.width === undefined
      ? ""
      : String(shipping.dimensions.width),
    shippingHeight: shipping.dimensions?.height === null || shipping.dimensions?.height === undefined
      ? ""
      : String(shipping.dimensions.height),
    shippingDimensionUnit: shipping.dimensions?.unit || "cm",
    shippingClass: shipping.shippingClass || "",
    shippingFreeShippingEligible: Boolean(shipping.isFreeShippingEligible),
    seoTitle: seo.title || product.metaTitle || "",
    seoDescription: seo.description || product.metaDescription || "",
    seoKeywords: Array.isArray(seo.keywords) ? seo.keywords.join(", ") : "",
    seoCanonicalUrl: seo.canonicalUrl || "",
    seoNoIndex: Boolean(seo.noIndex),
    hasVariants: Boolean(product.hasVariants),
    isFeatured: Boolean(product.isFeatured),
  };
};

const getProductViewPath = (productId) => `${ROUTES.PRODUCT}/${productId}`;

const getProductEditPath = (productId) => `${ROUTES.PRODUCT}/${productId}/edit`;

const getPageTitle = (mode, product) => {
  if (mode === "create") {
    return "Add Product";
  }

  if (mode === "edit") {
    return `Edit ${product?.name || "Product"}`;
  }

  return product?.name || "Product Details";
};

const ProductDetailsPage = ({ mode }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [categoryTree, setCategoryTree] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(mode !== "create");
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImageFiles, setPendingImageFiles] = useState([]);
  const [imageQueueResetKey, setImageQueueResetKey] = useState(0);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const isCreateMode = mode === "create";
  const isViewMode = mode === "view";

  const categoryRows = useMemo(() => flattenCategoryTree(categoryTree), [categoryTree]);
  const persistedFormData = useMemo(
    () => (editingProduct ? productToFormData(editingProduct) : EMPTY_FORM),
    [editingProduct]
  );

  const loadCategoryTree = useCallback(async () => {
    try {
      setCategoryTree(await fetchAdminCategoryTree(authToken));
    } catch (err) {
      toast.error(err.message || "Failed to load product categories.");
      setCategoryTree([]);
    }
  }, [authToken, toast]);

  const loadProduct = useCallback(async () => {
    if (isCreateMode || !productId) {
      setEditingProduct(null);
      setFormData(EMPTY_FORM);
      setVariantsOpen(false);
      setPendingImageFiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const product = await fetchAdminProduct(authToken, productId);

      setEditingProduct(product);
      setFormData(productToFormData(product));
      setVariantsOpen(Boolean(product?.hasVariants));
      setPendingImageFiles([]);
    } catch (err) {
      toast.error(err.message || "Failed to load product.");
      setEditingProduct(null);
    } finally {
      setLoading(false);
    }
  }, [authToken, isCreateMode, productId, toast]);

  useEffect(() => {
    loadCategoryTree();
  }, [loadCategoryTree]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const setPageFormData = useCallback((nextFormDataOrUpdater) => {
    setFormData((currentFormData) => (
      typeof nextFormDataOrUpdater === "function"
        ? nextFormDataOrUpdater(currentFormData)
        : nextFormDataOrUpdater
    ));
  }, []);

  const handleFormChange = useCallback((event) => {
    const { checked, name, type, value } = event.target;

    setPageFormData((currentFormData) => ({
      ...currentFormData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, [setPageFormData]);

  const handleHasVariantsChange = useCallback((event) => {
    const { checked } = event.target;

    setVariantsOpen(checked);
    setPageFormData((currentFormData) => ({
      ...currentFormData,
      hasVariants: checked,
    }));
  }, [setPageFormData]);

  const handleImagesChange = useCallback((imageUrls) => {
    setPageFormData((currentFormData) => ({
      ...currentFormData,
      imageUrls: joinLines(imageUrls),
    }));
  }, [setPageFormData]);

  const handleAttributesChange = useCallback((attributes) => {
    setPageFormData((currentFormData) => ({
      ...currentFormData,
      attributes,
    }));
  }, [setPageFormData]);

  const handleSelectImageFiles = useCallback((files) => {
    const fileList = Array.from(files || []);
    const imageFiles = fileList.filter((file) => file.type?.startsWith("image/"));

    if (fileList.length === 0) {
      return [];
    }

    if (imageFiles.length === 0) {
      const message = "Only image files can be uploaded.";

      toast.error(message);
      throw new Error(message);
    }

    if (imageFiles.length !== fileList.length) {
      toast.warning("Non-image files were skipped.");
    }

    setPendingImageFiles((currentFiles) => [...currentFiles, ...imageFiles]);
    toast.success(
      imageFiles.length === 1
        ? "Image queued. It will upload after saving."
        : `${imageFiles.length} images queued. They will upload after saving.`
    );

    return imageFiles;
  }, [toast]);

  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
    setPendingImageFiles([]);
    setImageQueueResetKey((currentKey) => currentKey + 1);
    setVariantsOpen(false);
  };

  const handleClose = () => {
    if (saving || savingSection || uploadingImages) {
      return;
    }

    if (mode === "edit" && editingProduct?.id) {
      navigate(getProductViewPath(editingProduct.id));
      return;
    }

    navigate(ROUTES.PRODUCT);
  };

  const handleEditModeToggle = () => {
    if (!editingProduct?.id) {
      return;
    }

    navigate(isViewMode ? getProductEditPath(editingProduct.id) : getProductViewPath(editingProduct.id));
  };

  const handleVariantsChanged = useCallback(async (changes = {}) => {
    if (changes.hasVariants) {
      setVariantsOpen(true);
      setPageFormData((currentFormData) => ({
        ...currentFormData,
        hasVariants: true,
      }));
    }

    await loadProduct();
  }, [loadProduct, setPageFormData]);

  const uploadPendingImages = useCallback(async () => {
    if (pendingImageFiles.length === 0) {
      return [];
    }

    setUploadingImages(true);

    try {
      const uploadedImages = await uploadProductImages(authToken, pendingImageFiles);

      return uploadedImages.map((image) => image.url).filter(Boolean);
    } finally {
      setUploadingImages(false);
    }
  }, [authToken, pendingImageFiles]);

  const handleSectionSubmit = useCallback(async (sectionId, sectionFormData) => {
    if (!editingProduct?.id || savingSection || !sectionFormData) {
      return;
    }

    const payload = buildSectionPayload(sectionId, sectionFormData);
    const validationError = validateSectionPayload(sectionId, payload);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSavingSection(sectionId);

    try {
      if (sectionId === PRODUCT_FORM_SECTION_IDS.MEDIA) {
        const uploadedUrls = await uploadPendingImages();

        payload.images = [
          ...payload.images,
          ...uploadedUrls,
        ];
      }

      const updateResponse = await updateProduct(authToken, editingProduct.id, payload);
      const updatedProduct = getProductFromResponse(updateResponse);

      if (updatedProduct) {
        const updatedFormData = productToFormData(updatedProduct);

        setEditingProduct(updatedProduct);
        setFormData((currentFormData) => (
          mergeFormDataSection(currentFormData, updatedFormData, sectionId)
        ));

        if (sectionId === PRODUCT_FORM_SECTION_IDS.SETTINGS) {
          setVariantsOpen(Boolean(updatedProduct.hasVariants));
        }
      }

      if (sectionId === PRODUCT_FORM_SECTION_IDS.MEDIA) {
        setPendingImageFiles([]);
        setImageQueueResetKey((currentKey) => currentKey + 1);
      }

      toast.success(`${PRODUCT_FORM_SECTION_LABELS[sectionId] || "Product section"} updated.`);
    } catch (err) {
      toast.error(err.message || "Failed to update product section.");
    } finally {
      setSavingSection("");
    }
  }, [
    authToken,
    editingProduct,
    savingSection,
    toast,
    uploadPendingImages,
  ]);

  const handleSubmit = async (submitFormData = formData) => {
    const payload = buildPayload(submitFormData);
    const validationError = validatePayload(payload);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);

    try {
      if (editingProduct) {
        const uploadedUrls = await uploadPendingImages();

        await updateProduct(authToken, editingProduct.id, {
          ...payload,
          images: [
            ...payload.images,
            ...uploadedUrls,
          ],
        });

        toast.success("Product updated successfully.");
        setPendingImageFiles([]);
        navigate(getProductViewPath(editingProduct.id));
        return;
      }

      const createResponse = await createProduct(authToken, payload);
      const createdProduct = getProductFromResponse(createResponse);
      const createdProductId = getProductId(createdProduct);

      if (!createdProductId) {
        throw new Error("Product created, but the response did not include an id.");
      }

      if (pendingImageFiles.length > 0) {
        try {
          const uploadedUrls = await uploadPendingImages();

          await updateProduct(authToken, createdProductId, {
            images: [
              ...payload.images,
              ...uploadedUrls,
            ],
          });
        } catch (err) {
          toast.warning(
            err.message
              ? `Product created, but image upload failed: ${err.message}`
              : "Product created, but image upload failed."
          );
        }
      }

      toast.success("Product created successfully.");
      setPendingImageFiles([]);
      setFormData(EMPTY_FORM);
      navigate(payload.hasVariants ? getProductEditPath(createdProductId) : getProductViewPath(createdProductId), {
        replace: true,
      });
    } catch (err) {
      toast.error(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1240, mx: "auto" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate(ROUTES.PRODUCT)} aria-label="Back to products">
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} noWrap>
              {getPageTitle(mode, editingProduct)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Product editor
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading product...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!isCreateMode && !editingProduct) {
    return (
      <Box sx={{ maxWidth: 1240, mx: "auto" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate(ROUTES.PRODUCT)} aria-label="Back to products">
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800}>
              Product Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Product editor
            </Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(ROUTES.PRODUCT)}>
          Products
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1240, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <IconButton onClick={() => navigate(ROUTES.PRODUCT)} aria-label="Back to products">
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h5" fontWeight={800} noWrap>
                {getPageTitle(mode, editingProduct)}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        {!isCreateMode && editingProduct?.id ? (
          <Button
            variant="outlined"
            startIcon={isViewMode ? <EditIcon /> : <VisibilityIcon />}
            onClick={handleEditModeToggle}
            disabled={saving || Boolean(savingSection) || uploadingImages}
            sx={{ alignSelf: { xs: "flex-end", sm: "center" }, whiteSpace: "nowrap" }}
          >
            {isViewMode ? "Edit" : "View"}
          </Button>
        ) : null}
      </Stack>

      <ProductDetailsForm
        initialEditable={!isViewMode}
        formData={formData}
        persistedFormData={persistedFormData}
        saving={saving}
        savingSection={savingSection}
        uploadingImages={uploadingImages}
        editingProduct={editingProduct}
        categoryRows={categoryRows}
        productStatuses={PRODUCT_STATUSES}
        getHierarchyColor={getHierarchyColor}
        variantsOpen={variantsOpen}
        onClose={handleClose}
        onClear={handleClearForm}
        onChange={handleFormChange}
        onHasVariantsChange={handleHasVariantsChange}
        onImagesChange={handleImagesChange}
        onAttributesChange={handleAttributesChange}
        onSelectImageFiles={handleSelectImageFiles}
        onVariantsChanged={handleVariantsChanged}
        imageQueueResetKey={imageQueueResetKey}
        hideSubmitWhenReadOnly
        onSubmit={handleSubmit}
        onSubmitSection={handleSectionSubmit}
      />
    </Box>
  );
};

export default ProductDetailsPage;
