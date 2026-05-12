import { useEffect, useState } from "react";

// ViewportSize enum
export const ViewportSize = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
};

// Breakpoints configuration
const BREAKPOINTS = {
  MOBILE_MAX: 767,
  TABLET_MIN: 768,
  TABLET_MAX: 1023,
  DESKTOP_MIN: 1024,
};

export default function useResponsiveView() {
  const [state, setState] = useState(getCurrentState());

  useEffect(() => {
    function handleResize() {
      setState(getCurrentState());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}

function getCurrentState() {
  if (typeof window === 'undefined') {
    return createViewState(ViewportSize.DESKTOP);
  }

  const width = window.innerWidth;
  const viewportSize = getViewportSize(width);
  
  return createViewState(viewportSize);
}

function getViewportSize(width) {
  if (width <= BREAKPOINTS.MOBILE_MAX) {
    return ViewportSize.MOBILE;
  }
  
  if (width >= BREAKPOINTS.TABLET_MIN && width <= BREAKPOINTS.TABLET_MAX) {
    return ViewportSize.TABLET;
  }
  
  return ViewportSize.DESKTOP;
}

function createViewState(viewportSize) {
  return {
    view: viewportSize,
    isMobile: viewportSize === ViewportSize.MOBILE,
    isTablet: viewportSize === ViewportSize.TABLET,
    isDesktop: viewportSize === ViewportSize.DESKTOP,
  };
}