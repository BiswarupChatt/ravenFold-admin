import { useState } from "react";
import {
    Box,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Typography,
    Paper,
    Grid,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { resetPassword } from "@/lib/auth/localAuth";

const ResetPasswordForm = () => {
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [visibleField, setVisibleField] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleVisibility = (field) => {
        setVisibleField((prev) => (prev === field ? "" : field));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (!formData.oldPassword || !formData.newPassword) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            const res = await resetPassword(formData.oldPassword, formData.newPassword);
            setSuccess(res.message || "Password updated successfully!");
            setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to reset password.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                width: 1,
                borderRadius: 3,
                mt: 4,
            }}
        >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Reset Password
            </Typography>

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Grid container spacing={2}>
                    <Grid size={{ sm: 12, md: 6 }}>
                        <TextField
                            label="Old Password"
                            type={visibleField === "oldPassword" ? "text" : "password"}
                            name="oldPassword"
                            value={formData.oldPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => toggleVisibility("oldPassword")}
                                            edge="end"
                                        >
                                            {visibleField === "oldPassword" ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid size={{ sm: 12, md: 6 }}>
                        <TextField
                            label="New Password"
                            type={visibleField === "newPassword" ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => toggleVisibility("newPassword")}
                                            edge="end"
                                        >
                                            {visibleField === "newPassword" ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid size={{ sm: 12, md: 6 }}>
                        <TextField
                            label="Confirm New Password"
                            type={visibleField === "confirmPassword" ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => toggleVisibility("confirmPassword")}
                                            edge="end"
                                        >
                                            {visibleField === "confirmPassword" ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid size={{ sm: 12, md: 6 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading}
                            sx={{ mt: 1 }}
                        >
                            {loading ? <CircularProgress size={24} /> : "Update Password"}
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

export default ResetPasswordForm;
