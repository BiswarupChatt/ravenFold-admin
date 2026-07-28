const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();

    return payload?.message || "Image upload failed.";
  } catch {
    return "Image upload failed.";
  }
};

const getAuthHeaders = (authToken) => {
  if (!authToken) {
    throw new Error("Please sign in again to upload images.");
  }

  return {
    Authorization: `Bearer ${authToken}`,
  };
};

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

  const response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
    method: "POST",
    headers: getAuthHeaders(authToken),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

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

  const response = await fetch(`${API_BASE_URL}/api/uploads/images/multiple`, {
    method: "POST",
    headers: getAuthHeaders(authToken),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();

  return Array.isArray(payload?.data)
    ? payload.data.map(normalizeImageAsset).filter(Boolean)
    : [];
};
