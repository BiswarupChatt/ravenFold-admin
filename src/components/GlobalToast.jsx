import { Snackbar, Alert } from "@mui/material";

export default function GlobalToast({ toast, close }) {
    return (
        <Snackbar
            open={toast.open}
            autoHideDuration={3000}
            onClose={close}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
            <Alert variant="filled" severity={toast.severity} onClose={close}>
                {toast.message}
            </Alert>
        </Snackbar>
    );
}
