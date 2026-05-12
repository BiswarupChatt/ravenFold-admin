import GlobalToast from "@/components/GlobalToast";
import { createContext, useContext, useState, useCallback } from "react";

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

    const success = (msg) => show(msg, "success");
    const error = (msg) => show(msg, "error");
    const warning = (msg) => show(msg, "warning");
    const info = (msg) => show(msg, "info");

    const close = () => setToast((t) => ({ ...t, open: false }));

    return (
        <ToastContext.Provider value={{ success, error, warning, info }}>
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
