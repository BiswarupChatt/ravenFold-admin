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

export const uploadImage = async (authToken, file, folderKey = "product") => {
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

export const uploadImages = async (authToken, files = [], folderKey = "product") => {
  const fileList = Array.from(files);

  if (fileList.length === 0) {
    return [];
  }

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
