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

import { formatOrderDateTime } from "@/pages/order/components/orderFormatters";
import {
  formatProviderName,
  getLatestShipment,
  getShipmentStatusMeta,
  SHIPMENT_STATUS_OPTIONS,
  SHIPPING_PROVIDER_OPTIONS,
} from "./shippingFormatters";

const terminalOrderStatuses = new Set(["cancelled", "delivered", "returned"]);
const terminalShipmentStatuses = new Set(["cancelled", "delivered", "lost", "rto"]);

const initialShipmentForm = {
  awbCode: "",
  breadth: "",
  courierName: "",
  height: "",
  length: "",
  note: "",
  pickupLocation: "",
  provider: "manual",
  trackingUrl: "",
  weight: "",
};

const Field = ({ children }) => (
  <Box sx={{ flex: "1 1 150px", minWidth: 0 }}>
    {children}
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

const ShipmentSummary = ({ shipment }) => {
  if (!shipment) {
    return (
      <Typography variant="body2" color="text.secondary">
        No shipment has been created yet.
      </Typography>
    );
  }

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
      </Stack>
    </Stack>
  );
};

const ShipmentFulfillmentPanel = ({
  actionLoading = false,
  onCancelShipment,
  onCreateShipment,
  onMarkPacked,
  onUpdateShipmentStatus,
  order,
}) => {
  const shipments = useMemo(() => (Array.isArray(order?.shipments) ? order.shipments : []), [order?.shipments]);
  const latestShipment = useMemo(() => getLatestShipment(shipments), [shipments]);
  const [shipmentForm, setShipmentForm] = useState(initialShipmentForm);
  const [statusForm, setStatusForm] = useState({
    note: "",
    status: "in_transit",
    trackingUrl: "",
  });
  const orderIsTerminal = terminalOrderStatuses.has(order?.status);
  const canPack = order?.status === "confirmed" && order?.paymentStatus === "paid";
  const canCreateShipment = Boolean(order?.id) &&
    order?.paymentStatus === "paid" &&
    !orderIsTerminal &&
    ["confirmed", "packed", "shipped"].includes(order?.status);
  const canUpdateShipment = latestShipment && !terminalShipmentStatuses.has(latestShipment.status);
  const showManualFields = shipmentForm.provider === "manual";

  useEffect(() => {
    setShipmentForm(initialShipmentForm);
  }, [order?.id]);

  useEffect(() => {
    setStatusForm({
      note: "",
      status: latestShipment?.status || "in_transit",
      trackingUrl: latestShipment?.trackingUrl || "",
    });
  }, [latestShipment?.id, latestShipment?.status, latestShipment?.trackingUrl]);

  const updateShipmentForm = (field) => (event) => {
    setShipmentForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };

  const updateStatusForm = (field) => (event) => {
    setStatusForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));
  };

  const handleCreateShipment = async () => {
    await onCreateShipment({
      ...shipmentForm,
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
              <ShipmentSummary shipment={latestShipment} />
            </Stack>
          </Stack>

          {canPack ? (
            <Button
              disableElevation
              disabled={actionLoading}
              onClick={() => onMarkPacked({ note: "Order packed from admin shipping" })}
              startIcon={<Inventory2OutlinedIcon />}
              variant="outlined"
              sx={{ alignSelf: { xs: "stretch", md: "flex-start" } }}
            >
              Mark Packed
            </Button>
          ) : null}
        </Stack>

        {canCreateShipment ? (
          <>
            <Divider />
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>
                Create shipment
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
                <Field>
                  <TextField
                    select
                    fullWidth
                    label="Provider"
                    size="small"
                    value={shipmentForm.provider}
                    onChange={updateShipmentForm("provider")}
                  >
                    {SHIPPING_PROVIDER_OPTIONS.map((provider) => (
                      <MenuItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Field>

                {showManualFields ? (
                  <>
                    <Field>
                      <TextField
                        fullWidth
                        label="Courier"
                        size="small"
                        value={shipmentForm.courierName}
                        onChange={updateShipmentForm("courierName")}
                      />
                    </Field>
                    <Field>
                      <TextField
                        fullWidth
                        label="AWB"
                        size="small"
                        value={shipmentForm.awbCode}
                        onChange={updateShipmentForm("awbCode")}
                      />
                    </Field>
                    <Field>
                      <TextField
                        fullWidth
                        label="Tracking URL"
                        size="small"
                        value={shipmentForm.trackingUrl}
                        onChange={updateShipmentForm("trackingUrl")}
                      />
                    </Field>
                  </>
                ) : (
                  <Field>
                    <TextField
                      fullWidth
                      label="Pickup location"
                      size="small"
                      value={shipmentForm.pickupLocation}
                      onChange={updateShipmentForm("pickupLocation")}
                    />
                  </Field>
                )}
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
                <Field>
                  <TextField
                    fullWidth
                    label="Weight kg"
                    size="small"
                    value={shipmentForm.weight}
                    onChange={updateShipmentForm("weight")}
                  />
                </Field>
                <Field>
                  <TextField
                    fullWidth
                    label="Length cm"
                    size="small"
                    value={shipmentForm.length}
                    onChange={updateShipmentForm("length")}
                  />
                </Field>
                <Field>
                  <TextField
                    fullWidth
                    label="Breadth cm"
                    size="small"
                    value={shipmentForm.breadth}
                    onChange={updateShipmentForm("breadth")}
                  />
                </Field>
                <Field>
                  <TextField
                    fullWidth
                    label="Height cm"
                    size="small"
                    value={shipmentForm.height}
                    onChange={updateShipmentForm("height")}
                  />
                </Field>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "center" }}>
                <TextField
                  fullWidth
                  label="Note"
                  size="small"
                  value={shipmentForm.note}
                  onChange={updateShipmentForm("note")}
                />
                <Button
                  disableElevation
                  disabled={actionLoading}
                  onClick={handleCreateShipment}
                  variant="contained"
                  sx={{ minWidth: 160 }}
                >
                  Create Shipment
                </Button>
              </Stack>
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
                  disabled={actionLoading}
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
