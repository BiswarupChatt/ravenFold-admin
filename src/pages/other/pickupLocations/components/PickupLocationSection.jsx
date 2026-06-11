import { useCallback, useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";

import {
  createPickupLocation,
  deletePickupLocation,
  fetchAdminPickupLocations,
  testShippingProviderConnection,
  updatePickupLocation,
} from "@/lib/api/shippingApi";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import {
  DEFAULT_PAGINATION,
  DEFAULT_TABLE_PARAMS,
  SEARCH_DEBOUNCE_MS,
  normalizeText,
} from "@/lib/utils/utils";
import { useToast } from "@/hooks/ToastContext";
import DeletePickupLocationDialog from "./DeletePickupLocationDialog";
import PickupLocationDialog from "./PickupLocationDialog";
import PickupLocationTable from "./PickupLocationTable";

const EMPTY_LOCATION_FORM = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  code: "",
  country: "India",
  isActive: true,
  name: "",
  phone: "",
  pickupLocation: "",
  pincode: "",
  state: "",
};

const toLocationForm = (location = {}) => ({
  addressLine1: location.addressLine1 || "",
  addressLine2: location.addressLine2 || "",
  city: location.city || "",
  code: location.code || "",
  country: location.country || "India",
  isActive: location.isActive !== false,
  name: location.name || "",
  phone: location.phone || "",
  pickupLocation: location.pickupLocation || "",
  pincode: location.pincode || "",
  state: location.state || "",
});

const buildLocationPayload = (formData = {}) => {
  const payload = {
    addressLine1: normalizeText(formData.addressLine1),
    addressLine2: normalizeText(formData.addressLine2),
    city: normalizeText(formData.city),
    country: normalizeText(formData.country) || "India",
    isActive: Boolean(formData.isActive),
    name: normalizeText(formData.name),
    phone: normalizeText(formData.phone),
    pickupLocation: normalizeText(formData.pickupLocation),
    pincode: normalizeText(formData.pincode),
    state: normalizeText(formData.state),
  };
  const code = normalizeText(formData.code);

  if (code) {
    payload.code = code;
  }

  return payload;
};

const validateLocationPayload = (payload = {}) => {
  if (!payload.name) {
    return "Name is required.";
  }

  return "";
};

