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

const initialShipmentForm = {
  awbCode: "",
  boxType: "",
  breadth: "",
  courierCompanyId: "",
  courierName: "",
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

  for (const field of ["courierCompanyId", "courierName"]) {
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

const ShipmentSummary = ({ boxTypes = [], shipment }) => {
  if (!shipment) {
    return (
      <Typography variant="body2" color="text.secondary">
        No shipment has been created yet.
      </Typography>
    );
  }

  const packageSummary = formatPackageSummary(shipment.package, boxTypes);

  return (
    <Stack spacing={1}>
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

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary">
          AWB: <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>{shipment.awbCode || "-"}</Box>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Created: <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
            {formatOrderDateTime(shipment.createdAt)}
          </Box>
        </Typography>
        {shipment.trackingUrl ? (
          <Link href={shipment.trackingUrl} target="_blank" rel="noreferrer" underline="hover" variant="body2">
            Tracking link
          </Link>
        ) : null}
        {packageSummary ? (
          <Typography variant="body2" color="text.secondary">
            Package: <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>{packageSummary}</Box>
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
};

const ShipmentFulfillmentPanel = ({
  actionLoading = false,
  boxTypes = [],
  onCancelShipment,
  onCreateShipment,
  onFetchCourierOptions,
  onUpdateOrderStatus,
  onUpdateShipmentStatus,
  order,
  providerPickupLocations = [],
}) => {
  const shipments = useMemo(() => (Array.isArray(order?.shipments) ? order.shipments : []), [order?.shipments]);
  const latestShipment = useMemo(() => getLatestShipment(shipments), [shipments]);
  const productPackage = useMemo(() => getProductPackageFromOrder(order), [order]);
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
  const orderIsTerminal = terminalOrderStatuses.has(order?.status);
  const canUpdateOrder = Boolean(order?.id);
  const canShowMarkPacked = order?.paymentStatus === "paid" && markPackedVisibleStatuses.has(order?.status);
  const canCreateShipment = Boolean(order?.id) &&
    order?.paymentStatus === "paid" &&
    !orderIsTerminal &&
    ["confirmed", "packed", "shipped"].includes(order?.status);
  const canUpdateShipment = Boolean(latestShipment);
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
  const createShipmentDisabled = actionLoading ||
    pickupLocationMissing ||
    courierOptionsLoading ||
    courierSelectionMissing ||
    courierOptionsUnavailable ||
    packageSelectionMissing ||
    packageDetailsIncomplete ||
    productPackageMissing;

  useEffect(() => {
    setShipmentForm({
      ...initialShipmentForm,
      boxType: "",
    });
    setCourierOptions([]);
    setCourierOptionsError("");
    setCourierOptionsLoaded(false);
  }, [order?.id]);

  useEffect(() => {
    setStatusForm({
      note: "",
      status: latestShipment?.status || "in_transit",
      trackingUrl: latestShipment?.trackingUrl || "",
    });
  }, [latestShipment?.id, latestShipment?.status, latestShipment?.trackingUrl]);

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
            courierCompanyId: "",
            courierName: "",
          }
        : {}),
    }));
  };

  const handleProviderChange = (event) => {
    const nextProvider = event.target.value;

    setShipmentForm((currentForm) => ({
      ...currentForm,
      provider: nextProvider,
      courierCompanyId: "",
      courierName: "",
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
      courierCompanyId: "",
      courierName: "",
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
      courierCompanyId: "",
      courierName: "",
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
      courierCompanyId: nextCourierCompanyId,
      courierName: selectedCourier?.courierName || "",
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

  const handleUpdateShipment = async () => {
    await onUpdateShipmentStatus(latestShipment.id, statusForm);
  };

  const handleCancelShipment = async () => {
    await onCancelShipment(latestShipment.id, {
      note: statusForm.note,
    });
  };

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
              <ShipmentSummary boxTypes={boxTypes} shipment={latestShipment} />
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
                      disabled={createShipmentDisabled}
                      onClick={handleCreateShipment}
                      variant="contained"
                      sx={{
                        minWidth: 170,
                        minHeight: 40,
                        px: 2.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Create Shipment
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
                Update shipment
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "center" }}>
                <TextField
                  select
                  label="Status"
                  size="small"
                  value={statusForm.status}
                  onChange={updateStatusForm("status")}
                  sx={{ minWidth: { xs: "100%", md: 190 } }}
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
                <Button
                  disableElevation
                  disabled={actionLoading}
                  onClick={handleUpdateShipment}
                  variant="contained"
                  sx={{ minWidth: 130 }}
                >
                  Update
                </Button>
                <Button
                  color="error"
                  disabled={actionLoading || latestShipment?.status === "cancelled"}
                  onClick={handleCancelShipment}
                  variant="outlined"
                  sx={{ minWidth: 110 }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
};

export default ShipmentFulfillmentPanel;
