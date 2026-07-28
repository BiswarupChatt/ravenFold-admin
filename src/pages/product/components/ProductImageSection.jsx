import { memo } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import DetailPanel from "./DetailPanel";

const imageStatusChipSx = {
  position: "absolute",
  top: 8,
  left: 8,
  zIndex: 2,
  fontWeight: 700,
  boxShadow: 2,
  "& .MuiChip-label": {
    px: 1,
  },
};

const ProductImageTile = ({
  busy,
  draggedImageIndex,
  editable,
  imageUrl,
  index,
  isPrimary,
  onImageDrop,
  onMoveImage,
  onRemoveImage,
  onSetDraggedImageIndex,
  onSetPrimaryImage,
  totalImages,
}) => (
  <Box
    draggable={editable && !busy}
    onDragStart={() => onSetDraggedImageIndex(index)}
    onDragEnd={() => onSetDraggedImageIndex(null)}
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => onImageDrop(event, index)}
    sx={{
      border: "1px solid",
      borderColor: draggedImageIndex === index || isPrimary ? "primary.main" : "divider",
      borderTop: isPrimary ? "3px solid" : "1px solid",
      borderTopColor: isPrimary ? "warning.main" : "divider",
      borderRadius: 1,
      bgcolor: "background.paper",
      cursor: editable && !busy ? "grab" : "default",
      minWidth: 0,
      overflow: "hidden",
      boxShadow: draggedImageIndex === index ? 2 : 0,
      gridColumn: isPrimary ? { xs: "span 2", sm: "span 2" } : "auto",
      gridRow: isPrimary ? { sm: "span 2" } : "auto",
    }}
  >
    <Box sx={{ position: "relative", aspectRatio: isPrimary ? "4 / 5" : "1 / 1", bgcolor: "action.hover" }}>
      <Box
        component="img"
        src={imageUrl}
        alt=""
        loading="lazy"
        sx={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {editable ? (
        <Tooltip title={isPrimary ? "Primary image" : "Set as primary image"}>
          <span>
            <IconButton
              size="small"
              disabled={busy}
              onClick={() => onSetPrimaryImage(index)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "background.paper",
                color: isPrimary ? "warning.main" : "text.secondary",
                boxShadow: 1,
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              {isPrimary ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      ) : isPrimary ? (
        <Chip label="Primary" color="primary" size="small" sx={{ position: "absolute", top: 8, left: 8 }} />
      ) : null}
    </Box>

    {editable ? (
      <Stack direction="row" alignItems="center">
        <DragIndicatorIcon fontSize="small" color={busy ? "disabled" : "action"} />
        <Tooltip title="Move left">
          <span>
            <IconButton
              size="small"
              disabled={busy || index === 0}
              onClick={() => onMoveImage(index, -1)}
            >
              <KeyboardArrowLeftIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move right">
          <span>
            <IconButton
              size="small"
              disabled={busy || index === totalImages - 1}
              onClick={() => onMoveImage(index, 1)}
            >
              <KeyboardArrowRightIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Remove image">
          <span>
            <IconButton size="small" disabled={busy} onClick={() => onRemoveImage(index)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    ) : null}
  </Box>
);

const ProductImageSection = ({
  busy,
  draggedImageIndex,
  editable,
  imageUrls,
  localImagePreviews,
  localImageUploadFailed,
  saveAction,
  uploadingImages,
  onFileInputChange,
  onImageDrop,
  onMoveImage,
  onRemoveImage,
  onSetDraggedImageIndex,
  onSetPrimaryImage,
  onUploadDragOver,
  onUploadDrop,
}) => {
  const addMediaAction = editable ? (
    <Button component="label" variant="outlined" color="warning" size="small" startIcon={<AddIcon />} disabled={busy}>
      Add media
      <Box
        component="input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onFileInputChange}
      />
    </Button>
  ) : null;
  const panelAction = addMediaAction || saveAction ? (
    <Stack direction="row" spacing={1} alignItems="center">
      {addMediaAction}
      {saveAction}
    </Stack>
  ) : null;

  return (
    <DetailPanel
      title="Media"
      accentColor="warning"
      action={panelAction}
    >
      <Stack spacing={1.5}>
        {uploadingImages ? <LinearProgress /> : null}
        <Box
          onDragOver={onUploadDragOver}
          onDrop={onUploadDrop}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))",
            gap: 1,
          }}
        >
          {imageUrls.map((imageUrl, index) => (
            <ProductImageTile
              key={`${imageUrl}-${index}`}
              busy={busy}
              draggedImageIndex={draggedImageIndex}
              editable={editable}
              imageUrl={imageUrl}
              index={index}
              isPrimary={index === 0}
              totalImages={imageUrls.length}
              onImageDrop={onImageDrop}
              onMoveImage={onMoveImage}
              onRemoveImage={onRemoveImage}
              onSetDraggedImageIndex={onSetDraggedImageIndex}
              onSetPrimaryImage={onSetPrimaryImage}
            />
          ))}

          {localImagePreviews.map((preview) => (
            <Box
              key={preview.id}
              sx={{
                border: "1px solid",
                borderColor: localImageUploadFailed ? "error.main" : "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Box sx={{ position: "relative", aspectRatio: "1 / 1", bgcolor: "action.hover" }}>
                <Box
                  component="img"
                  src={preview.url}
                  alt=""
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Chip
                  label={localImageUploadFailed ? "Not queued" : uploadingImages ? "Uploading" : "Queued"}
                  size="small"
                  sx={{
                    ...imageStatusChipSx,
                    bgcolor: localImageUploadFailed
                      ? "error.main"
                      : uploadingImages
                        ? "info.main"
                        : "warning.main",
                    color: localImageUploadFailed
                      ? "error.contrastText"
                      : uploadingImages
                        ? "info.contrastText"
                        : "warning.contrastText",
                  }}
                />
              </Box>
              <Typography variant="caption" noWrap sx={{ display: "block", px: 1, py: 0.75 }}>
                {preview.name}
              </Typography>
            </Box>
          ))}

          {editable ? (
            <Button
              component="label"
              variant="outlined"
              color="warning"
              disabled={busy}
              sx={{
                borderStyle: "dashed",
                minHeight: 118,
                aspectRatio: "1 / 1",
                color: "text.secondary",
              }}
            >
              <Stack spacing={0.75} alignItems="center">
                <CloudUploadIcon fontSize="small" />
                <Typography variant="caption">Add media</Typography>
              </Stack>
              <Box
                component="input"
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={onFileInputChange}
              />
            </Button>
          ) : null}
        </Box>

        {imageUrls.length === 0 && localImagePreviews.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No media added yet.
          </Typography>
        ) : null}

        {editable && imageUrls.length > 0 ? (
          <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary">
              Uploaded images
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {imageUrls.map((imageUrl, index) => (
                <Tooltip title={imageUrl} key={`${imageUrl}-${index}`}>
                  <Chip
                    label={`${index === 0 ? "Primary: " : ""}${imageUrl}`}
                    color={index === 0 ? "primary" : "default"}
                    variant={index === 0 ? "filled" : "outlined"}
                    onDelete={() => onRemoveImage(index)}
                    disabled={busy}
                    sx={{
                      maxWidth: "100%",
                      "& .MuiChip-label": {
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </DetailPanel>
  );
};

export default memo(ProductImageSection);
