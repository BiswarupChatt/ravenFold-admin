import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SyncIcon from "@mui/icons-material/Sync";

import {
  formatBoxTypeDetails,
  getBoxTypeCode,
  getBoxTypeName,
  getPresetShippingBoxTypes,
  getShippingBoxType,
  getShippingBoxTypeLabel,
  SHIPPING_CUSTOM_BOX_TYPE,
} from "@/lib/shipping/boxTypes";
import { formatOrderDateTime, ORDER_STATUS_OPTIONS } from "./orderFormatters";
import { formatProviderName, getLatestShipment, getShipmentStatusMeta } from "./shipmentFormatters";

const SHIPROCKET_DASHBOARD_URL = "https://app.shiprocket.in/";
const PRODUCT_DIMENSIONS_BOX_TYPE = "__product_dimensions";
const PRODUCT_DIMENSIONS_BOX_TYPE_LABEL = "Product dimension";
const BOX_TYPE_PLACEHOLDER = "Select box type";
const SHIPROCKET_PROVIDER = "shiprocket";

const terminalOrderStatuses = new Set(["cancelled", "delivered", "returned"]);
const movingStatuses = new Set(["picked_up", "in_transit", "out_for_delivery", "delivered", "rto", "lost"]);
const pickupSyncedStatuses = new Set(["pickup_scheduled", ...movingStatuses]);
const orderStatusOptions = ORDER_STATUS_OPTIONS.filter((status) => status.value !== "all");
const emptyPackageFields = { breadth: "", height: "", length: "", weight: "" };
const initialShipmentForm = {
  boxType: "",
  breadth: "",
  height: "",
  length: "",
  note: "",
  provider: SHIPROCKET_PROVIDER,
  weight: "",
};

const hasValue = (value) => value !== null && value !== undefined && value !== "";
const cleanValue = (value = "") => {
  const normalizedValue = String(value || "").trim();

  return ["", "0", "null", "undefined", "nan"].includes(normalizedValue.toLowerCase())
    ? ""
    : normalizedValue;
};
const isDisplayableTrackingUrl = (value = "") => {
  const trackingUrl = cleanValue(value);

  return Boolean(
    trackingUrl &&
    !trackingUrl.includes("/courier/track/awb/") &&
    !trackingUrl.includes("/courier/track/shipment/"),
  );
};

const hasCompleteDimensions = (packageDetails = {}) => (
  hasValue(packageDetails.length) &&
  hasValue(packageDetails.breadth) &&
  hasValue(packageDetails.height)
);

const dimensionMultipliersToCm = { cm: 1, in: 2.54 };
const weightMultipliersToKg = { g: 0.001, kg: 1, lb: 0.45359237, oz: 0.0283495231 };
const roundMeasurement = (value) => Number(Number(value).toFixed(2));

const convertMeasurement = (value, unit, multipliers) => {
  if (!hasValue(value)) return "";

  const numberValue = Number(value);
  const multiplier = multipliers[String(unit || "").toLowerCase()];

  if (!Number.isFinite(numberValue) || !multiplier) return "";

  return String(roundMeasurement(numberValue * multiplier));
};

const isSingleUnitOrder = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];

  return items.length === 1 && Number(items[0]?.quantity || 0) === 1;
};

const getProductPackageFromOrder = (order) => {
  if (!isSingleUnitOrder(order)) return null;

  const shipping = order.items?.[0]?.productShipping;

  if (!shipping || shipping.requiresShipping === false) return null;

  const packageDetails = {
    breadth: convertMeasurement(shipping.dimensions?.width, shipping.dimensions?.unit || "cm", dimensionMultipliersToCm),
    height: convertMeasurement(shipping.dimensions?.height, shipping.dimensions?.unit || "cm", dimensionMultipliersToCm),
    length: convertMeasurement(shipping.dimensions?.length, shipping.dimensions?.unit || "cm", dimensionMultipliersToCm),
    weight: convertMeasurement(shipping.weight?.value, shipping.weight?.unit || "kg", weightMultipliersToKg),
  };

  return hasCompleteDimensions(packageDetails) ? packageDetails : null;
};

const compactPackagePayload = (form = {}) => {
  const payload = { ...form };

  if (payload.boxType === PRODUCT_DIMENSIONS_BOX_TYPE) {
    delete payload.boxType;
  }

  for (const field of ["boxType", "breadth", "height", "length", "weight"]) {
    if (!hasValue(payload[field])) {
      delete payload[field];
    }
  }

  return payload;
};

