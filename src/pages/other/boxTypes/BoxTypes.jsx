import Stack from "@mui/material/Stack";

import SectionHeader from "@/components/SectionHeader";
import BoxTypeSection from "./components/BoxTypeSection";

const BoxTypes = () => (
  <Stack spacing={2}>
    <SectionHeader title="Box Types" />
    <BoxTypeSection />
  </Stack>
);

export default BoxTypes;
