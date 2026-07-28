import { useEffect } from "react";
import { useAtom } from "jotai";

import { BROWSER_STORAGE_KEYS } from "../../utils/constants/browserStorageKeys";
import { getDataInBrowser } from "../../utils/methods/DataInBrowser";
import { THEME_OPTIONS } from "../../utils/constants/themeOptions";
import { themeAtom } from "./atoms/settingsAtoms";
import {
    authTokenAtom,
    userDataAtom,
    isAuthenticatedAtom,
} from "./atoms/authAtoms";


export default function StateBootstrap() {
    const [, setTheme] = useAtom(themeAtom);
    const [, setAuthToken] = useAtom(authTokenAtom);
    const [, setUserData] = useAtom(userDataAtom);
    const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);

    useEffect(() => {
        const configData = {
            theme:
                getDataInBrowser(BROWSER_STORAGE_KEYS.theme) ??
                THEME_OPTIONS.LIGHT,
        };

        const authData = {
            authToken:
                getDataInBrowser(BROWSER_STORAGE_KEYS.authToken) ?? null,
            userData:
                getDataInBrowser(BROWSER_STORAGE_KEYS.userData) ?? null,
            isAuthenticated:
                getDataInBrowser(BROWSER_STORAGE_KEYS.isAuthenticated) ?? false,
        };

        setTheme(configData.theme);
        setAuthToken(authData.authToken);
        setUserData(authData.userData);
        setIsAuthenticated(authData.isAuthenticated);

    }, [
        setTheme,
        setAuthToken,
        setUserData,
        setIsAuthenticated,
    ]);

    return null;
}