const formatPackageSummary = (packageDetails = {}, boxTypes = []) => {
  if (!packageDetails || !hasCompleteDimensions(packageDetails)) return "";

  const dimensions = `${packageDetails.length} x ${packageDetails.breadth} x ${packageDetails.height} cm`;
  const weight = hasValue(packageDetails.weight) ? `${packageDetails.weight} kg` : "";

  return [
    getShippingBoxTypeLabel(packageDetails.boxType, boxTypes, packageDetails.boxTypeName),
    dimensions,
    weight,
  ].filter(Boolean).join(" / ");
};

const getBoxTypeSelectLabel = (value = "", boxTypes = []) => {
  if (value === PRODUCT_DIMENSIONS_BOX_TYPE) return PRODUCT_DIMENSIONS_BOX_TYPE_LABEL;

  const selectedBoxType = getShippingBoxType(value, boxTypes);

  if (!selectedBoxType) return getShippingBoxTypeLabel(value, boxTypes);

  const details = formatBoxTypeDetails(selectedBoxType);
  const name = getBoxTypeName(selectedBoxType);

  return details ? `${name} (${details})` : name;
};

const formatShipmentDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2005) return "";

  return formatOrderDateTime(value);
};

const StatusPill = ({ status }) => {
  const meta = getShipmentStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
      sx={{ fontWeight: 700 }}
    />
  );
};

const DetailItem = ({ label, value, children }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {children || (
      <Typography variant="body2" fontWeight={800} sx={{ mt: 0.25, wordBreak: "break-word" }}>
        {cleanValue(value) || "Pending"}
      </Typography>
    )}
  </Box>
);

