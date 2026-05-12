import { useEffect } from "react";

/**
 * Hook to call a callback when user clicks outside the passed ref.
 * @param {React.RefObject} ref - The ref to check for outside clicks.
 * @param {Function} callback - The function to call when outside click detected.
 */
export default function useClickOutside(ref, callback) {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}
