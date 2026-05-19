export const PRODUCT_FORM_SECTION_IDS = {
  DETAILS: "details",
  SETTINGS: "settings",
  ORGANIZATION: "organization",
  MEDIA: "media",
  SHIPPING: "shipping",
  ATTRIBUTES: "attributes",
  SEO: "seo",
};

export const PRODUCT_FORM_SECTION_LABELS = {
  [PRODUCT_FORM_SECTION_IDS.DETAILS]: "Product details",
  [PRODUCT_FORM_SECTION_IDS.SETTINGS]: "Product settings",
  [PRODUCT_FORM_SECTION_IDS.ORGANIZATION]: "Product organization",
  [PRODUCT_FORM_SECTION_IDS.MEDIA]: "Media",
  [PRODUCT_FORM_SECTION_IDS.SHIPPING]: "Shipping",
  [PRODUCT_FORM_SECTION_IDS.ATTRIBUTES]: "Attributes",
  [PRODUCT_FORM_SECTION_IDS.SEO]: "SEO",
};

export const PRODUCT_FORM_SECTION_ORDER = [
  PRODUCT_FORM_SECTION_IDS.DETAILS,
  PRODUCT_FORM_SECTION_IDS.SETTINGS,
  PRODUCT_FORM_SECTION_IDS.ORGANIZATION,
  PRODUCT_FORM_SECTION_IDS.MEDIA,
  PRODUCT_FORM_SECTION_IDS.SHIPPING,
  PRODUCT_FORM_SECTION_IDS.ATTRIBUTES,
  PRODUCT_FORM_SECTION_IDS.SEO,
];

export const PRODUCT_FORM_SECTION_FIELDS = {
  [PRODUCT_FORM_SECTION_IDS.DETAILS]: [
    "name",
    "description",
    "shortDescription",
    "basePrice",
    "salePrice",
    "sku",
  ],
  [PRODUCT_FORM_SECTION_IDS.SETTINGS]: [
    "status",
    "isFeatured",
    "hasVariants",
  ],
  [PRODUCT_FORM_SECTION_IDS.ORGANIZATION]: [
    "categoryId",
    "slug",
    "tags",
  ],
  [PRODUCT_FORM_SECTION_IDS.MEDIA]: [
    "imageUrls",
  ],
  [PRODUCT_FORM_SECTION_IDS.SHIPPING]: [
    "shippingRequiresShipping",
    "shippingWeightValue",
    "shippingWeightUnit",
    "shippingLength",
    "shippingWidth",
    "shippingHeight",
    "shippingDimensionUnit",
    "shippingClass",
    "shippingFreeShippingEligible",
  ],
  [PRODUCT_FORM_SECTION_IDS.ATTRIBUTES]: [
    "attributes",
  ],
  [PRODUCT_FORM_SECTION_IDS.SEO]: [
    "seoTitle",
    "seoDescription",
    "seoKeywords",
    "seoCanonicalUrl",
    "seoNoIndex",
  ],
};

export const getProductFormSectionValues = (formData, sectionId) => {
  const sectionFields = PRODUCT_FORM_SECTION_FIELDS[sectionId] || [];

  return sectionFields.reduce((values, field) => ({
    ...values,
    [field]: formData?.[field],
  }), {});
};

export const getProductFormSectionSignature = (formData, sectionId) => (
  JSON.stringify(getProductFormSectionValues(formData, sectionId))
);
