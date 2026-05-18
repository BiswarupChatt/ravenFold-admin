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
