import { atomWithStorage } from "jotai/utils";
import { BROWSER_STORAGE_KEYS } from "../../../utils/constants/browserStorageKeys";

// Auth state atoms
export const authTokenAtom = atomWithStorage(
    BROWSER_STORAGE_KEYS.authToken,
    null
);

export const userDataAtom = atomWithStorage(
    BROWSER_STORAGE_KEYS.userData,
    {
        id: null,
        email: null,
        name: null,
        role: null
    }
);

export const isAuthenticatedAtom = atomWithStorage(
    BROWSER_STORAGE_KEYS.isAuthenticated,
    false,
    undefined,
    { getOnInit: true }
);
