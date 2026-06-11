import Stack from "@mui/material/Stack";

import SectionHeader from "@/components/SectionHeader";
import PickupLocationSection from "./components/PickupLocationSection";

const PickupLocations = () => (
  <Stack spacing={2}>
    <SectionHeader title="Pickup Locations" />
    <PickupLocationSection />
  </Stack>
);

export default PickupLocations;
