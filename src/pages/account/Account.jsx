import { Box } from "@mui/material";
import { useAtomValue } from "jotai";
import SectionSubHeader from "@/components/SectionSubHeader";
import { authTokenAtom } from "@/lib/state/atoms/authAtoms";
import ResetPasswordForm from "./components/ResetPasswordForm";
import SectionHeader from "@/components/SectionHeader";

const Account = () => {
  const authToken = useAtomValue(authTokenAtom);

  return (
    <>
      <SectionHeader title="Account" />

      <SectionSubHeader
        title="Security"
        description="Manage your password and account security"
      />

      <Box sx={{ mt: 2 }}>
        <ResetPasswordForm authToken={authToken} />
      </Box>
    </>
  );
};

export default Account;
