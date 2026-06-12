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
  SHIPMENT_STATUS_OPTIONS,
  SHIPPING_PROVIDER_OPTIONS,
} from "./shipmentFormatters";

const terminalOrderStatuses = new Set(["cancelled", "delivered", "returned"]);
const PRODUCT_DIMENSIONS_BOX_TYPE = "__product_dimensions";
const PRODUCT_DIMENSIONS_BOX_TYPE_LABEL = "Product dimension";
const BOX_TYPE_PLACEHOLDER = "Select box type";
const COURIER_PLACEHOLDER = "Select courier";
const PICKUP_LOCATION_PLACEHOLDER = "Select pickup location";
const MANUAL_ORDER_STATUS_OPTIONS = ORDER_STATUS_OPTIONS.filter((status) => status.value !== "all");
const markPackedVisibleStatuses = new Set(["confirmed", "packed"]);
const SHIPROCKET_PROVIDER = "shiprocket";
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
const labelBlockedStatuses = new Set(["cancelled", "delivered", "rto", "lost"]);
const manifestReadyStatuses = new Set(["pickup_scheduled", "picked_up", "in_transit", "out_for_delivery"]);
const nonCancelableShipmentStatuses = new Set([
  "cancelled",
  "delivered",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "rto",
  "lost",
]);
const shipmentMovingStatuses = new Set(["picked_up", "in_transit", "out_for_delivery", "delivered", "rto", "lost"]);
const shipmentProgressSteps = [
  { key: "provider_order", label: "Provider order" },
  { key: "awb", label: "AWB assigned" },
  { key: "pickup", label: "Pickup booked" },
  { key: "tracking", label: "In movement" },
];

