import { memo } from "react";
import {
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from "@mui/material";

import { splitCommaSeparatedValues } from "@/lib/utils/utils";
import DetailPanel from "./DetailPanel";
import ReadOnlyField from "./ReadOnlyField";

const ProductSeoPanel = ({
  busy,
  editable,
  formData,
  saveAction,
  onChange,
}) => {
  const keywords = splitCommaSeparatedValues(formData.seoKeywords);

  return (
    <DetailPanel title="SEO" action={saveAction} accentColor="info">
      {editable ? (
        <Stack spacing={2}>
          <TextField
            label="SEO Title"
            name="seoTitle"
            value={formData.seoTitle}
            onChange={onChange}
            disabled={busy}
            fullWidth
            size="small"
            inputProps={{ maxLength: 70 }}
          />
          <TextField
            label="SEO Description"
            name="seoDescription"
            value={formData.seoDescription}
            onChange={onChange}
            disabled={busy}
            fullWidth
            multiline
            minRows={2}
            size="small"
            inputProps={{ maxLength: 180 }}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="SEO Keywords"
              name="seoKeywords"
              value={formData.seoKeywords}
              onChange={onChange}
              disabled={busy}
              fullWidth
              size="small"
              helperText="Separate keywords with commas."
            />
            <TextField
              label="Canonical URL"
              name="seoCanonicalUrl"
              value={formData.seoCanonicalUrl}
              onChange={onChange}
              disabled={busy}
              fullWidth
              size="small"
            />
          </Stack>
          <FormControlLabel
            control={(
              <Switch
                checked={formData.seoNoIndex}
                onChange={onChange}
                name="seoNoIndex"
                disabled={busy}
              />
            )}
            label="No index"
          />
        </Stack>
      ) : (
        <Stack spacing={1.25}>
          <ReadOnlyField label="SEO Title" value={formData.seoTitle} />
          <ReadOnlyField label="SEO Description" value={formData.seoDescription} multiline />
          {keywords.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {keywords.map((keyword) => (
                <Chip key={keyword} label={keyword} size="small" />
              ))}
            </Stack>
          ) : (
            <ReadOnlyField label="SEO Keywords" value="-" />
          )}
          <ReadOnlyField label="Canonical URL" value={formData.seoCanonicalUrl} />
          <Tooltip title={formData.seoNoIndex ? "Search engines should not index this product." : ""}>
            <Chip
              label={formData.seoNoIndex ? "No index" : "Indexable"}
              color={formData.seoNoIndex ? "warning" : "success"}
              size="small"
              variant={formData.seoNoIndex ? "filled" : "outlined"}
              sx={{ alignSelf: "flex-start" }}
            />
          </Tooltip>
        </Stack>
      )}
    </DetailPanel>
  );
};

export default memo(ProductSeoPanel);
