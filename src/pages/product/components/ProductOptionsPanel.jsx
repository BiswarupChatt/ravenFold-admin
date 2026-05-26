import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

const RECOMMENDED_OPTIONS = [
  "Color",
  "Size",
  "Fabric",
  "Age group",
  "Clothing features",
  "Target gender",
];

const OPTION_TYPES = [
  { label: "Color", value: "color" },
  { label: "Size", value: "size" },
  { label: "Other", value: "other" },
];

const DISPLAY_STYLES = [
  { label: "Button", value: "button" },
  { label: "Swatch", value: "swatch" },
  { label: "Dropdown", value: "dropdown" },
];

const OPTION_PLACEHOLDER = RECOMMENDED_OPTIONS.join(", ");
const DEFAULT_COLOR_HEX = "#111111";

export const EMPTY_OPTION_FORM = {
  displayStyle: "button",
  name: "",
  optionType: "other",
  sizeGuideImageUrl: "",
  sortOrder: "",
  values: "",
};

export const EMPTY_VALUE_DRAFT = {
  colorHex: DEFAULT_COLOR_HEX,
  label: "",
  sortOrder: "",
  value: "",
};

export const EMPTY_VALUE_EDIT = {
  optionId: "",
  valueId: "",
  ...EMPTY_VALUE_DRAFT,
};

const cardSx = {
  border: "1px solid",
  borderColor: "divider",
  borderTop: "3px solid",
  borderTopColor: "info.main",
  borderRadius: 1,
  bgcolor: "background.paper",
  overflow: "hidden",
};

const valuePillSx = {
  borderRadius: 1,
  bgcolor: (theme) => `${theme.palette.info.main}14`,
  color: "info.dark",
  minHeight: 32,
  px: 1,
};

const getValueDraft = (valueDrafts, optionId) => {
  const draft = valueDrafts[optionId];

  if (typeof draft === "string") {
    return {
      ...EMPTY_VALUE_DRAFT,
      value: draft,
    };
  }

  return {
    ...EMPTY_VALUE_DRAFT,
    ...(draft || {}),
  };
};

const getOptionDraft = (option = {}) => ({
  displayStyle: option.displayStyle || (option.optionType === "color" ? "swatch" : "button"),
  name: option.name || "",
  optionType: option.optionType || "other",
  sizeGuideImageUrl: option.sizeGuideImageUrl || "",
  sortOrder: option.sortOrder === undefined || option.sortOrder === null ? "" : String(option.sortOrder),
  values: "",
});

const getOptionTypeLabel = (optionType) => (
  OPTION_TYPES.find((type) => type.value === optionType)?.label || "Other"
);

const isColorOption = (option = {}) => option.optionType === "color";
const isSizeOption = (option = {}) => option.optionType === "size";

function SizeGuideField({
  busy,
  label,
  onChange,
  onUpload,
  uploading,
  value,
}) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
      <TextField
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={busy}
        fullWidth
        size="small"
        helperText="Upload an image or paste a hosted image URL."
      />
      <Button
        component="label"
        disabled={busy || uploading}
        startIcon={<ImageOutlinedIcon />}
        sx={{ minWidth: 132 }}
        variant="outlined"
      >
        {uploading ? "Uploading" : "Upload"}
        <input
          accept="image/*"
          hidden
          type="file"
          onChange={(event) => {
            const [file] = Array.from(event.target.files || []);

            if (file) {
              onUpload(file);
            }

            event.target.value = "";
          }}
        />
      </Button>
    </Stack>
  );
}

