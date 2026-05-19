import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import DetailPanel from "./DetailPanel";
import ReadOnlyField from "./ReadOnlyField";

const ProductAttributesPanel = ({
  attributeRows,
  busy,
  editable,
  visibleAttributeRows,
  onAddAttribute,
  onAttributeChange,
  onRemoveAttribute,
}) => (
  <DetailPanel
    title="Attributes"
    accentColor="secondary"
    action={editable ? (
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        startIcon={<AddIcon />}
        onClick={onAddAttribute}
        disabled={busy}
      >
        Add Attributes
      </Button>
    ) : null}
  >
    {editable ? (
      <Stack spacing={1.5}>
        {attributeRows.length > 0 ? (
          attributeRows.map((attribute, index) => (
            <Stack
              key={index}
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
            >
              <TextField
                label="Name"
                value={attribute.name || ""}
                onChange={(event) => onAttributeChange(index, "name", event.target.value)}
                fullWidth
                size="small"
                disabled={busy}
              />
              <TextField
                label="Value"
                value={attribute.value || ""}
                onChange={(event) => onAttributeChange(index, "value", event.target.value)}
                fullWidth
                size="small"
                disabled={busy}
              />
              <Tooltip title="Remove attribute">
                <span>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onRemoveAttribute(index)}
                    disabled={busy}
                    sx={{ mt: { xs: 0, sm: 0.5 }, alignSelf: { xs: "flex-end", sm: "auto" } }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No attributes added yet.
          </Typography>
        )}
      </Stack>
    ) : visibleAttributeRows.length > 0 ? (
      <Box>
        {visibleAttributeRows.map((attribute, index) => (
          <ReadOnlyField
            key={`${attribute.name}-${index}`}
            label={attribute.name}
            value={attribute.value}
          />
        ))}
      </Box>
    ) : (
      <ReadOnlyField label="Attributes" value="-" />
    )}
  </DetailPanel>
);

export default ProductAttributesPanel;
