import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import {
    Box,
    Button,
    TextField,
    Typography,
    Link,
    Alert,
} from "@mui/material";
import { authTokenAtom, userDataAtom, isAuthenticatedAtom } from "../../lib/state/atoms/authAtoms";
import { loginWithFrontendUser } from "@/lib/auth/localAuth";

export default function Login() {
    const navigate = useNavigate();
    const setAuthToken = useSetAtom(authTokenAtom);
    const setUserData = useSetAtom(userDataAtom);
    const setIsAuthenticated = useSetAtom(isAuthenticatedAtom);

    const [formData, setFormData] = useState({
        username: "admin",
        password: "admin"
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const { token, admin } = await loginWithFrontendUser(
                formData.username,
                formData.password
            );

            setAuthToken(token);
            setUserData(admin);
            setIsAuthenticated(true);

            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    };


    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", maxWidth: 400 }}>
            <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                Log In
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="email"
                autoFocus
                value={formData.username}
                onChange={handleChange}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
            />

            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
            >
                Sign In
            </Button>

            <Box sx={{ textAlign: "center" }}>
                <Link href="/auth/signup" variant="body2">
                    {"Don't have an account? Sign Up"}
                </Link>
            </Box>
        </Box>
    );
}
