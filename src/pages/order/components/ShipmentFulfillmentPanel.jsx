import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

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
import {
  formatProviderName,
  getLatestShipment,
  getShipmentStatusMeta,
} from "./shipmentFormatters";

const terminalOrderStatuses = new Set(["cancelled", "delivered", "returned"]);
const PRODUCT_DIMENSIONS_BOX_TYPE = "__product_dimensions";
const PRODUCT_DIMENSIONS_BOX_TYPE_LABEL = "Product dimension";
const BOX_TYPE_PLACEHOLDER = "Select box type";
const MANUAL_ORDER_STATUS_OPTIONS = ORDER_STATUS_OPTIONS.filter((status) => status.value !== "all");
const markPackedVisibleStatuses = new Set(["confirmed", "packed"]);
const SHIPROCKET_PROVIDER = "shiprocket";
const SHIPROCKET_DASHBOARD_URL = "https://app.shiprocket.in/";
const pickupScheduledStatuses = new Set([
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rto",
  "lost",
]);
const shipmentMovingStatuses = new Set(["picked_up", "in_transit", "out_for_delivery", "delivered", "rto", "lost"]);
const shipmentProgressSteps = [
  { key: "provider_order", label: "Shiprocket order" },
  { key: "awb", label: "AWB synced" },
  { key: "pickup", label: "Pickup synced" },
  { key: "tracking", label: "In movement" },
];

const initialShipmentForm = {
  boxType: "",
  breadth: "",
  height: "",
  length: "",
  note: "",
  provider: "shiprocket",
  weight: "",
};

const hasValue = (value) => value !== null && value !== undefined && value !== "";

const hasCompleteDimensions = (packageDetails = {}) => (
  hasValue(packageDetails.length) &&
  hasValue(packageDetails.breadth) &&
  hasValue(packageDetails.height)
);

const dimensionMultipliersToCm = {
  cm: 1,
  in: 2.54,
};

const weightMultipliersToKg = {
  g: 0.001,
  kg: 1,
  lb: 0.45359237,
  oz: 0.0283495231,
};

const roundMeasurement = (value) => Number(Number(value).toFixed(2));

const convertMeasurement = (value, unit, multipliers) => {
  if (!hasValue(value)) {
    return "";
  }

  const numberValue = Number(value);
  const multiplier = multipliers[String(unit || "").toLowerCase()];

  if (!Number.isFinite(numberValue) || !multiplier) {
    return "";
  }

  return String(roundMeasurement(numberValue * multiplier));
};

const emptyPackageFields = {
  breadth: "",
  height: "",
  length: "",
  weight: "",
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

const isSingleUnitOrder = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];

  return items.length === 1 && Number(items[0]?.quantity || 0) === 1;
};

const getProductPackageFromOrder = (order) => {
  if (!isSingleUnitOrder(order)) {
    return null;
  }

  const shipping = order.items?.[0]?.productShipping;

  if (!shipping || shipping.requiresShipping === false) {
    return null;
  }

  const packageDetails = {
    breadth: convertMeasurement(shipping.dimensions?.width, shipping.dimensions?.unit || "cm", dimensionMultipliersToCm),
    height: convertMeasurement(shipping.dimensions?.height, shipping.dimensions?.unit || "cm", dimensionMultipliersToCm),
    length: convertMeasurement(shipping.dimensions?.length, shipping.dimensions?.unit || "cm", dimensionMultipliersToCm),
    weight: convertMeasurement(shipping.weight?.value, shipping.weight?.unit || "kg", weightMultipliersToKg),
  };

  return hasCompleteDimensions(packageDetails) ? packageDetails : null;
};

const formatPackageSummary = (packageDetails = {}, boxTypes = []) => {
  if (!packageDetails || !hasCompleteDimensions(packageDetails)) {
    return "";
  }

  const dimensions = `${packageDetails.length} x ${packageDetails.breadth} x ${packageDetails.height} cm`;
  const weight = hasValue(packageDetails.weight) ? `${packageDetails.weight} kg` : "";

  return [
    getShippingBoxTypeLabel(packageDetails.boxType, boxTypes, packageDetails.boxTypeName),
    dimensions,
    weight,
  ].filter(Boolean).join(" / ");
};

