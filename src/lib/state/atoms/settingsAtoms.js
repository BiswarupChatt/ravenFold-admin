import { atomWithStorage } from "jotai/utils";
import { BROWSER_STORAGE_KEYS } from "../../../utils/constants/browserStorageKeys";
import { THEME_OPTIONS } from "../../../utils/constants/themeOptions";

export const themeAtom = atomWithStorage(
  BROWSER_STORAGE_KEYS.theme,
  THEME_OPTIONS.LIGHT,
  undefined,
  { getOnInit: true } 
);
