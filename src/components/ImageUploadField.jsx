import { useRef, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { uploadImage } from "@/lib/api/uploadApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";

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

const isAspectRatioValid = ({
  actualHeight,
  actualWidth,
  expectedHeight,
  expectedWidth,
  tolerancePx = 10,
}) => {
  if (!expectedHeight || !expectedWidth) {
    return true;
  }

  const heightForActualWidth = (actualWidth * expectedHeight) / expectedWidth;
  const widthForActualHeight = (actualHeight * expectedWidth) / expectedHeight;

  return (
    Math.abs(actualHeight - heightForActualWidth) <= tolerancePx ||
    Math.abs(actualWidth - widthForActualHeight) <= tolerancePx
  );
};

const formatFileSize = (sizeInMb) => `${Number(sizeInMb).toFixed(Number.isInteger(sizeInMb) ? 0 : 1)} MB`;

const ImageUploadField = ({
  altValue = "",
  disabled = false,
  expectedHeight,
  expectedWidth,
  folderKey = "storefront",
  helperText = "",
  label,
  maxFileSizeMb = 2,
  onAltChange,
  onChange,
  onRemove,
  previewAspectRatio = "16 / 9",
  ratioTolerancePx = 10,
  value = null,
}) => {
  const authToken = useAtomValue(authTokenAtom);
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const expectedText = expectedWidth && expectedHeight
    ? `${expectedWidth} x ${expectedHeight}px ratio, ±${ratioTolerancePx}px tolerance`
    : "";
  const formatText = "Supported formats: JPG, PNG, WEBP, AVIF, GIF.";
  const maxFileSizeBytes = Number(maxFileSizeMb || 0) * 1024 * 1024;
  const sizeText = maxFileSizeMb ? `Maximum size: ${formatFileSize(maxFileSizeMb)}.` : "";

  const handleFileChange = async (event) => {
    const [file] = Array.from(event.target.files || []);

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");

    try {
      if (maxFileSizeBytes && file.size > maxFileSizeBytes) {
        setError(`${label} must be ${formatFileSize(maxFileSizeMb)} or smaller. Selected file is ${formatFileSize(file.size / 1024 / 1024)}.`);
        return;
      }

      const dimensions = await getImageDimensions(file);

      if (!isAspectRatioValid({
        actualHeight: dimensions.height,
        actualWidth: dimensions.width,
        expectedHeight,
        expectedWidth,
        tolerancePx: ratioTolerancePx,
      })) {
        setError(
          `${label} must match ${expectedText}. Selected image is ${dimensions.width} x ${dimensions.height}px.`,
        );
        return;
      }

      setUploading(true);
      const uploadedAsset = await uploadImage(authToken, file, folderKey);

      onChange?.({
        alt: altValue,
        publicId: uploadedAsset?.publicId || "",
        url: uploadedAsset?.url || "",
      });
    } catch (uploadError) {
      setError(uploadError.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={1.25}>
      <Box>
        <Typography fontWeight={700} variant="subtitle2">
          {label}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {[expectedText ? `Required: ${expectedText}.` : "", formatText, sizeText, helperText].filter(Boolean).join(" ")}
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {value?.url ? (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            maxWidth: 420,
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={value.url}
            alt={altValue || label}
            sx={{
              aspectRatio: previewAspectRatio,
              bgcolor: "action.hover",
              display: "block",
              height: "auto",
              objectFit: "contain",
              width: "100%",
            }}
          />
        </Box>
      ) : null}

      {onAltChange ? (
        <TextField
          disabled={disabled || uploading}
          fullWidth
          label="Alt text"
          size="small"
          value={altValue}
          onChange={(event) => onAltChange(event.target.value)}
        />
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          startIcon={uploading ? <CircularProgress color="inherit" size={16} /> : <CloudUploadIcon />}
          variant="outlined"
        >
          {value?.url ? "Replace image" : "Upload image"}
        </Button>
        {value?.url ? (
          <Button
            color="error"
            disabled={disabled || uploading}
            onClick={() => {
              setError("");
              if (onRemove) {
                onRemove();
              } else {
                onChange?.(null);
              }
            }}
            startIcon={<DeleteOutlineIcon />}
            variant="outlined"
          >
            Remove
          </Button>
        ) : null}
        <input
          accept="image/*"
          hidden
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
        />
      </Stack>
    </Stack>
  );
};

export default ImageUploadField;