const initialShipmentForm = {
  awbCode: "",
  boxType: "",
  breadth: "",
  courierCharge: "",
  courierCompanyId: "",
  courierName: "",
  estimatedDeliveryDays: "",
  height: "",
  length: "",
  note: "",
  pickupAddress: null,
  pickupLocationId: "",
  pickupLocation: "",
  pickupPincode: "",
  provider: "shiprocket",
  trackingUrl: "",
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

const courierResetFields = new Set(["boxType", "breadth", "height", "length", "pickupLocationId", "weight"]);

const compactPackagePayload = (form = {}, { includePickupAddress = false } = {}) => {
  const payload = { ...form };

  if (payload.boxType === PRODUCT_DIMENSIONS_BOX_TYPE) {
    delete payload.boxType;
  }

  for (const field of ["boxType", "breadth", "height", "length", "weight"]) {
    if (!hasValue(payload[field])) {
      delete payload[field];
    }
  }

  if (payload.provider === SHIPROCKET_PROVIDER) {
    delete payload.pickupLocationId;
  } else if (!hasValue(payload.pickupLocationId)) {
    delete payload.pickupLocationId;
  }

  for (const field of ["pickupLocation", "pickupPincode"]) {
    if (!hasValue(payload[field])) {
      delete payload[field];
    }
  }

  if (!includePickupAddress || !payload.pickupAddress) {
    delete payload.pickupAddress;
  }

  for (const field of ["courierCharge", "courierCompanyId", "courierName", "estimatedDeliveryDays"]) {
    if (!hasValue(payload[field])) {
      delete payload[field];
    }
  }

  return payload;
};

const toPickupAddressPayload = (location = {}) => ({
  addressLine1: location.addressLine1 || "",
  addressLine2: location.addressLine2 || "",
  city: location.city || "",
  country: location.country || "India",
  name: location.name || location.pickupLocation || "",
  phone: location.phone || "",
  pincode: location.pincode || "",
  state: location.state || "",
});

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

const getPickupLocationDisplayLabel = (location = {}) => {
  const name = location.name || location.pickupLocation || "";
  const meta = [location.city, location.pincode].filter(Boolean).join(" ");

  return [name, meta].filter(Boolean).join(" / ");
};

const getPickupLocationSelectLabel = (value = "", pickupLocations = []) => {
  const selectedLocation = pickupLocations.find((location) => location.id === value);

  return selectedLocation ? getPickupLocationDisplayLabel(selectedLocation) : value;
};

const getCourierOptionLabel = (courier = {}) => {
  const meta = [
    courier.estimatedDeliveryDays ? `ETD ${courier.estimatedDeliveryDays}` : "",
    hasValue(courier.charge) ? `INR ${courier.charge}` : "",
  ].filter(Boolean).join(" / ");

  return meta ? `${courier.courierName} (${meta})` : courier.courierName;
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
  onAssignShipmentAwb,
  onCancelShipment,
  onCreateProviderOrder,
  onCreateShipment,
  onFetchCourierOptions,
  onGenerateShipmentLabel,
  onGenerateShipmentManifest,
  onScheduleShipmentPickup,
  onSyncShipmentTracking,
  onUpdateOrderStatus,
  onUpdateShipmentStatus,
  order,
  providerPickupLocations = [],
}) => {
  const shipments = useMemo(() => (Array.isArray(order?.shipments) ? order.shipments : []), [order?.shipments]);
  const latestShipment = useMemo(() => getLatestShipment(shipments), [shipments]);
  const productPackage = useMemo(() => getProductPackageFromOrder(order), [order]);
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [shipmentForm, setShipmentForm] = useState(initialShipmentForm);
  const [statusForm, setStatusForm] = useState({
    note: "",
    status: "in_transit",
    trackingUrl: "",
  });
  const [courierOptions, setCourierOptions] = useState([]);
  const [courierOptionsError, setCourierOptionsError] = useState("");
  const [courierOptionsLoaded, setCourierOptionsLoaded] = useState(false);
  const [courierOptionsLoading, setCourierOptionsLoading] = useState(false);
  const selectedShipment = useMemo(() => {
    if (!shipments.length) {
      return null;
    }

    return shipments.find((shipment) => shipment.id === selectedShipmentId) || latestShipment;
  }, [latestShipment, selectedShipmentId, shipments]);
  const orderIsTerminal = terminalOrderStatuses.has(order?.status);
  const canUpdateOrder = Boolean(order?.id);
  const canShowMarkPacked = order?.paymentStatus === "paid" && markPackedVisibleStatuses.has(order?.status);
  const canCreateShipment = Boolean(order?.id) &&
    order?.paymentStatus === "paid" &&
    !orderIsTerminal &&
    ["confirmed", "packed", "shipped"].includes(order?.status);
  const canUpdateShipment = Boolean(selectedShipment);
  const canRefreshTracking = Boolean(selectedShipment?.id && selectedShipment?.provider !== "manual");
  const awaitingAwbAssignment = latestShipment?.provider === SHIPROCKET_PROVIDER &&
    latestShipment?.status === "provider_order_created" &&
    !latestShipment?.awbCode;
  const canSchedulePickup = Boolean(
    selectedShipment?.id &&
    selectedShipment?.provider === SHIPROCKET_PROVIDER &&
    selectedShipment?.awbCode &&
    !pickupScheduledStatuses.has(selectedShipment?.status),
  );
  const canGenerateLabel = Boolean(
    selectedShipment?.id &&
    selectedShipment?.provider === SHIPROCKET_PROVIDER &&
    selectedShipment?.providerShipmentId &&
    selectedShipment?.awbCode &&
    !selectedShipment?.labelUrl &&
    !labelBlockedStatuses.has(selectedShipment?.status),
  );
  const canGenerateManifest = Boolean(
    selectedShipment?.id &&
    selectedShipment?.provider === SHIPROCKET_PROVIDER &&
    selectedShipment?.providerShipmentId &&
    selectedShipment?.awbCode &&
    !selectedShipment?.manifestUrl &&
    (
      Boolean(selectedShipment?.pickupScheduledAt) ||
      manifestReadyStatuses.has(selectedShipment?.status)
    ) &&
    !labelBlockedStatuses.has(selectedShipment?.status),
  );
  const canCancelShipment = Boolean(
    selectedShipment?.id &&
    !nonCancelableShipmentStatuses.has(selectedShipment?.status),
  );
  const shiprocketOrderFieldsLocked = awaitingAwbAssignment;
  const showManualFields = shipmentForm.provider === "manual";
  const shiprocketProviderSelected = shipmentForm.provider === SHIPROCKET_PROVIDER;
  const singleUnitOrder = isSingleUnitOrder(order);
  const packageDimensionsComplete = hasCompleteDimensions(shipmentForm);
  const customPackageSelected = shipmentForm.boxType === SHIPPING_CUSTOM_BOX_TYPE;
  const productPackageSelected = singleUnitOrder && shipmentForm.boxType === PRODUCT_DIMENSIONS_BOX_TYPE;
  const packageSelectionMissing = !shipmentForm.boxType;
  const packageDetailsIncomplete = customPackageSelected && !packageDimensionsComplete;
  const productPackageMissing = productPackageSelected && !packageDimensionsComplete;
  const pickupLocationMissing = shiprocketProviderSelected
    ? !shipmentForm.pickupLocationId
    : !showManualFields && providerPickupLocations.length > 0 && !shipmentForm.pickupLocationId;
  const shipmentFormInvalid = pickupLocationMissing ||
    packageSelectionMissing ||
    packageDetailsIncomplete ||
    productPackageMissing;
  const courierSelectionMissing = shiprocketProviderSelected && !shipmentForm.courierCompanyId;
  const courierOptionsUnavailable = shiprocketProviderSelected &&
    courierOptionsLoaded &&
    !courierOptionsLoading &&
    !courierOptionsError &&
    !pickupLocationMissing &&
    !packageSelectionMissing &&
    !packageDetailsIncomplete &&
    !productPackageMissing &&
    courierOptions.length === 0;
  const createProviderOrderDisabled = actionLoading || shipmentFormInvalid;
  const assignAwbDisabled = actionLoading ||
    courierOptionsLoading ||
    courierSelectionMissing ||
    courierOptionsUnavailable ||
    shipmentFormInvalid ||
    !latestShipment?.id;
  const createShipmentDisabled = actionLoading ||
    shipmentFormInvalid ||
    (shiprocketProviderSelected && (courierOptionsLoading || courierSelectionMissing || courierOptionsUnavailable));

  useEffect(() => {
    setSelectedShipmentId(latestShipment?.id || "");
    setShipmentForm({
      ...initialShipmentForm,
      boxType: "",
    });
    setCourierOptions([]);
    setCourierOptionsError("");
    setCourierOptionsLoaded(false);
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

  useEffect(() => {
    if (!awaitingAwbAssignment || !latestShipment) {
      return;
    }

    setShipmentForm((currentForm) => ({
      ...currentForm,
      awbCode: latestShipment.awbCode || "",
      boxType: latestShipment.package?.boxType || currentForm.boxType || "",
      breadth: hasValue(latestShipment.package?.breadth) ? String(latestShipment.package.breadth) : "",
      courierCharge: hasValue(latestShipment.courierCharge) ? String(latestShipment.courierCharge) : "",
      courierCompanyId: latestShipment.courierCompanyId || "",
      courierName: latestShipment.courierName || "",
      estimatedDeliveryDays: latestShipment.estimatedDeliveryDays || "",
      height: hasValue(latestShipment.package?.height) ? String(latestShipment.package.height) : "",
      length: hasValue(latestShipment.package?.length) ? String(latestShipment.package.length) : "",
      pickupAddress: latestShipment.pickupAddress || null,
      pickupLocation: latestShipment.pickupLocation || "",
      pickupLocationId: latestShipment.pickupLocationId || "",
      pickupPincode: latestShipment.pickupAddress?.pincode || "",
      provider: latestShipment.provider || SHIPROCKET_PROVIDER,
      trackingUrl: latestShipment.trackingUrl || "",
      weight: hasValue(latestShipment.package?.weight) ? String(latestShipment.package.weight) : "",
    }));
  }, [awaitingAwbAssignment, latestShipment]);

  useEffect(() => {
    setStatusForm({
      note: "",
      status: selectedShipment?.status || "in_transit",
      trackingUrl: selectedShipment?.trackingUrl || "",
    });
  }, [selectedShipment?.id, selectedShipment?.status, selectedShipment?.trackingUrl]);

  useEffect(() => {
    if (
      !onFetchCourierOptions ||
      !order?.id ||
      !shiprocketProviderSelected ||
      pickupLocationMissing ||
      packageSelectionMissing ||
      packageDetailsIncomplete ||
      productPackageMissing
    ) {
      setCourierOptions([]);
      setCourierOptionsError("");
      setCourierOptionsLoaded(false);
      setCourierOptionsLoading(false);
      return undefined;
    }

    let isActive = true;

    setCourierOptionsLoading(true);
    setCourierOptionsError("");
    setCourierOptionsLoaded(false);

    onFetchCourierOptions(compactPackagePayload(shipmentForm))
      .then((result) => {
        if (!isActive) {
          return;
        }

        setCourierOptions(result?.couriers || []);
        setCourierOptionsLoaded(true);
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }

        setCourierOptions([]);
        setCourierOptionsLoaded(true);
        setCourierOptionsError(err.message || "Failed to load courier options.");
      })
      .finally(() => {
        if (isActive) {
          setCourierOptionsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    onFetchCourierOptions,
    order?.id,
    packageDetailsIncomplete,
    packageSelectionMissing,
    pickupLocationMissing,
    productPackageMissing,
    shipmentForm.boxType,
    shipmentForm.breadth,
    shipmentForm.height,
    shipmentForm.length,
    shipmentForm.pickupLocationId,
    shipmentForm.provider,
    shipmentForm.weight,
    shiprocketProviderSelected,
  ]);

  const updateShipmentForm = (field) => (event) => {
    const nextValue = event.target.value;

    setShipmentForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue,
      ...(courierResetFields.has(field)
        ? {
            courierCharge: "",
            courierCompanyId: "",
            courierName: "",
            estimatedDeliveryDays: "",
          }
        : {}),
    }));
  };

  const handleProviderChange = (event) => {
    const nextProvider = event.target.value;

    setShipmentForm((currentForm) => ({
      ...currentForm,
      provider: nextProvider,
      courierCharge: "",
      courierCompanyId: "",
      courierName: "",
      estimatedDeliveryDays: "",
      ...(nextProvider === "manual"
        ? {
            pickupAddress: null,
            pickupLocationId: "",
            pickupLocation: "",
            pickupPincode: "",
          }
        : {}),
    }));
  };

  const handlePickupLocationChange = (event) => {
    const nextLocationId = event.target.value;
    const selectedLocation = providerPickupLocations.find((location) => location.id === nextLocationId);

    setShipmentForm((currentForm) => ({
      ...currentForm,
      courierCharge: "",
      courierCompanyId: "",
      courierName: "",
      estimatedDeliveryDays: "",
      pickupAddress: selectedLocation ? toPickupAddressPayload(selectedLocation) : null,
      pickupLocationId: nextLocationId,
      pickupLocation: selectedLocation?.pickupLocation || selectedLocation?.name || "",
      pickupPincode: selectedLocation?.pincode || "",
    }));
  };

  const handleBoxTypeChange = (event) => {
    const nextBoxType = event.target.value;
    const selectedBoxType = getShippingBoxType(nextBoxType, boxTypes);

    setShipmentForm((currentForm) => ({
      ...currentForm,
      boxType: nextBoxType,
      courierCharge: "",
      courierCompanyId: "",
      courierName: "",
      estimatedDeliveryDays: "",
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

  const handleCourierChange = (event) => {
    const nextCourierCompanyId = event.target.value;
    const selectedCourier = courierOptions.find((courier) => courier.courierCompanyId === nextCourierCompanyId);

    setShipmentForm((currentForm) => ({
      ...currentForm,
      courierCharge: selectedCourier?.charge !== null && selectedCourier?.charge !== undefined
        ? String(selectedCourier.charge)
        : "",
      courierCompanyId: nextCourierCompanyId,
      courierName: selectedCourier?.courierName || "",
      estimatedDeliveryDays: selectedCourier?.estimatedDeliveryDays || "",
    }));
  };

  const updateStatusForm = (field) => (event) => {
    setStatusForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
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

  const handleCreateShipment = async () => {
    await onCreateShipment({
      ...compactPackagePayload(shipmentForm, { includePickupAddress: true }),
      note: shipmentForm.note,
      notes: shipmentForm.note,
    });
  };

  const handleCreateProviderOrder = async () => {
    await onCreateProviderOrder({
      ...compactPackagePayload(shipmentForm, { includePickupAddress: true }),
      note: shipmentForm.note,
      notes: shipmentForm.note,
    });
  };

  const handleAssignAwb = async () => {
    await onAssignShipmentAwb(latestShipment.id, {
      courierCharge: shipmentForm.courierCharge,
      courierCompanyId: shipmentForm.courierCompanyId,
      courierName: shipmentForm.courierName,
      estimatedDeliveryDays: shipmentForm.estimatedDeliveryDays,
      note: shipmentForm.note,
    });
  };

  const handleSchedulePickup = async () => {
    await onScheduleShipmentPickup(selectedShipment.id, {
      note: shipmentForm.note || statusForm.note,
    });
  };

  const handleGenerateLabel = async () => {
    await onGenerateShipmentLabel(selectedShipment.id, {
      note: statusForm.note || shipmentForm.note,
    });
  };

  const handleGenerateManifest = async () => {
    await onGenerateShipmentManifest(selectedShipment.id, {
      note: statusForm.note || shipmentForm.note,
    });
  };

  const handleSyncTracking = async () => {
    await onSyncShipmentTracking(selectedShipment.id, {
      note: statusForm.note,
    });
  };

  const handleUpdateShipment = async () => {
    await onUpdateShipmentStatus(selectedShipment.id, statusForm);
  };

  const handleCancelShipment = async () => {
    await onCancelShipment(selectedShipment.id, {
      note: statusForm.note,
    });
  };

  const primaryShipmentAction = !canUpdateShipment
    ? null
    : canSchedulePickup
      ? {
          description: "Book pickup now that the courier and AWB are ready.",
          key: "schedule_pickup",
          label: "Schedule Pickup",
          onClick: handleSchedulePickup,
        }
      : canGenerateManifest
        ? {
            description: "Generate the manifest once pickup is scheduled.",
            key: "generate_manifest",
            label: "Generate Manifest",
            onClick: handleGenerateManifest,
          }
        : canGenerateLabel
          ? {
              description: "Generate the shipping label for printing and packing.",
              key: "generate_label",
              label: "Generate Label",
              onClick: handleGenerateLabel,
            }
          : canRefreshTracking
            ? {
                description: "Pull the latest tracking status from the provider.",
                key: "refresh_tracking",
                label: "Refresh Tracking",
                onClick: handleSyncTracking,
              }
            : null;

  const quickShipmentActions = [
    canGenerateLabel && primaryShipmentAction?.key !== "generate_label"
      ? { key: "generate_label", label: "Generate Label", onClick: handleGenerateLabel }
      : null,
    canSchedulePickup && primaryShipmentAction?.key !== "schedule_pickup"
      ? { key: "schedule_pickup", label: "Schedule Pickup", onClick: handleSchedulePickup }
      : null,
    canGenerateManifest && primaryShipmentAction?.key !== "generate_manifest"
      ? { key: "generate_manifest", label: "Generate Manifest", onClick: handleGenerateManifest }
      : null,
    canRefreshTracking && primaryShipmentAction?.key !== "refresh_tracking"
      ? { key: "refresh_tracking", label: "Refresh Tracking", onClick: handleSyncTracking }
      : null,
  ].filter(Boolean);

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

        <ShipmentProgress shipment={selectedShipment} />

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
                {awaitingAwbAssignment ? "Step 2: Assign AWB" : "Step 1: Shipment setup"}
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
                    {awaitingAwbAssignment
                      ? "Shiprocket order is already created. Choose the courier below and assign the AWB to continue."
                      : "Start with pickup location, package, and courier selection. The panel will guide the next fulfilment step after creation."}
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.25,
                      gridTemplateColumns: showManualFields
                        ? { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }
                        : shiprocketProviderSelected
                          ? { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }
                          : { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    }}
                  >
                    <TextField
                      select
                      fullWidth
                      disabled={shiprocketOrderFieldsLocked}
                      label="Provider"
                      size="small"
                      value={shipmentForm.provider}
                      onChange={handleProviderChange}
                    >
                      {SHIPPING_PROVIDER_OPTIONS.map((provider) => (
                        <MenuItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    {showManualFields ? (
                      <>
                        <TextField
                          fullWidth
                          label="Courier"
                          size="small"
                          value={shipmentForm.courierName}
                          onChange={updateShipmentForm("courierName")}
                        />
                        <TextField
                          fullWidth
                          label="AWB"
                          size="small"
                          value={shipmentForm.awbCode}
                          onChange={updateShipmentForm("awbCode")}
                        />
                        <TextField
                          fullWidth
                          label="Tracking URL"
                          size="small"
                          value={shipmentForm.trackingUrl}
                          onChange={updateShipmentForm("trackingUrl")}
                          sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}
                        />
                      </>
                    ) : (
                      <>
                        <TextField
                          select
                          fullWidth
                          disabled={shiprocketOrderFieldsLocked}
                          helperText={!providerPickupLocations.length ? "No Shiprocket pickup locations found." : ""}
                          InputLabelProps={{ shrink: true }}
                          label="Pickup location"
                          SelectProps={{
                            displayEmpty: true,
                            renderValue: (selectedLocationId) => (
                              selectedLocationId
                                ? getPickupLocationSelectLabel(selectedLocationId, providerPickupLocations)
                                : <Box component="span" sx={{ color: "text.secondary" }}>{PICKUP_LOCATION_PLACEHOLDER}</Box>
                            ),
                          }}
                          size="small"
                          value={shipmentForm.pickupLocationId}
                          onChange={handlePickupLocationChange}
                        >
                          <MenuItem value="" disabled>
                            {PICKUP_LOCATION_PLACEHOLDER}
                          </MenuItem>
                          {providerPickupLocations.map((location) => (
                            <MenuItem key={location.id} value={location.id}>
                              {getPickupLocationDisplayLabel(location)}
                            </MenuItem>
                          ))}
                        </TextField>

                        {shiprocketProviderSelected ? (
                          <TextField
                            select
                            fullWidth
                            disabled={
                              courierOptionsLoading ||
                              pickupLocationMissing ||
                              packageSelectionMissing ||
                              packageDetailsIncomplete ||
                              productPackageMissing
                            }
                            error={Boolean(courierOptionsError || courierOptionsUnavailable)}
                            helperText={
                              courierOptionsError ||
                              (courierOptionsUnavailable ? "No serviceable couriers found." : "")
                            }
                            InputLabelProps={{ shrink: true }}
                            label="Courier"
                            SelectProps={{
                              displayEmpty: true,
                              renderValue: (selectedCourierId) => {
                                const selectedCourier = courierOptions.find(
                                  (courier) => courier.courierCompanyId === selectedCourierId,
                                );

                                return selectedCourier
                                  ? getCourierOptionLabel(selectedCourier)
                                  : <Box component="span" sx={{ color: "text.secondary" }}>
                                      {courierOptionsLoading ? "Loading couriers..." : COURIER_PLACEHOLDER}
                                    </Box>;
                              },
                            }}
                            size="small"
                            value={shipmentForm.courierCompanyId}
                            onChange={handleCourierChange}
                          >
                            <MenuItem value="" disabled>
                              {courierOptionsLoading ? "Loading couriers..." : COURIER_PLACEHOLDER}
                            </MenuItem>
                            {courierOptions.map((courier) => (
                              <MenuItem key={courier.courierCompanyId} value={courier.courierCompanyId}>
                                {getCourierOptionLabel(courier)}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : null}
                      </>
                    )}
                  </Box>

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
                      disabled={shiprocketOrderFieldsLocked}
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
                      disabled={shiprocketOrderFieldsLocked}
                      label="Weight kg"
                      type="number"
                      size="small"
                      value={shipmentForm.weight}
                      onChange={updateShipmentForm("weight")}
                      inputProps={{ min: 0, step: "0.01" }}
                    />
                    <TextField
                      fullWidth
                      disabled={shiprocketOrderFieldsLocked}
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
                      disabled={shiprocketOrderFieldsLocked}
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
                      disabled={shiprocketOrderFieldsLocked}
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
                      placeholder="Optional shipment note"
                    />
                    <Button
                      disableElevation
                      disabled={
                        showManualFields
                          ? createShipmentDisabled
                          : shiprocketProviderSelected
                            ? (awaitingAwbAssignment ? assignAwbDisabled : createProviderOrderDisabled)
                            : createShipmentDisabled
                      }
                      onClick={
                        showManualFields
                          ? handleCreateShipment
                          : shiprocketProviderSelected
                            ? (awaitingAwbAssignment ? handleAssignAwb : handleCreateProviderOrder)
                            : handleCreateShipment
                      }
                      variant="contained"
                      sx={{
                        minWidth: 170,
                        minHeight: 40,
                        px: 2.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {showManualFields
                        ? "Create Shipment"
                        : shiprocketProviderSelected
                          ? (awaitingAwbAssignment ? "Assign AWB" : "Create Provider Order")
                          : "Create Shipment"}
                    </Button>
                  </Box>
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
                Step actions
              </Typography>
              {primaryShipmentAction || quickShipmentActions.length ? (
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
                            Recommended next step
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                            {primaryShipmentAction.description}
                          </Typography>
                        </Box>
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
                    ) : null}

                    {quickShipmentActions.length ? (
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}>
                          Other actions
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {quickShipmentActions.map((action) => (
                            <Button
                              key={action.key}
                              disableElevation
                              disabled={actionLoading}
                              onClick={action.onClick}
                              variant="outlined"
                              size="small"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </Stack>
                      </Stack>
                    ) : null}
                  </Stack>
                </Box>
              ) : null}

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: { xs: 1.25, md: 1.5 },
                }}
              >
                <Stack spacing={1.25}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Manual override
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                      Use this only when you need to manually correct shipment status or tracking details.
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.25,
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(180px, 220px) minmax(0, 1fr) minmax(0, 1fr)",
                      },
                    }}
                  >
                    <TextField
                      select
                      label="Status"
                      size="small"
                      value={statusForm.status}
                      onChange={updateStatusForm("status")}
                    >
                      {SHIPMENT_STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      label="Tracking URL"
                      size="small"
                      value={statusForm.trackingUrl}
                      onChange={updateStatusForm("trackingUrl")}
                    />
                    <TextField
                      fullWidth
                      label="Note"
                      size="small"
                      value={statusForm.note}
                      onChange={updateStatusForm("note")}
                    />
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                    <Button
                      color="error"
                      disabled={actionLoading || !canCancelShipment}
                      onClick={handleCancelShipment}
                      variant="outlined"
                    >
                      Cancel Shipment
                    </Button>
                    <Button
                      disableElevation
                      disabled={actionLoading}
                      onClick={handleUpdateShipment}
                      variant="contained"
                    >
                      Save Manual Update
                    </Button>
                  </Stack>
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
