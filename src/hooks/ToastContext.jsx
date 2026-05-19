import GlobalToast from "@/components/GlobalToast";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const show = useCallback((message, severity = "success") => {
        setToast({ open: true, message, severity });
    }, []);

    const success = useCallback((msg) => show(msg, "success"), [show]);
    const error = useCallback((msg) => show(msg, "error"), [show]);
    const warning = useCallback((msg) => show(msg, "warning"), [show]);
    const info = useCallback((msg) => show(msg, "info"), [show]);
    const value = useMemo(() => ({ success, error, warning, info }), [error, info, success, warning]);

    const close = () => setToast((t) => ({ ...t, open: false }));

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* global toast viewer */}
            <GlobalToast toast={toast} close={close} />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);


// ExampleComponent.jsx
// import { useToast } from "@/hooks/ToastContext";

// export default function ExampleComponent() {
//     const toast = useToast(); // access global toast

//     const handleClick = () => {
//         toast.success("Operation completed successfully!");
//        // toast.error("Something went wrong");
//        // toast.warning("Please check the form");
//        // toast.info("This is an info message");
//     };

//     return (
//         <button onClick={handleClick}>
//             Show Toast
//         </button>
//     );
// }
