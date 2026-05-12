// src/lib/state/SettingsStateBootstrap.jsx
import React, { useEffect } from "react";
import { useAtom } from "jotai";

import { BROWSER_STORAGE_KEYS } from "../../utils/constants/browserStorageKeys";
import { getDataInBrowser } from "../../utils/methods/DataInBrowser";
import { ITEM_ALIGNMENTS } from "../../utils/constants/itemsAlignment";
import { THEME_OPTIONS } from "../../utils/constants/themeOptions";

// Import settings atoms
import {
    sidebarAlignmentAtom,
    navitemAlignmentsAtom,
    themeAtom,
} from "./atoms/settingsAtoms";

// Import auth atoms
import {
    authTokenAtom,
    userDataAtom,
    isAuthenticatedAtom,
} from "./atoms/authAtoms";


export default function StateBootstrap() {
    // Settings atoms
    const [, setSidebar] = useAtom(sidebarAlignmentAtom);
    const [, setNav] = useAtom(navitemAlignmentsAtom);
    const [, setTheme] = useAtom(themeAtom);

    // Auth atoms
    const [, setAuthToken] = useAtom(authTokenAtom);
    const [, setUserData] = useAtom(userDataAtom);
    const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);

    useEffect(() => {
        // Settings configuration
        const configData = {
            sidebarAlignment:
                getDataInBrowser(BROWSER_STORAGE_KEYS.sidebarAlignment) ??
                ITEM_ALIGNMENTS.LEFT,
            navitemAlignments:
                getDataInBrowser(BROWSER_STORAGE_KEYS.navitemAlignments) ??
                ITEM_ALIGNMENTS.RIGHT,
            theme:
                getDataInBrowser(BROWSER_STORAGE_KEYS.theme) ??
                THEME_OPTIONS.LIGHT,
        };

        // Auth configuration
        const authData = {
            authToken:
                getDataInBrowser(BROWSER_STORAGE_KEYS.authToken) ?? null,
            userData:
                getDataInBrowser(BROWSER_STORAGE_KEYS.userData) ?? null,
            isAuthenticated:
                getDataInBrowser(BROWSER_STORAGE_KEYS.isAuthenticated) ?? false,
        };

        // Set settings states
        setSidebar(configData.sidebarAlignment);
        setNav(configData.navitemAlignments);
        setTheme(configData.theme);

        // Set auth states
        setAuthToken(authData.authToken);
        setUserData(authData.userData);
        setIsAuthenticated(authData.isAuthenticated);

    }, [
        setSidebar,
        setNav,
        setTheme,
        setAuthToken,
        setUserData,
        setIsAuthenticated,
    ]);

    return null; // nothing to render
}
