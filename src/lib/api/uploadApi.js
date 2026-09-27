import { apiRequest } from "@/lib/api/apiClient";

const AUTH_MESSAGE = "Please sign in again to upload images.";
const ERROR_MESSAGE = "Image upload failed.";

const normalizeImageAsset = (asset) => {
  if (!asset?.url) {
    return null;
  }

  return {
    publicId: String(asset.publicId || asset.public_id || "").trim(),
    url: String(asset.url).trim(),
  };
};

const getImageDimensions = (file) => new Promise((resolve, reject) => {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    URL.revokeObjectURL(imageUrl);
    resolve({
      height: image.naturalHeight,
      width: image.naturalWidth,
    });
  };

  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    reject(new Error("Unable to read image dimensions."));
  };

  image.src = imageUrl;
});

const isAspectRatioValid = ({ actualHeight, actualWidth, expectedHeight, expectedWidth }) => {
  if (!expectedHeight || !expectedWidth) {
    return true;
  }

  return actualWidth * expectedHeight === actualHeight * expectedWidth;
};

export const validateImageFileDimensions = async (file, rule = {}) => {
  if (!file || !rule.expectedWidth || !rule.expectedHeight) {
    return true;
  }

  const dimensions = await getImageDimensions(file);

  if (!isAspectRatioValid({
    actualHeight: dimensions.height,
    actualWidth: dimensions.width,
    expectedHeight: rule.expectedHeight,
    expectedWidth: rule.expectedWidth,
  })) {
    const label = rule.label || "Image";
    const ratioText = `${rule.expectedWidth} x ${rule.expectedHeight}px ratio`;

    throw new Error(
      `${label} must match ${ratioText}. Selected image is ${dimensions.width} x ${dimensions.height}px.`,
    );
  }

  return true;
};

export const validateImageFilesDimensions = async (files = [], rule = {}) => {
  const fileList = Array.from(files);

  for (const file of fileList) {
    await validateImageFileDimensions(file, rule);
  }

  return true;
};

export const uploadImage = async (authToken, file, folderKey = "product", validationRule = {}) => {
  await validateImageFileDimensions(file, validationRule);

  const formData = new FormData();

  formData.append("image", file);
  formData.append("folderKey", folderKey);

  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: formData,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/uploads/images",
  });

  return normalizeImageAsset(payload?.data);
};

export const uploadImages = async (authToken, files = [], folderKey = "product", validationRule = {}) => {
  const fileList = Array.from(files);

  if (fileList.length === 0) {
    return [];
  }

  await validateImageFilesDimensions(fileList, validationRule);

  const formData = new FormData();

  fileList.forEach((file) => formData.append("images", file));
  formData.append("folderKey", folderKey);

  const payload = await apiRequest({
    authMessage: AUTH_MESSAGE,
    authToken,
    data: formData,
    errorMessage: ERROR_MESSAGE,
    method: "POST",
    url: "/api/uploads/images/multiple",
  });

  return Array.isArray(payload?.data)
    ? payload.data.map(normalizeImageAsset).filter(Boolean)
    : [];
};
