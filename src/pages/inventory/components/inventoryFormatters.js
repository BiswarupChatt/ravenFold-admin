export const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  return Number(value).toLocaleString();
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

export const getVariantLabel = (variant) => {
  if (!variant) {
    return "";
  }

  const options = Array.isArray(variant.optionValues)
    ? variant.optionValues.map((option) => `${option.optionName}: ${option.value}`).join(", ")
    : "";

  return options ? `${variant.sku} - ${options}` : variant.sku;
};

export const getStockTargetLabel = (stock) => {
  const productName = stock?.product?.name || stock?.productId || "Product";
  const variantLabel = stock?.variant ? getVariantLabel(stock.variant) : "";

  return variantLabel ? `${productName} / ${variantLabel}` : productName;
};
