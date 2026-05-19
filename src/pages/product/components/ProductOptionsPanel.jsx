import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";

const RECOMMENDED_OPTIONS = [
  "Color",
  "Size",
  "Fabric",
  "Age group",
  "Clothing features",
  "Target gender",
];

const OPTION_PLACEHOLDER = RECOMMENDED_OPTIONS.join(", ");

export const EMPTY_OPTION_FORM = {
  name: "",
  values: "",
};

export const EMPTY_VALUE_EDIT = {
  optionId: "",
  valueId: "",
  value: "",
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

const ProductOptionsPanel = ({
  busy,
  editable,
  editingOptionId,
  editingOptionName,
  editingValue,
  optionForm,
  optionFormOpen,
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
  onEditingOptionNameChange,
  onEditingValueChange,
  onOptionFormChange,
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
          options.map((option) => (
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
                        value={editingOptionName}
                        onChange={(event) => onEditingOptionNameChange(event.target.value)}
                        disabled={busy}
                        fullWidth
                        size="small"
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
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Typography variant="body1" fontWeight={700}>
                          {option.name}
                        </Typography>
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
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={{ minWidth: { xs: "100%", sm: 260 } }}
                            >
                              <TextField
                                label="Value"
                                value={editingValue.value}
                                onChange={(event) => onEditingValueChange(event.target.value)}
                                disabled={busy}
                                size="small"
                                fullWidth
                              />
                              <Button size="small" variant="contained" onClick={onUpdateOptionValue} disabled={busy}>
                                Save
                              </Button>
                              <IconButton size="small" onClick={onCancelEditValue} disabled={busy}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          ) : (
                            <Stack
                              key={optionValue.id}
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              sx={valuePillSx}
                            >
                              <Typography variant="body2" fontWeight={600}>
                                {optionValue.value}
                              </Typography>
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
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <TextField
                            label={`Add ${option.name} value`}
                            value={valueDrafts[option.id] || ""}
                            onChange={(event) => onValueDraftChange(option.id, event.target.value)}
                            disabled={busy}
                            fullWidth
                            size="small"
                          />
                          <Button
                            variant="outlined"
                            onClick={() => onAddOptionValue(option.id)}
                            disabled={busy}
                            sx={{ minWidth: 88 }}
                          >
                            Add
                          </Button>
                        </Stack>
                      ) : null}
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
            No variant options added yet.
          </Typography>
        )}
      </Box>

      {editable && optionFormOpen ? (
        <Box
          sx={{
            width: 380,
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
            <TextField
              label="Values"
              value={optionForm.values}
              onChange={(event) => onOptionFormChange("values", event.target.value)}
              disabled={busy}
              fullWidth
              size="small"
              helperText="Comma separated, for example: XS, S, M"
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

export default ProductOptionsPanel;
