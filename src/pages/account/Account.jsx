import { Box } from "@mui/material";
import SectionSubHeader from "@/components/SectionSubHeader";
import ResetPasswordForm from "./components/ResetPasswordForm";
import SectionHeader from "@/components/SectionHeader";

const Account = () => {
  return (
    <>
      <SectionHeader title="Account" />

      <SectionSubHeader
        title="Security"
        description="Manage your password and account security"
      />

      <Box sx={{ mt: 2 }}>
        <ResetPasswordForm />
      </Box>
    </>
  );
};

export default Account;