const ShipmentProgress = ({ shipment }) => {
  const steps = [
    { done: Boolean(cleanValue(shipment?.providerOrderId)), label: "Created" },
    { done: Boolean(cleanValue(shipment?.awbCode)), label: "AWB" },
    {
      done: Boolean(shipment?.pickupScheduledAt || pickupSyncedStatuses.has(shipment?.status)),
      label: "Pickup",
    },
    { done: Boolean(movingStatuses.has(shipment?.status)), label: "Movement" },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 0.75,
        gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
      }}
    >
      {steps.map((step) => (
        <Stack
          key={step.label}
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{
            bgcolor: step.done ? "success.50" : "action.hover",
            border: "1px solid",
            borderColor: step.done ? "success.light" : "divider",
            borderRadius: 1.5,
            minHeight: 36,
            px: 1,
          }}
        >
          {step.done ? (
            <CheckCircleOutlineIcon color="success" fontSize="small" />
          ) : (
            <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
          )}
          <Typography variant="caption" fontWeight={800} noWrap>
            {step.label}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
};

const ShipmentSummary = ({ boxTypes = [], shipment }) => {
  if (!shipment) {
    return (
      <Box
        sx={{
          bgcolor: "action.hover",
          borderRadius: 2,
          px: 1.5,
          py: 1.25,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No Shiprocket shipment has been created for this order.
        </Typography>
      </Box>
    );
  }

  const packageSummary = formatPackageSummary(shipment.package, boxTypes);
  const pickupDate = formatShipmentDateTime(shipment.pickupScheduledAt);
  const providerOrderId = cleanValue(shipment.providerOrderId);
  const providerShipmentId = cleanValue(shipment.providerShipmentId);
  const awbCode = cleanValue(shipment.awbCode);
  const courierName = cleanValue(shipment.courierName);
  const eta = cleanValue(shipment.estimatedDeliveryDays);
  const pickupToken = cleanValue(shipment.pickupTokenNumber);
  const trackingUrl = isDisplayableTrackingUrl(shipment.trackingUrl) ? cleanValue(shipment.trackingUrl) : "";

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <StatusPill status={shipment.status} />
        <Typography variant="body2" fontWeight={900}>
          {formatProviderName(shipment.provider)}
        </Typography>
        {courierName ? (
          <Typography variant="body2" color="text.secondary">
            {courierName}
          </Typography>
        ) : null}
      </Stack>

      <ShipmentProgress shipment={shipment} />

      <Box
        sx={{
          bgcolor: "action.hover",
          borderRadius: 2,
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
          p: 1.5,
        }}
      >
        <DetailItem label="Provider order" value={providerOrderId} />
        <DetailItem label="Shipment ID" value={providerShipmentId} />
        <DetailItem label="AWB" value={awbCode} />
        <DetailItem label="Package" value={packageSummary || "Package not selected"} />
        <DetailItem label="Pickup" value={pickupDate || "Not booked"} />
        <DetailItem label="Created" value={formatShipmentDateTime(shipment.createdAt)} />
      </Box>

      {(trackingUrl || shipment.labelUrl || shipment.manifestUrl || eta || pickupToken) ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {trackingUrl ? (
            <Button
              href={trackingUrl}
              rel="noreferrer"
              size="small"
              target="_blank"
              variant="outlined"
            >
              Tracking
            </Button>
          ) : null}
          {shipment.labelUrl ? (
            <Button href={shipment.labelUrl} rel="noreferrer" size="small" target="_blank" variant="outlined">
              Label
            </Button>
          ) : null}
          {shipment.manifestUrl ? (
            <Button href={shipment.manifestUrl} rel="noreferrer" size="small" target="_blank" variant="outlined">
              Manifest
            </Button>
          ) : null}
          {eta ? <Chip size="small" variant="outlined" label={`ETA ${eta}`} /> : null}
          {pickupToken ? <Chip size="small" variant="outlined" label={`Pickup token ${pickupToken}`} /> : null}
        </Stack>
      ) : null}
    </Stack>
  );
};

const ShipmentEventsTimeline = ({ shipment }) => {
  const events = Array.isArray(shipment?.events) ? shipment.events : [];

  if (!shipment) return null;

  if (!events.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Tracking events will appear here after Shiprocket has courier or pickup updates.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {events.map((event, index) => {
        const statusMeta = getShipmentStatusMeta(event.status);
        const eventTime = formatOrderDateTime(event.eventAt || event.createdAt);

        return (
          <Stack key={event.id || `${event.providerEventId}-${index}`} direction="row" spacing={1.25}>
            <Stack alignItems="center" sx={{ pt: 0.25 }}>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  borderRadius: "50%",
                  height: 9,
                  width: 9,
                }}
              />
              {index < events.length - 1 ? (
                <Box sx={{ bgcolor: "divider", flex: 1, minHeight: 44, width: 1 }} />
              ) : null}
            </Stack>
            <Box sx={{ flex: 1, minWidth: 0, pb: index < events.length - 1 ? 1.25 : 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip size="small" label={statusMeta.label} color={statusMeta.color} variant="outlined" />
                <Typography variant="caption" color="text.secondary">
                  {eventTime || "Time pending"}
                </Typography>
                {event.location ? (
                  <Typography variant="caption" color="text.secondary">
                    {event.location}
                  </Typography>
                ) : null}
              </Stack>
              <Typography variant="body2" fontWeight={800} sx={{ mt: 0.35 }}>
                {event.message || event.providerStatus || "Shipment activity updated"}
              </Typography>
              {event.providerStatus ? (
                <Typography variant="caption" color="text.secondary">
                  Provider status: {event.providerStatus}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
};

const ShipmentFulfillmentPanel = ({
  actionLoading = false,
  boxTypes = [],
  onCreateProviderOrder,
  onSyncShipmentTracking,
  onUpdateOrderStatus,
  order,
  trackingSyncWarning = "",
}) => {
  const shipments = useMemo(() => (Array.isArray(order?.shipments) ? order.shipments : []), [order?.shipments]);
  const latestShipment = useMemo(() => getLatestShipment(shipments), [shipments]);
  const productPackage = useMemo(() => getProductPackageFromOrder(order), [order]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [shipmentForm, setShipmentForm] = useState(initialShipmentForm);
  const selectedShipment = useMemo(() => {
    if (!shipments.length) return null;

    return shipments.find((shipment) => shipment.id === selectedShipmentId) || latestShipment;
  }, [latestShipment, selectedShipmentId, shipments]);
  const orderIsTerminal = terminalOrderStatuses.has(order?.status);
  const activeShipmentExists = shipments.some((shipment) => !["cancelled", "lost", "rto"].includes(shipment?.status));
  const canCreateShipment = Boolean(order?.id) &&
    order?.paymentStatus === "paid" &&
    !orderIsTerminal &&
    !activeShipmentExists &&
    ["confirmed", "packed", "shipped"].includes(order?.status);
  const canRefreshTracking = Boolean(
    selectedShipment?.id &&
    selectedShipment?.provider !== "manual" &&
    (cleanValue(selectedShipment?.awbCode) || cleanValue(selectedShipment?.providerShipmentId)),
  );
  const singleUnitOrder = isSingleUnitOrder(order);
  const packageDimensionsComplete = hasCompleteDimensions(shipmentForm);
  const customPackageSelected = shipmentForm.boxType === SHIPPING_CUSTOM_BOX_TYPE;
  const productPackageSelected = singleUnitOrder && shipmentForm.boxType === PRODUCT_DIMENSIONS_BOX_TYPE;
  const packageDetailsIncomplete = customPackageSelected && !packageDimensionsComplete;
  const productPackageMissing = productPackageSelected && !packageDimensionsComplete;
  const shipmentFormInvalid = !shipmentForm.boxType || packageDetailsIncomplete || productPackageMissing;

  useEffect(() => {
    setSelectedShipmentId(latestShipment?.id || "");
    setShipmentForm(initialShipmentForm);
  }, [latestShipment?.id, order?.id]);

  useEffect(() => {
    if (!shipments.length) {
      setSelectedShipmentId("");
      return;
    }

    if (selectedShipmentId && shipments.some((shipment) => shipment.id === selectedShipmentId)) return;

    setSelectedShipmentId(latestShipment?.id || shipments[0]?.id || "");
  }, [latestShipment?.id, selectedShipmentId, shipments]);

  const updateShipmentForm = (field) => (event) => {
    const nextValue = event.target.value;

    setShipmentForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue,
    }));
  };

  const handleBoxTypeChange = (event) => {
    const nextBoxType = event.target.value;
    const selectedBoxType = getShippingBoxType(nextBoxType, boxTypes);

    setShipmentForm((currentForm) => ({
      ...currentForm,
      boxType: nextBoxType,
      ...(nextBoxType === PRODUCT_DIMENSIONS_BOX_TYPE ? productPackage || emptyPackageFields : {}),
      ...(selectedBoxType && getBoxTypeCode(selectedBoxType) !== SHIPPING_CUSTOM_BOX_TYPE
        ? {
            breadth: String(selectedBoxType.breadth),
            height: String(selectedBoxType.height),
            length: String(selectedBoxType.length),
            weight: String(selectedBoxType.weight),
          }
        : {}),
    }));
  };

  const handleOrderStatusChange = async (event) => {
    const nextStatus = event.target.value;

    if (!nextStatus || nextStatus === order?.status) return;

    await onUpdateOrderStatus({ status: nextStatus });
  };

  const handleMarkPacked = async () => {
    if (order?.status !== "confirmed") return;

    await onUpdateOrderStatus({ status: "packed" });
  };

  const handleCreateProviderOrder = async () => {
    await onCreateProviderOrder({
      ...compactPackagePayload(shipmentForm),
      note: shipmentForm.note,
      notes: shipmentForm.note,
    });
  };

  const handleSyncTracking = async () => {
    await onSyncShipmentTracking(selectedShipment.id, {
      note: "Tracking refreshed from Shiprocket",
    });
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        minWidth: 0,
        p: 1.5,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "flex-start" }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Shipment
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField
              select
              label="Order status"
              size="small"
              value={order?.status || ""}
              onChange={handleOrderStatusChange}
              disabled={actionLoading || !order?.id}
              sx={{ minWidth: { xs: "100%", sm: 170 } }}
            >
              {orderStatusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
            {order?.paymentStatus === "paid" && order?.status === "confirmed" ? (
              <Button
                disableElevation
                disabled={actionLoading}
                onClick={handleMarkPacked}
                startIcon={<Inventory2OutlinedIcon />}
                variant="outlined"
              >
                Mark Packed
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {trackingSyncWarning ? (
          <Alert severity="warning">{trackingSyncWarning}</Alert>
        ) : null}

        {shipments.length > 1 ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {shipments.map((shipment) => (
              <Button
                key={shipment.id}
                disableElevation
                variant={shipment.id === selectedShipment?.id ? "contained" : "outlined"}
                size="small"
                onClick={() => setSelectedShipmentId(shipment.id)}
              >
                {cleanValue(shipment.awbCode) || cleanValue(shipment.providerOrderId) || "Shipment"}
              </Button>
            ))}
          </Stack>
        ) : null}

        <ShipmentSummary boxTypes={boxTypes} shipment={selectedShipment} />

        {canCreateShipment ? (
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 2,
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Create Shiprocket shipment
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "1.2fr repeat(4, minmax(0, 1fr))",
                  },
                }}
              >
                <TextField
                  select
                  fullWidth
                  error={packageDetailsIncomplete || productPackageMissing}
                  helperText={
                    packageDetailsIncomplete
                      ? "Enter package dimensions."
                      : productPackageMissing
                        ? "Product shipping dimensions are missing."
                        : productPackageSelected
                          ? "Product dimensions loaded."
                          : ""
                  }
                  InputLabelProps={{ shrink: true }}
                  label="Box type"
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selectedBoxType) => (
                      selectedBoxType
                        ? getBoxTypeSelectLabel(selectedBoxType, boxTypes)
                        : <Box component="span" sx={{ color: "text.secondary" }}>{BOX_TYPE_PLACEHOLDER}</Box>
                    ),
                  }}
                  size="small"
                  value={shipmentForm.boxType}
                  onChange={handleBoxTypeChange}
                >
                  <MenuItem value="" disabled>{BOX_TYPE_PLACEHOLDER}</MenuItem>
                  {singleUnitOrder ? <MenuItem value={PRODUCT_DIMENSIONS_BOX_TYPE}>{PRODUCT_DIMENSIONS_BOX_TYPE_LABEL}</MenuItem> : null}
                  {getPresetShippingBoxTypes(boxTypes).map((boxType) => {
                    const details = formatBoxTypeDetails(boxType);
                    const code = getBoxTypeCode(boxType);
                    const name = getBoxTypeName(boxType);

                    return (
                      <MenuItem key={code} value={code}>
                        {details ? `${name} (${details})` : name}
                      </MenuItem>
                    );
                  })}
                  <MenuItem value={SHIPPING_CUSTOM_BOX_TYPE}>Custom size</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  label="Weight kg"
                  type="number"
                  size="small"
                  value={shipmentForm.weight}
                  onChange={updateShipmentForm("weight")}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  fullWidth
                  label="Length cm"
                  error={packageDetailsIncomplete && !hasValue(shipmentForm.length)}
                  type="number"
                  size="small"
                  value={shipmentForm.length}
                  onChange={updateShipmentForm("length")}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  fullWidth
                  label="Breadth cm"
                  error={packageDetailsIncomplete && !hasValue(shipmentForm.breadth)}
                  type="number"
                  size="small"
                  value={shipmentForm.breadth}
                  onChange={updateShipmentForm("breadth")}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  fullWidth
                  label="Height cm"
                  error={packageDetailsIncomplete && !hasValue(shipmentForm.height)}
                  type="number"
                  size="small"
                  value={shipmentForm.height}
                  onChange={updateShipmentForm("height")}
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
                  alignItems: "end",
                }}
              >
                <TextField
                  fullWidth
                  label="Note"
                  size="small"
                  value={shipmentForm.note}
                  onChange={updateShipmentForm("note")}
                  placeholder="Optional internal note"
                />
                <Button
                  disableElevation
                  disabled={actionLoading || shipmentFormInvalid}
                  onClick={handleCreateProviderOrder}
                  variant="contained"
                  sx={{ minHeight: 40, px: 2.5, whiteSpace: "nowrap" }}
                >
                  Create Shipment
                </Button>
              </Box>
            </Stack>
          </Box>
        ) : null}

        {selectedShipment ? (
          <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.25}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  Tracking activity
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    href={SHIPROCKET_DASHBOARD_URL}
                    rel="noreferrer"
                    target="_blank"
                    variant="outlined"
                    startIcon={<OpenInNewIcon />}
                  >
                    Shiprocket
                  </Button>
                  <Button
                    disableElevation
                    disabled={actionLoading || !canRefreshTracking}
                    onClick={handleSyncTracking}
                    startIcon={<SyncIcon />}
                    variant="contained"
                  >
                    Refresh
                  </Button>
                </Stack>
              </Stack>
              <ShipmentEventsTimeline shipment={selectedShipment} />
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
};

export default ShipmentFulfillmentPanel;
