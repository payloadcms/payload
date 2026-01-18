'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useWindowInfo } from '@faceless-ui/window-info';
import { usePathname } from 'next/navigation.js';
import React, { useEffect, useRef } from 'react';
import { usePreferences } from '../../providers/Preferences/index.js';
/**
 * @internal
 */
export const NavContext = /*#__PURE__*/React.createContext({
  hydrated: false,
  navOpen: true,
  navRef: null,
  setNavOpen: () => {},
  shouldAnimate: false
});
export const useNav = () => React.use(NavContext);
const getNavPreference = async getPreference => {
  const navPrefs = await getPreference('nav');
  const preferredState = navPrefs?.open;
  if (typeof preferredState === 'boolean') {
    return preferredState;
  } else {
    return true;
  }
};
/**
 * @internal
 */
export const NavProvider = ({
  children,
  initialIsOpen
}) => {
  const {
    breakpoints: {
      l: largeBreak,
      m: midBreak,
      s: smallBreak
    }
  } = useWindowInfo();
  const pathname = usePathname();
  const {
    getPreference
  } = usePreferences();
  const navRef = useRef(null);
  // initialize the nav to be closed
  // this is because getting the preference is async
  // so instead of closing it after the preference is loaded
  // we will open it after the preference is loaded
  const [navOpen, setNavOpen] = React.useState(initialIsOpen);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  // on load check the user's preference and set "initial" state
  useEffect(() => {
    if (largeBreak === false) {
      const setNavFromPreferences = async () => {
        const preferredState = await getNavPreference(getPreference);
        setNavOpen(preferredState);
      };
      void setNavFromPreferences();
    }
  }, [largeBreak, getPreference, setNavOpen]);
  // on smaller screens where the nav is a modal
  // close the nav when the user navigates away
  useEffect(() => {
    if (smallBreak === true) {
      setNavOpen(false);
    }
  }, [pathname]);
  // on open and close, lock the body scroll
  // do not do this on desktop, the sidebar is not a modal
  useEffect(() => {
    if (navRef.current) {
      if (navOpen && midBreak) {
        navRef.current.style.overscrollBehavior = 'contain';
      } else {
        navRef.current.style.overscrollBehavior = 'auto';
      }
    }
  }, [navOpen, midBreak]);
  // on smaller screens where the nav is a modal
  // close the nav when the user resizes down to mobile
  // the sidebar is a modal on mobile
  useEffect(() => {
    if (largeBreak === true || midBreak === true || smallBreak === true) {
      setNavOpen(false);
    }
    setHydrated(true);
    const timeout = setTimeout(() => {
      setShouldAnimate(true);
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [largeBreak, midBreak, smallBreak]);
  // when the component unmounts, clear all body scroll locks
  useEffect(() => {
    return () => {
      if (navRef.current) {
        navRef.current.style.overscrollBehavior = 'auto';
      }
    };
  }, []);
  return /*#__PURE__*/_jsx(NavContext, {
    value: {
      hydrated,
      navOpen,
      navRef,
      setNavOpen,
      shouldAnimate
    },
    children: children
  });
};
//# sourceMappingURL=context.js.map