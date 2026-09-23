import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";

import { AUTH_EXPIRED_EVENT } from "@/lib/api/apiClient";
import { authTokenAtom, isAuthenticatedAtom, userDataAtom } from "@/lib/state/atoms/authAtoms";

const emptyUser = {
  id: null,
  email: null,
  firstName: null,
  lastName: null,
  name: null,
  role: null,
};

export default function AuthExpiryHandler() {
  const navigate = useNavigate();
  const setAuthToken = useSetAtom(authTokenAtom);
  const setIsAuthenticated = useSetAtom(isAuthenticatedAtom);
  const setUserData = useSetAtom(userDataAtom);

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuthToken(null);
      setUserData(emptyUser);
      setIsAuthenticated(false);
      navigate("/auth/login", { replace: true });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [navigate, setAuthToken, setIsAuthenticated, setUserData]);

  return null;
}