const getBoxTypeSelectLabel = (value = "", boxTypes = []) => {
  if (value === PRODUCT_DIMENSIONS_BOX_TYPE) {
    return PRODUCT_DIMENSIONS_BOX_TYPE_LABEL;
  }

  const selectedBoxType = getShippingBoxType(value, boxTypes);

  if (selectedBoxType) {
    const details = formatBoxTypeDetails(selectedBoxType);
    const name = getBoxTypeName(selectedBoxType);

    return details ? `${name} (${details})` : name;
  }

  return getShippingBoxTypeLabel(value, boxTypes);
};

const formatShipmentDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2005) {
    return "";
  }

  return formatOrderDateTime(value);
};

const SummaryMetric = ({ label, value, children }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      minWidth: 0,
      p: 1.25,
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    {children || (
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
        {value || "-"}
      </Typography>
    )}
  </Box>
);

const ShipmentStatusChip = ({ status }) => {
  const meta = getShipmentStatusMeta(status);

  return (
    <Chip
      size="small"
      label={meta.label}
      color={meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
    />
  );
};

const ShipmentProgress = ({ shipment }) => {
  const completionMap = {
    provider_order: Boolean(shipment?.providerOrderId),
    awb: Boolean(shipment?.awbCode),
    pickup: Boolean(
      shipment?.pickupScheduledAt ||
      pickupScheduledStatuses.has(shipment?.status) ||
      shipmentMovingStatuses.has(shipment?.status),
    ),
    tracking: Boolean(shipmentMovingStatuses.has(shipment?.status)),
  };
  const currentStepIndex = shipmentProgressSteps.findIndex((step) => !completionMap[step.key]);

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
        Fulfilment progress
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        {shipmentProgressSteps.map((step, index) => {
          const done = completionMap[step.key];
          const current = !done && (currentStepIndex === -1 ? index === shipmentProgressSteps.length - 1 : index === currentStepIndex);

          return (
            <Box
              key={step.key}
              sx={{
                border: "1px solid",
                borderColor: done ? "primary.main" : current ? "warning.main" : "divider",
                bgcolor: done ? "primary.50" : current ? "warning.50" : "background.default",
                borderRadius: 2,
                p: 1.25,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Step {index + 1}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ mt: 0.35 }}>
                {step.label}
              </Typography>
              <Typography variant="caption" color={done ? "primary.main" : current ? "warning.main" : "text.secondary"}>
                {done ? "Done" : current ? "Current" : "Pending"}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};

const ShipmentSummary = ({ boxTypes = [], shipment }) => {
  if (!shipment) {
    return (
      <Typography variant="body2" color="text.secondary">
        No shipment has been created yet.
      </Typography>
    );
  }

  const packageSummary = formatPackageSummary(shipment.package, boxTypes);
  const pickupDate = formatShipmentDateTime(shipment.pickupScheduledAt);

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <ShipmentStatusChip status={shipment.status} />
        <Typography variant="body2" fontWeight={700}>
          {formatProviderName(shipment.provider)}
        </Typography>
        {shipment.courierName ? (
          <Typography variant="body2" color="text.secondary">
            {shipment.courierName}
          </Typography>
        ) : null}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
        }}
      >
        <SummaryMetric label="Provider order" value={shipment.providerOrderId || "Not created"} />
        <SummaryMetric label="AWB" value={shipment.awbCode || "Not assigned"} />
        <SummaryMetric label="Package" value={packageSummary || "Package not selected"} />
        <SummaryMetric label="Pickup" value={pickupDate || "Not booked"} />
        <SummaryMetric label="Links">
          <Stack spacing={0.4} sx={{ mt: 0.5 }}>
            {shipment.providerShipmentId ? (
              <Typography variant="caption" color="text.secondary">
                Shipment ID: {shipment.providerShipmentId}
              </Typography>
            ) : null}
            <Typography variant="body2" fontWeight={700}>
              {formatOrderDateTime(shipment.createdAt)}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {shipment.trackingUrl ? (
                <Link href={shipment.trackingUrl} target="_blank" rel="noreferrer" underline="hover" variant="caption">
                  Tracking
                </Link>
              ) : null}
              {shipment.labelUrl ? (
                <Link href={shipment.labelUrl} target="_blank" rel="noreferrer" underline="hover" variant="caption">
                  Label
                </Link>
              ) : null}
              {shipment.manifestUrl ? (
                <Link href={shipment.manifestUrl} target="_blank" rel="noreferrer" underline="hover" variant="caption">
                  Manifest
                </Link>
              ) : null}
            </Stack>
          </Stack>
        </SummaryMetric>
      </Box>

      {(shipment.courierCharge !== null && shipment.courierCharge !== undefined && shipment.courierCharge !== "") ||
      shipment.estimatedDeliveryDays ||
      shipment.pickupTokenNumber ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {shipment.courierCharge !== null && shipment.courierCharge !== undefined && shipment.courierCharge !== "" ? (
            <Chip size="small" variant="outlined" label={`Charge: INR ${shipment.courierCharge}`} />
          ) : null}
          {shipment.estimatedDeliveryDays ? (
            <Chip size="small" variant="outlined" label={`ETA: ${shipment.estimatedDeliveryDays}`} />
          ) : null}
          {shipment.pickupTokenNumber ? (
            <Chip size="small" variant="outlined" label={`Pickup token: ${shipment.pickupTokenNumber}`} />
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
};

const getShipmentSelectionLabel = (shipment = {}) => {
  const segments = [
    formatProviderName(shipment.provider),
    getShipmentStatusMeta(shipment.status).label,
  ];

  if (shipment.awbCode) {
    segments.push(`AWB ${shipment.awbCode}`);
  } else if (shipment.providerOrderId) {
    segments.push(`Order ${shipment.providerOrderId}`);
  }

  return segments.filter(Boolean).join(" / ");
};

const ShipmentEventsTimeline = ({ shipment }) => {
  const events = Array.isArray(shipment?.events) ? shipment.events : [];

  if (!shipment) {
    return null;
  }

  if (!events.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No shipment activity has been recorded yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {events.map((event) => {
        const statusMeta = getShipmentStatusMeta(event.status);

        return (
          <Box
            key={event.id || `${event.providerEventId}-${event.eventAt || event.createdAt}`}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.default",
              p: 1.25,
            }}
          >
            <Stack spacing={0.5}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <Chip
                  size="small"
                  label={statusMeta.label}
                  color={statusMeta.color}
                  variant={statusMeta.color === "default" ? "outlined" : "filled"}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatOrderDateTime(event.eventAt || event.createdAt)}
                </Typography>
                {event.location ? (
                  <Typography variant="caption" color="text.secondary">
                    {event.location}
                  </Typography>
                ) : null}
              </Stack>
              <Typography variant="body2" fontWeight={600}>
                {event.message || event.providerStatus || "Shipment activity updated"}
              </Typography>
              {event.providerStatus ? (
                <Typography variant="caption" color="text.secondary">
                  Provider status: {event.providerStatus}
                </Typography>
              ) : null}
            </Stack>
          </Box>
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
}) => {
  const shipments = useMemo(() => (Array.isArray(order?.shipments) ? order.shipments : []), [order?.shipments]);
  const latestShipment = useMemo(() => getLatestShipment(shipments), [shipments]);
  const productPackage = useMemo(() => getProductPackageFromOrder(order), [order]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [shipmentForm, setShipmentForm] = useState(initialShipmentForm);
  const selectedShipment = useMemo(() => {
    if (!shipments.length) {
      return null;
    }

    return shipments.find((shipment) => shipment.id === selectedShipmentId) || latestShipment;
  }, [latestShipment, selectedShipmentId, shipments]);
  const orderIsTerminal = terminalOrderStatuses.has(order?.status);
  const activeShipmentExists = shipments.some((shipment) => !["cancelled", "lost", "rto"].includes(shipment?.status));
  const canUpdateOrder = Boolean(order?.id);
  const canShowMarkPacked = order?.paymentStatus === "paid" && markPackedVisibleStatuses.has(order?.status);
  const canCreateShipment = Boolean(order?.id) &&
    order?.paymentStatus === "paid" &&
    !orderIsTerminal &&
    !activeShipmentExists &&
    ["confirmed", "packed", "shipped"].includes(order?.status);
  const canUpdateShipment = Boolean(selectedShipment);
  const shiprocketReferenceMissing = Boolean(
    selectedShipment?.provider === SHIPROCKET_PROVIDER &&
    !selectedShipment?.awbCode &&
    !selectedShipment?.providerShipmentId,
  );
  const canRefreshTracking = Boolean(
    selectedShipment?.id &&
    selectedShipment?.provider !== "manual" &&
    (selectedShipment?.awbCode || selectedShipment?.providerShipmentId),
  );
  const singleUnitOrder = isSingleUnitOrder(order);
  const packageDimensionsComplete = hasCompleteDimensions(shipmentForm);
  const customPackageSelected = shipmentForm.boxType === SHIPPING_CUSTOM_BOX_TYPE;
  const productPackageSelected = singleUnitOrder && shipmentForm.boxType === PRODUCT_DIMENSIONS_BOX_TYPE;
  const packageSelectionMissing = !shipmentForm.boxType;
  const packageDetailsIncomplete = customPackageSelected && !packageDimensionsComplete;
  const productPackageMissing = productPackageSelected && !packageDimensionsComplete;
  const shipmentFormInvalid = packageSelectionMissing ||
    packageDetailsIncomplete ||
    productPackageMissing;
  const createProviderOrderDisabled = actionLoading || shipmentFormInvalid;

  useEffect(() => {
    setSelectedShipmentId(latestShipment?.id || "");
    setShipmentForm({
      ...initialShipmentForm,
      boxType: "",
    });
  }, [order?.id]);

  useEffect(() => {
    if (!shipments.length) {
      setSelectedShipmentId("");
      return;
    }

    if (selectedShipmentId && shipments.some((shipment) => shipment.id === selectedShipmentId)) {
      return;
    }

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

    if (!nextStatus || nextStatus === order?.status) {
      return;
    }

    await onUpdateOrderStatus({
      status: nextStatus,
    });
  };

  const handleMarkPacked = async () => {
    if (order?.status === "packed") {
      return;
    }

    await onUpdateOrderStatus({
      status: "packed",
    });
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

  const primaryShipmentAction = !canUpdateShipment
    ? null
    : canRefreshTracking
      ? {
          description: "Pull the latest AWB, courier, pickup, and tracking status from Shiprocket.",
          key: "refresh_tracking",
          label: "Refresh Tracking",
          onClick: handleSyncTracking,
        }
      : null;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "flex-start" }}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                alignItems: "center",
                bgcolor: "action.hover",
                borderRadius: 1,
                display: "flex",
                flexShrink: 0,
                height: 36,
                justifyContent: "center",
                width: 36,
              }}
            >
              <LocalShippingOutlinedIcon fontSize="small" />
            </Box>
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Shipment
              </Typography>
              <ShipmentSummary boxTypes={boxTypes} shipment={selectedShipment} />
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            {canUpdateOrder ? (
              <TextField
                select
                label="Order status"
                size="small"
                value={order?.status || ""}
                onChange={handleOrderStatusChange}
                disabled={actionLoading}
                sx={{ minWidth: { xs: "100%", sm: 190 } }}
              >
                {MANUAL_ORDER_STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}

            {canShowMarkPacked ? (
              <Button
                disableElevation
                disabled={actionLoading || order?.status === "packed"}
                onClick={handleMarkPacked}
                startIcon={<Inventory2OutlinedIcon />}
                variant="outlined"
                sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}
              >
                Mark Packed
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {shipments.length > 1 ? (
          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>
              Shipment history
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {shipments.map((shipment) => (
                <Button
                  key={shipment.id}
                  disableElevation
                  variant={shipment.id === selectedShipment?.id ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setSelectedShipmentId(shipment.id)}
                >
                  {getShipmentSelectionLabel(shipment)}
                </Button>
              ))}
            </Stack>
          </Stack>
        ) : null}

        {canCreateShipment ? (
          <>
            <Divider />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Create shipment
              </Typography>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.default",
                  p: { xs: 1.25, md: 1.5 },
                }}
              >
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Create the shipment in Shiprocket. Courier, pickup, labels, and manifest stay in Shiprocket.
                  </Typography>
                  <>
                      <Box
                        sx={{
                          display: "grid",
                          gap: 1.25,
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                            lg: "1.25fr repeat(4, minmax(0, 1fr))",
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
                          <MenuItem value="" disabled>
                            {BOX_TYPE_PLACEHOLDER}
                          </MenuItem>
                          {singleUnitOrder ? (
                            <MenuItem value={PRODUCT_DIMENSIONS_BOX_TYPE}>{PRODUCT_DIMENSIONS_BOX_TYPE_LABEL}</MenuItem>
                          ) : null}
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
                          border: "1px dashed",
                          borderColor: "divider",
                          borderRadius: 2,
                          px: 1.25,
                          py: 1,
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1}
                          alignItems={{ xs: "flex-start", md: "center" }}
                          justifyContent="space-between"
                        >
                          <Typography variant="body2" color="text.secondary">
                            Order reference sent to Shiprocket: {order?.orderNumber || order?.id}
                          </Typography>
                          <Chip size="small" variant="outlined" label="Shiprocket order id source" sx={{ flexShrink: 0 }} />
                        </Stack>
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
                          placeholder="Optional provider order note"
                        />
                        <Button
                          disableElevation
                          disabled={createProviderOrderDisabled}
                          onClick={handleCreateProviderOrder}
                          variant="contained"
                          sx={{
                            minWidth: 190,
                            minHeight: 40,
                            px: 2.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Create Shiprocket Shipment
                        </Button>
                      </Box>
                    </>
                </Stack>
              </Box>
            </Stack>
          </>
        ) : null}

        {canUpdateShipment ? (
          <>
            <Divider />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Tracking sync
              </Typography>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  bgcolor: "background.default",
                  p: { xs: 1.25, md: 1.5 },
                }}
              >
                <Stack spacing={1.5}>
                  {primaryShipmentAction ? (
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: "stretch", md: "center" }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Next action
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                          {primaryShipmentAction.description}
                        </Typography>
                      </Box>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexShrink: 0 }}>
                        <Button
                          href={SHIPROCKET_DASHBOARD_URL}
                          rel="noreferrer"
                          target="_blank"
                          variant="outlined"
                          sx={{ minWidth: 150, whiteSpace: "nowrap" }}
                        >
                          Open Shiprocket
                        </Button>
                        <Button
                          disableElevation
                          disabled={actionLoading}
                          onClick={primaryShipmentAction.onClick}
                          variant="contained"
                          sx={{ minWidth: 180, whiteSpace: "nowrap" }}
                        >
                          {primaryShipmentAction.label}
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {shiprocketReferenceMissing ? "Shiprocket identifiers missing" : "Shipment linked"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                        {shiprocketReferenceMissing
                          ? "This shipment does not have AWB or Shiprocket shipment id yet. Use manual options only if you already have those identifiers from Shiprocket."
                          : "Tracking is connected. Open the order any time to refresh the latest shipment status."}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Stack>
          </>
        ) : null}

        {selectedShipment ? (
          <>
            <Divider />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Tracking activity
              </Typography>
              <ShipmentEventsTimeline shipment={selectedShipment} />
            </Stack>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
};

export default ShipmentFulfillmentPanel;
