import Stack from "@mui/material/Stack";

import SectionHeader from "@/components/SectionHeader";
import PromotionSection from "./components/PromotionSection";

const Coupon = () => (
  <Stack spacing={2}>
    <SectionHeader title="Promotions" />
    <PromotionSection />
  </Stack>
);

export default Coupon;
