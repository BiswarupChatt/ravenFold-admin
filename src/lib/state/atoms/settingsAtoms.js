import { atomWithStorage } from "jotai/utils";
import { BROWSER_STORAGE_KEYS } from "../../../utils/constants/browserStorageKeys";
import { ITEM_ALIGNMENTS } from "../../../utils/constants/itemsAlignment";
import { THEME_OPTIONS } from "../../../utils/constants/themeOptions";

export const sidebarAlignmentAtom = atomWithStorage(
    BROWSER_STORAGE_KEYS.sidebarAlignment,
    ITEM_ALIGNMENTS.LEFT
);
export const navitemAlignmentsAtom = atomWithStorage(
    BROWSER_STORAGE_KEYS.navitemAlignments,
    ITEM_ALIGNMENTS.LEFT
);
export const themeAtom = atomWithStorage(
  BROWSER_STORAGE_KEYS.theme,
  THEME_OPTIONS.LIGHT,
  undefined,
  { getOnInit: true } 
);