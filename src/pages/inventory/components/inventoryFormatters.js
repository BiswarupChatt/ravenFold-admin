import { formatDateTime, formatNumber, getVariantLabel } from "@/lib/utils/utils";

export { formatDateTime, formatNumber, getVariantLabel };

export const getStockTargetLabel = (stock) => {
  const productName = stock?.product?.name || stock?.productId || "Product";
  const variantLabel = stock?.variant ? getVariantLabel(stock.variant) : "";

  return variantLabel ? `${productName} / ${variantLabel}` : productName;
};