const PickupLocationSection = () => {
  const authToken = useAtomValue(authTokenAtom);
  const toast = useToast();
  const [locations, setLocations] = useState([]);
  const [locationParams, setLocationParams] = useState(DEFAULT_TABLE_PARAMS);
  const [locationPagination, setLocationPagination] = useState(DEFAULT_PAGINATION);
  const [locationSearchInput, setLocationSearchInput] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [createLocationForm, setCreateLocationForm] = useState(EMPTY_LOCATION_FORM);
  const [locationForm, setLocationForm] = useState(EMPTY_LOCATION_FORM);
  const [locationFormError, setLocationFormError] = useState("");
  const [editingLocation, setEditingLocation] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState(null);
  const [deletingLocationBusy, setDeletingLocationBusy] = useState(false);
  const [locationStatusUpdatingId, setLocationStatusUpdatingId] = useState("");
  const [testingShiprocket, setTestingShiprocket] = useState(false);
  const [shiprocketStatus, setShiprocketStatus] = useState(null);

  const loadPickupLocations = useCallback(async () => {
    setLoadingLocations(true);
    setLocationError("");

    try {
      const locationList = await fetchAdminPickupLocations(authToken, locationParams);

      setLocations(locationList.items);
      setLocationPagination(locationList.pagination);
    } catch (err) {
      setLocationError(err.message || "Failed to load pickup locations.");
      setLocations([]);
      setLocationPagination({
        ...DEFAULT_PAGINATION,
        limit: locationParams.limit,
        page: locationParams.page,
      });
    } finally {
      setLoadingLocations(false);
    }
  }, [authToken, locationParams]);

  useEffect(() => {
    loadPickupLocations();
  }, [loadPickupLocations]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const search = locationSearchInput.trim();

      setLocationParams((currentParams) => {
        if ((currentParams.search || "") === search) {
          return currentParams;
        }

        const nextParams = {
          ...currentParams,
          page: 1,
        };

        if (search) {
          nextParams.search = search;
        } else {
          delete nextParams.search;
        }

        return nextParams;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [locationSearchInput]);

  const openLocationCreateDialog = () => {
    setEditingLocation(null);
    setLocationForm(createLocationForm);
    setLocationFormError("");
    setLocationDialogOpen(true);
  };

  const openLocationEditDialog = (location) => {
    setEditingLocation(location);
    setLocationForm(toLocationForm(location));
    setLocationFormError("");
    setLocationDialogOpen(true);
  };

  const closeLocationDialog = () => {
    if (savingLocation) {
      return;
    }

    setLocationDialogOpen(false);
    setLocationFormError("");
    setEditingLocation(null);
  };

  const handleLocationFormChange = (event) => {
    const { checked, name, type, value } = event.target;

    setLocationForm((currentForm) => {
      const nextForm = {
        ...currentForm,
        [name]: type === "checkbox" ? checked : value,
      };

      if (!editingLocation) {
        setCreateLocationForm(nextForm);
      }

      return nextForm;
    });
  };

  const handleClearLocationForm = () => {
    setCreateLocationForm(EMPTY_LOCATION_FORM);
    setLocationForm(EMPTY_LOCATION_FORM);
    setLocationFormError("");
  };

  const handleSaveLocation = async () => {
    const payload = buildLocationPayload(locationForm);
    const validationError = validateLocationPayload(payload);

    if (validationError) {
      setLocationFormError(validationError);
      return;
    }

    setSavingLocation(true);
    setLocationFormError("");

    try {
      if (editingLocation) {
        await updatePickupLocation(authToken, editingLocation.id, payload);
        toast.success("Pickup location updated.");
      } else {
        await createPickupLocation(authToken, payload);
        toast.success("Pickup location created.");
        setCreateLocationForm(EMPTY_LOCATION_FORM);
        setLocationForm(EMPTY_LOCATION_FORM);
      }

      setLocationDialogOpen(false);
      setEditingLocation(null);
      await loadPickupLocations();
    } catch (err) {
      setLocationFormError(err.message || "Failed to save pickup location.");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleToggleLocationStatus = async (location) => {
    const nextIsActive = !location.isActive;

    setLocationStatusUpdatingId(location.id);
    setLocationError("");

    try {
      await updatePickupLocation(authToken, location.id, { isActive: nextIsActive });
      toast.success(nextIsActive ? "Pickup location activated." : "Pickup location deactivated.");
      await loadPickupLocations();
    } catch (err) {
      setLocationError(err.message || "Failed to update pickup location status.");
    } finally {
      setLocationStatusUpdatingId("");
    }
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation?.id) {
      return;
    }

    setDeletingLocationBusy(true);
    setLocationError("");

    try {
      await deletePickupLocation(authToken, deletingLocation.id);
      toast.success("Pickup location deleted.");
      setDeletingLocation(null);
      await loadPickupLocations();
    } catch (err) {
      setLocationError(err.message || "Failed to delete pickup location.");
    } finally {
      setDeletingLocationBusy(false);
    }
  };

  const handleTestShiprocket = async () => {
    setTestingShiprocket(true);
    setLocationError("");

    try {
      const result = await testShippingProviderConnection(authToken, "shiprocket");

      setShiprocketStatus(result);
      toast.success("Shiprocket connection checked.");
    } catch (err) {
      setShiprocketStatus(null);
      setLocationError(err.message || "Failed to test Shiprocket connection.");
    } finally {
      setTestingShiprocket(false);
    }
  };

  const handleLocationPageChange = (nextPage) => {
    setLocationParams((currentParams) => ({
      ...currentParams,
      page: nextPage,
    }));
  };

  const handleLocationRowsPerPageChange = (nextLimit) => {
    setLocationParams((currentParams) => ({
      ...currentParams,
      page: 1,
      limit: nextLimit,
    }));
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: "100%", minWidth: 0, borderRadius: 2, overflow: "hidden" }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ p: 2 }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Pickup Locations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage reusable pickup addresses for shipment providers.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField
              size="small"
              placeholder="Search pickup locations"
              value={locationSearchInput}
              onChange={(event) => setLocationSearchInput(event.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: locationSearchInput ? (
                  <InputAdornment position="end">
                    <Tooltip title="Clear search">
                      <IconButton edge="end" size="small" onClick={() => setLocationSearchInput("")}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null,
              }}
            />
            <Button
              disabled={testingShiprocket}
              variant="outlined"
              onClick={handleTestShiprocket}
            >
              {testingShiprocket ? "Checking..." : "Test Shiprocket"}
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={openLocationCreateDialog}
            >
              Add Location
            </Button>
          </Stack>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          {locationError ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLocationError("")}>
              {locationError}
            </Alert>
          ) : null}

          {shiprocketStatus ? (
            <Alert
              severity={shiprocketStatus.readyForShipment ? "success" : "warning"}
              sx={{ mb: 2 }}
              onClose={() => setShiprocketStatus(null)}
            >
              {shiprocketStatus.readyForShipment
                ? "Shiprocket is connected and ready for shipment creation."
                : "Shiprocket authenticated, but shipment setup still needs pickup-location configuration."}
              {` Active local pickup locations: ${shiprocketStatus.activePickupLocationCount}.`}
              {shiprocketStatus.defaultPickupLocation
                ? ` Default provider pickup: ${shiprocketStatus.defaultPickupLocation}.`
                : " No default provider pickup is configured in backend env."}
            </Alert>
          ) : null}

          <PickupLocationTable
            deletingId={deletingLocation?.id || ""}
            error={locationError}
            loading={loadingLocations}
            pagination={locationPagination}
            rows={locations}
            statusUpdatingId={locationStatusUpdatingId}
            onDelete={setDeletingLocation}
            onEdit={openLocationEditDialog}
            onPageChange={handleLocationPageChange}
            onRowsPerPageChange={handleLocationRowsPerPageChange}
            onToggleStatus={handleToggleLocationStatus}
          />
        </Box>
      </Paper>

      <PickupLocationDialog
        editingLocation={editingLocation}
        formData={locationForm}
        formError={locationFormError}
        open={locationDialogOpen}
        saving={savingLocation}
        onChange={handleLocationFormChange}
        onClear={handleClearLocationForm}
        onClose={closeLocationDialog}
        onSubmit={handleSaveLocation}
      />

      <DeletePickupLocationDialog
        deleting={deletingLocationBusy}
        location={deletingLocation}
        open={Boolean(deletingLocation)}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleDeleteLocation}
      />
    </>
  );
};

export default PickupLocationSection;
