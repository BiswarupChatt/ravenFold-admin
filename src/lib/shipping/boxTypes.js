export const SHIPPING_CUSTOM_BOX_TYPE = "custom";

export const getBoxTypeCode = (boxType = {}) => boxType?.code || boxType?.value || "";

export const getBoxTypeName = (boxType = {}) => boxType?.name || boxType?.label || "";

export const getShippingBoxType = (value = "", boxTypes = []) => (
  boxTypes.find((boxType) => getBoxTypeCode(boxType) === value) || null
);

export const getShippingBoxTypeLabel = (value = "", boxTypes = [], fallbackName = "") => (
  getBoxTypeName(getShippingBoxType(value, boxTypes)) || fallbackName || (value === SHIPPING_CUSTOM_BOX_TYPE ? "Custom size" : value || "Custom size")
);

export const formatBoxTypeDetails = (boxType) => {
  if (!boxType || getBoxTypeCode(boxType) === SHIPPING_CUSTOM_BOX_TYPE) {
    return "";
  }

  return `${boxType.length} x ${boxType.breadth} x ${boxType.height} cm, ${boxType.weight} kg`;
};

export const getPresetShippingBoxTypes = (boxTypes = []) => (
  boxTypes.filter((boxType) => getBoxTypeCode(boxType) !== SHIPPING_CUSTOM_BOX_TYPE)
);
