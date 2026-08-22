import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createAdminMfaSetup,
  disableAdminMfa,
  enableAdminMfa,
  getAdminMfaStatus,
} from "@/lib/auth/localAuth";

const AdminMfaForm = ({ authToken }) => {
  const [status, setStatus] = useState({ enabled: false, pendingSetup: false });
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadStatus = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }

      try {
        const nextStatus = await getAdminMfaStatus(authToken);

        if (isActive) {
          setStatus(nextStatus);
        }
      } catch (err) {
        if (isActive) {
          setError(err?.message || "Failed to load MFA status.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isActive = false;
    };
  }, [authToken]);

  const startSetup = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const setupData = await createAdminMfaSetup(authToken);

      setSetup(setupData);
      setStatus((current) => ({ ...current, pendingSetup: true }));
      setSuccess("MFA setup generated. Add it to your authenticator app, then enter the code.");
    } catch (err) {
      setError(err?.message || "Failed to start MFA setup.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnable = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const nextStatus = await enableAdminMfa(authToken, code);

      setStatus(nextStatus);
      setSetup(null);
      setCode("");
      setSuccess("Admin MFA is enabled.");
    } catch (err) {
      setError(err?.message || "Failed to enable MFA.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const nextStatus = await disableAdminMfa(authToken, code);

      setStatus(nextStatus);
      setSetup(null);
      setCode("");
      setSuccess("Admin MFA is disabled.");
    } catch (err) {
      setError(err?.message || "Failed to disable MFA.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 3,
        mt: 4,
        p: 3,
        width: 1,
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Admin MFA
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Require a 6-digit authenticator app code when signing in to admin.
          </Typography>
        </Box>

        {loading ? <CircularProgress size={24} /> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        {!loading && status.enabled ? (
          <Alert severity="success">MFA is enabled for this admin account.</Alert>
        ) : null}

        {!loading && !status.enabled ? (
          <Alert severity="warning">MFA is not enabled for this admin account.</Alert>
        ) : null}

        {setup ? (
          <Stack spacing={1.5}>
            {setup.otpauthUrl ? (
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: "common.white",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  display: "flex",
                  height: 220,
                  justifyContent: "center",
                  width: 220,
                }}
              >
                <QRCodeSVG
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  size={184}
                  value={setup.otpauthUrl}
                />
              </Box>
            ) : null}
            <Typography color="text.secondary" variant="body2">
              Scan this QR code with your authenticator app.
            </Typography>
            <Typography fontWeight={700}>Manual setup key</Typography>
            <TextField
              fullWidth
              value={setup.manualEntryKey || ""}
              InputProps={{ readOnly: true }}
            />
            <Typography color="text.secondary" variant="body2">
              In your authenticator app, add a new account manually and paste this key.
            </Typography>
          </Stack>
        ) : null}

        {(setup || status.enabled) ? (
          <TextField
            fullWidth
            label="Authenticator code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputProps={{
              inputMode: "numeric",
              maxLength: 6,
              pattern: "[0-9]*",
            }}
          />
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {!status.enabled ? (
            <>
              <Button disabled={saving || loading} onClick={startSetup} variant="outlined">
                {setup ? "Regenerate setup" : "Set up MFA"}
              </Button>
              {setup ? (
                <Button disabled={saving || code.length !== 6} onClick={handleEnable} variant="contained">
                  Enable MFA
                </Button>
              ) : null}
            </>
          ) : (
            <Button color="error" disabled={saving || code.length !== 6} onClick={handleDisable} variant="outlined">
              Disable MFA
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default AdminMfaForm;
