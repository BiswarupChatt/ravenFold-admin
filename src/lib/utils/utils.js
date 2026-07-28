export const DEFAULT_TABLE_PARAMS = {
  page: 1,
  limit: 10,
};

export const CATEGORY_TABLE_PARAMS = {
  ...DEFAULT_TABLE_PARAMS,
  rootOnly: true,
};

export const createDefaultPagination = (params = DEFAULT_TABLE_PARAMS) => ({
  page: params.page,
  limit: params.limit,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

export const DEFAULT_PAGINATION = createDefaultPagination(DEFAULT_TABLE_PARAMS);

export const CATEGORY_DEFAULT_PAGINATION = createDefaultPagination(CATEGORY_TABLE_PARAMS);

export const SEARCH_DEBOUNCE_MS = 400;

export const PRODUCT_STATUSES = ["draft", "active", "inactive"];

export const hasOwn = (source, field) => Object.prototype.hasOwnProperty.call(source, field);

export const HIERARCHY_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#be123c",
];

export const getHierarchyColor = (depth = 0) => {
  return HIERARCHY_COLORS[depth % HIERARCHY_COLORS.length];
};

export const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

export const getUserDisplayName = (user = {}) => {
  return normalizeText([user.firstName, user.lastName].filter(Boolean).join(" "))
    || normalizeText(user.name)
    || normalizeText(user.email);
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  return Number(value).toLocaleString();
};

export const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "-";
  }

  return numberValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCurrency = (value, currency = "INR") => {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const splitLines = (value = "") => {
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const splitCommaSeparatedValues = (value = "") => {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const joinLines = (items = []) => items.join("\n");

export const flattenCategoryTree = (items = [], depth = 0, parentName = "Root") => {
  return items.flatMap((category) => {
    const children = Array.isArray(category.children) ? category.children : [];
    const row = {
      ...category,
      childCount: children.length,
      depth,
      parentName,
    };

    return [
      row,
      ...flattenCategoryTree(children, depth + 1, category.name),
    ];
  });
};

export const getVariantLabel = (variant, options = {}) => {
  if (!variant) {
    return "";
  }

  const {
    fallback = variant.sku || "Variant",
    includeSku = true,
    separator = ", ",
    valueOnly = false,
  } = options;
  const optionLabel = Array.isArray(variant.optionValues)
    ? variant.optionValues
        .map((optionValue) => (
          valueOnly
            ? optionValue.value
            : `${optionValue.optionName}: ${optionValue.value}`
        ))
        .filter(Boolean)
        .join(separator)
    : "";

  if (!optionLabel) {
    return fallback;
  }

  return includeSku && variant.sku ? `${variant.sku} - ${optionLabel}` : optionLabel;
};

export const isNonNegativeInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;

export const isNonZeroInteger = (value) => Number.isInteger(Number(value)) && Number(value) !== 0;

export const buildStockFormFromStock = (stock, extraFields = {}) => ({
  stockOnHand: String(stock?.stockOnHand ?? 0),
  reservedQuantity: String(stock?.reservedQuantity ?? 0),
  lowStockThreshold: String(stock?.lowStockThreshold ?? 5),
  trackInventory: stock?.trackInventory !== false,
  allowBackorder: Boolean(stock?.allowBackorder),
  ...extraFields,
});

export const moveArrayItem = (items, fromIndex, toIndex) => {
  if (fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
};

export const createLocalImagePreviews = (files = []) => {
  return Array.from(files)
    .filter((file) => file.type?.startsWith("image/"))
    .map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${file.size}-${index}-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
};

export const revokeLocalImagePreviews = (previews = []) => {
  previews.forEach((preview) => URL.revokeObjectURL(preview.url));
};

export const getDiscountPercent = (basePrice, salePrice) => {
  const basePriceValue = Number(basePrice);
  const salePriceValue = Number(salePrice);

  if (
    !Number.isFinite(basePriceValue) ||
    !Number.isFinite(salePriceValue) ||
    basePriceValue <= 0 ||
    salePriceValue < 0 ||
    salePriceValue >= basePriceValue
  ) {
    return null;
  }

  return Math.round(((basePriceValue - salePriceValue) / basePriceValue) * 100);
};

export const normalizeAttributes = (attributes = []) => {
  if (!Array.isArray(attributes)) {
    return [];
  }

  return attributes
    .map((attribute) => ({
      name: normalizeText(attribute?.name),
      value: normalizeText(attribute?.value),
    }))
    .filter((attribute) => attribute.name || attribute.value);
};

export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
};

export const normalizePagination = (pagination = {}, fallbackParams = {}) => {
  const limit = Number(pagination.limit || fallbackParams.limit || DEFAULT_TABLE_PARAMS.limit);
  const page = Number(pagination.page || fallbackParams.page || DEFAULT_TABLE_PARAMS.page);
  const total = Number(pagination.total || 0);

  return {
    page,
    limit,
    total,
    totalPages: Number(pagination.totalPages || Math.ceil(total / limit) || 0),
    hasNextPage: Boolean(pagination.hasNextPage),
    hasPrevPage: Boolean(pagination.hasPrevPage),
  };
};
