import { memo } from "react";
import {
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";

import DetailPanel from "./DetailPanel";
import ReadOnlyField from "./ReadOnlyField";

const weightUnits = ["kg", "g", "lb", "oz"];
const dimensionUnits = ["cm", "in"];

const formatMeasurement = (value, unit) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${value} ${unit}`;
};

const ProductShippingPanel = ({
  busy,
  editable,
  formData,
  saveAction,
  onChange,
}) => (
  <DetailPanel title="Shipping" action={saveAction} accentColor="secondary">
    {editable ? (
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <FormControlLabel
            control={(
              <Switch
                checked={formData.shippingRequiresShipping}
                onChange={onChange}
                name="shippingRequiresShipping"
                disabled={busy}
              />
            )}
            label="Requires shipping"
          />
          <FormControlLabel
            control={(
              <Switch
                checked={formData.shippingFreeShippingEligible}
                onChange={onChange}
                name="shippingFreeShippingEligible"
                disabled={busy}
              />
            )}
            label="Free shipping"
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Weight"
            name="shippingWeightValue"
            type="number"
            value={formData.shippingWeightValue}
            onChange={onChange}
            disabled={busy || !formData.shippingRequiresShipping}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: "0.01" }}
          />
          <TextField
            select
            label="Weight Unit"
            name="shippingWeightUnit"
            value={formData.shippingWeightUnit}
            onChange={onChange}
            disabled={busy || !formData.shippingRequiresShipping}
            fullWidth
            size="small"
          >
            {weightUnits.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Shipping Class"
            name="shippingClass"
            value={formData.shippingClass}
            onChange={onChange}
            disabled={busy || !formData.shippingRequiresShipping}
            fullWidth
            size="small"
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Length"
            name="shippingLength"
            type="number"
            value={formData.shippingLength}
            onChange={onChange}
            disabled={busy || !formData.shippingRequiresShipping}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: "0.01" }}
          />
          <TextField
            label="Width"
            name="shippingWidth"
            type="number"
            value={formData.shippingWidth}
            onChange={onChange}
            disabled={busy || !formData.shippingRequiresShipping}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: "0.01" }}
          />
          <TextField
            label="Height"
            name="shippingHeight"
            type="number"
            value={formData.shippingHeight}
            onChange={onChange}
            disabled={busy || !formData.shippingRequiresShipping}
            fullWidth
            size="small"
            inputProps={{ min: 0, step: "0.01" }}
          />
          <TextField
            select
            label="Unit"
            name="shippingDimensionUnit"
            value={formData.shippingDimensionUnit}
            onChange={onChange}
            disabled={busy || !formData.shippingRequiresShipping}
            fullWidth
            size="small"
          >
            {dimensionUnits.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>
    ) : (
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={formData.shippingRequiresShipping ? "Requires shipping" : "No shipping"}
            color={formData.shippingRequiresShipping ? "primary" : "default"}
            size="small"
            variant={formData.shippingRequiresShipping ? "filled" : "outlined"}
          />
          <Chip
            label={formData.shippingFreeShippingEligible ? "Free shipping" : "Paid shipping"}
            color={formData.shippingFreeShippingEligible ? "success" : "default"}
            size="small"
            variant={formData.shippingFreeShippingEligible ? "filled" : "outlined"}
          />
        </Stack>
        <ReadOnlyField
          label="Weight"
          value={formatMeasurement(formData.shippingWeightValue, formData.shippingWeightUnit)}
        />
        <ReadOnlyField
          label="Dimensions"
          value={[
            formData.shippingLength || "-",
            formData.shippingWidth || "-",
            formData.shippingHeight || "-",
          ].join(" x ") + ` ${formData.shippingDimensionUnit}`}
        />
        <ReadOnlyField label="Shipping Class" value={formData.shippingClass} />
      </Stack>
    )}
  </DetailPanel>
);

export default memo(ProductShippingPanel);