function OptionMetaFields({
  busy,
  form,
  onChange,
  onSizeGuideUpload,
  sizeGuideUploading,
}) {
  return (
    <Stack spacing={1}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          select
          label="Option type"
          value={form.optionType}
          onChange={(event) => onChange("optionType", event.target.value)}
          disabled={busy}
          fullWidth
          size="small"
        >
          {OPTION_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Display style"
          value={form.displayStyle}
          onChange={(event) => onChange("displayStyle", event.target.value)}
          disabled={busy}
          fullWidth
          size="small"
        >
          {DISPLAY_STYLES.map((style) => (
            <MenuItem key={style.value} value={style.value}>
              {style.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Sort order"
          type="number"
          value={form.sortOrder}
          onChange={(event) => onChange("sortOrder", event.target.value)}
          disabled={busy}
          fullWidth
          size="small"
          inputProps={{ min: 0, step: 1 }}
        />
      </Stack>

      {form.optionType === "size" ? (
        <SizeGuideField
          busy={busy}
          label="Size guide image URL"
          onChange={(value) => onChange("sizeGuideImageUrl", value)}
          onUpload={onSizeGuideUpload}
          uploading={sizeGuideUploading}
          value={form.sizeGuideImageUrl}
        />
      ) : null}
    </Stack>
  );
}

function OptionValueFields({
  busy,
  draft,
  isColor,
  onChange,
  optionName,
}) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "flex-start" }}>
      <TextField
        label={`Add ${optionName} value`}
        value={draft.value}
        onChange={(event) => onChange("value", event.target.value)}
        disabled={busy}
        fullWidth
        size="small"
      />
      <TextField
        label="Display label"
        value={draft.label}
        onChange={(event) => onChange("label", event.target.value)}
        disabled={busy}
        fullWidth
        size="small"
      />
      {isColor ? (
        <Stack direction="row" spacing={1} sx={{ minWidth: { md: 190 } }}>
          <TextField
            label="Color"
            type="color"
            value={draft.colorHex || DEFAULT_COLOR_HEX}
            onChange={(event) => onChange("colorHex", event.target.value)}
            disabled={busy}
            size="small"
            sx={{ width: 72 }}
          />
          <TextField
            label="Hex"
            value={draft.colorHex}
            onChange={(event) => onChange("colorHex", event.target.value)}
            disabled={busy}
            size="small"
          />
        </Stack>
      ) : null}
      <TextField
        label="Sort"
        type="number"
        value={draft.sortOrder}
        onChange={(event) => onChange("sortOrder", event.target.value)}
        disabled={busy}
        size="small"
        sx={{ minWidth: { md: 92 } }}
        inputProps={{ min: 0, step: 1 }}
      />
    </Stack>
  );
}

const ProductOptionsPanel = ({
  busy,
  editable,
  editingOptionDraft,
  editingOptionId,
  editingOptionSizeGuideUploading,
  editingValue,
  editingValueOption,
  optionForm,
  optionFormOpen,
  optionFormSizeGuideUploading,
  options,
  valueCount,
  valueDrafts,
  onAddOptionClick,
  onAddOptionValue,
  onCancelEditOption,
  onCancelEditValue,
  onCancelOptionForm,
  onCreateOption,
  onDeleteOption,
  onDeleteOptionValue,
  onEditingOptionChange,
  onEditingOptionSizeGuideUpload,
  onEditingValueChange,
  onOptionFormChange,
  onOptionFormSizeGuideUpload,
  onStartEditOption,
  onStartEditValue,
  onUpdateOption,
  onUpdateOptionValue,
  onValueDraftChange,
}) => (
  <Box sx={cardSx}>
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      sx={(theme) => ({
        px: 2,
        py: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: `${theme.palette.info.main}0F`,
      })}
    >
      <Box>
        <Typography variant="subtitle1" fontWeight={700}>
          Options
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {valueCount} values across {options.length} options
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
        {editable ? (
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddOptionClick}
            disabled={busy}
          >
            Add option
          </Button>
        ) : null}
      </Stack>
    </Stack>

    <Stack spacing={1.5} sx={{ p: 2 }}>
      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
        {options.length > 0 ? (
          options.map((option) => {
            const optionDraft = editingOptionId === option.id
              ? editingOptionDraft
              : getOptionDraft(option);
            const draft = getValueDraft(valueDrafts, option.id);
            const colorOption = isColorOption(option);

            return (
              <Box
                key={option.id}
                sx={{
                  p: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  borderLeft: "3px solid",
                  borderLeftColor: "info.main",
                  bgcolor: (theme) => `${theme.palette.info.main}06`,
                  "&:last-of-type": {
                    borderBottom: 0,
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {editingOptionId === option.id ? (
                      <Stack spacing={1}>
                        <TextField
                          label="Option name"
                          value={optionDraft.name}
                          onChange={(event) => onEditingOptionChange("name", event.target.value)}
                          disabled={busy}
                          fullWidth
                          size="small"
                        />
                        <OptionMetaFields
                          busy={busy}
                          form={optionDraft}
                          onChange={onEditingOptionChange}
                          onSizeGuideUpload={onEditingOptionSizeGuideUpload}
                          sizeGuideUploading={editingOptionSizeGuideUploading}
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={onCancelEditOption} disabled={busy}>
                            Cancel
                          </Button>
                          <Button size="small" variant="contained" onClick={onUpdateOption} disabled={busy}>
                            Save option
                          </Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Stack spacing={1.25}>
                        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
                          <Box>
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography variant="body1" fontWeight={700}>
                                {option.name}
                              </Typography>
                              <Chip size="small" label={getOptionTypeLabel(option.optionType)} />
                              <Chip size="small" label={option.displayStyle || "button"} variant="outlined" />
                              {isSizeOption(option) && option.sizeGuideImageUrl ? (
                                <Chip size="small" label="Size guide" color="success" variant="outlined" />
                              ) : null}
                            </Stack>
                          </Box>
                          {editable ? (
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Edit option">
                                <span>
                                  <IconButton size="small" onClick={() => onStartEditOption(option)} disabled={busy}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete option">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => onDeleteOption(option.id)}
                                    disabled={busy}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          ) : null}
                        </Stack>

                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {(option.values || []).map((optionValue) => (
                            editingValue.valueId === optionValue.id ? (
                              <Stack
                                key={optionValue.id}
                                spacing={1}
                                sx={{ width: "100%" }}
                              >
                                <OptionValueFields
                                  busy={busy}
                                  draft={editingValue}
                                  isColor={isColorOption(editingValueOption)}
                                  onChange={onEditingValueChange}
                                  optionName={editingValueOption?.name || option.name}
                                />
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button size="small" variant="contained" onClick={onUpdateOptionValue} disabled={busy}>
                                    Save value
                                  </Button>
                                  <Button size="small" onClick={onCancelEditValue} disabled={busy}>
                                    Cancel
                                  </Button>
                                </Stack>
                              </Stack>
                            ) : (
                              <Stack
                                key={optionValue.id}
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                sx={valuePillSx}
                              >
                                {optionValue.colorHex ? (
                                  <Box
                                    sx={{
                                      bgcolor: optionValue.colorHex,
                                      border: "1px solid rgba(0, 0, 0, 0.18)",
                                      borderRadius: "50%",
                                      height: 16,
                                      width: 16,
                                    }}
                                  />
                                ) : null}
                                <Typography variant="body2" fontWeight={600}>
                                  {optionValue.label || optionValue.value}
                                </Typography>
                                {optionValue.label && optionValue.label !== optionValue.value ? (
                                  <Typography variant="caption" color="text.secondary">
                                    ({optionValue.value})
                                  </Typography>
                                ) : null}
                                {editable ? (
                                  <>
                                    <Tooltip title="Edit value">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() => onStartEditValue(option.id, optionValue)}
                                          disabled={busy}
                                          sx={{ p: 0.25 }}
                                        >
                                          <EditIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Delete value">
                                      <span>
                                        <IconButton
                                          size="small"
                                          onClick={() => onDeleteOptionValue(option.id, optionValue.id)}
                                          disabled={busy}
                                          sx={{ p: 0.25 }}
                                        >
                                          <CloseIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </>
                                ) : null}
                              </Stack>
                            )
                          ))}
                          {(option.values || []).length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No values yet.
                            </Typography>
                          ) : null}
                        </Stack>

                        {editable ? (
                          <Stack spacing={1}>
                            <OptionValueFields
                              busy={busy}
                              draft={draft}
                              isColor={colorOption}
                              onChange={(field, value) => onValueDraftChange(option.id, field, value)}
                              optionName={option.name}
                            />
                            <Stack direction="row" justifyContent="flex-end">
                              <Button
                                variant="outlined"
                                onClick={() => onAddOptionValue(option.id)}
                                disabled={busy}
                                sx={{ minWidth: 88 }}
                              >
                                Add value
                              </Button>
                            </Stack>
                          </Stack>
                        ) : null}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Box>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
            No variant options added yet.
          </Typography>
        )}
      </Box>

      {editable && optionFormOpen ? (
        <Box
          sx={{
            width: 520,
            maxWidth: "100%",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.paper",
            boxShadow: 4,
            overflow: "hidden",
          }}
        >
          <Stack spacing={1} sx={{ p: 1.5 }}>
            <TextField
              autoFocus
              label="Option name"
              placeholder={OPTION_PLACEHOLDER}
              value={optionForm.name}
              onChange={(event) => onOptionFormChange("name", event.target.value)}
              disabled={busy}
              fullWidth
              size="small"
            />
            <OptionMetaFields
              busy={busy}
              form={optionForm}
              onChange={onOptionFormChange}
              onSizeGuideUpload={onOptionFormSizeGuideUpload}
              sizeGuideUploading={optionFormSizeGuideUploading}
            />
            <TextField
              label="Initial values"
              value={optionForm.values}
              onChange={(event) => onOptionFormChange("values", event.target.value)}
              disabled={busy}
              fullWidth
              size="small"
              helperText="Optional comma separated values. For color options, add values one by one to set color hex."
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button startIcon={<CloseIcon />} onClick={onCancelOptionForm} disabled={busy}>
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateOption}
                disabled={busy}
              >
                Add option
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}
    </Stack>
  </Box>
);

export { DISPLAY_STYLES, OPTION_TYPES };

export default ProductOptionsPanel;
