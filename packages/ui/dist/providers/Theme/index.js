'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use, useCallback, useEffect, useState } from 'react';
import { useConfig } from '../Config/index.js';
const initialContext = {
  autoMode: true,
  setTheme: () => null,
  theme: 'light'
};
const Context = /*#__PURE__*/createContext(initialContext);
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}
const getTheme = cookieKey => {
  let theme;
  const themeFromCookies = window.document.cookie.split('; ').find(row => row.startsWith(`${cookieKey}=`))?.split('=')[1];
  if (themeFromCookies === 'light' || themeFromCookies === 'dark') {
    theme = themeFromCookies;
  } else {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
  return {
    theme,
    themeFromCookies
  };
};
export const defaultTheme = 'light';
export const ThemeProvider = t0 => {
  const $ = _c(11);
  const {
    children,
    theme: initialTheme
  } = t0;
  const {
    config
  } = useConfig();
  const preselectedTheme = config.admin.theme;
  const cookieKey = `${config.cookiePrefix || "payload"}-theme`;
  const [theme, setThemeState] = useState(initialTheme || defaultTheme);
  const [autoMode, setAutoMode] = useState();
  let t1;
  let t2;
  if ($[0] !== cookieKey || $[1] !== preselectedTheme) {
    t1 = () => {
      if (preselectedTheme !== "all") {
        return;
      }
      const {
        theme: theme_0,
        themeFromCookies
      } = getTheme(cookieKey);
      setThemeState(theme_0);
      setAutoMode(!themeFromCookies);
    };
    t2 = [preselectedTheme, cookieKey];
    $[0] = cookieKey;
    $[1] = preselectedTheme;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] !== cookieKey) {
    t3 = themeToSet => {
      if (themeToSet === "light" || themeToSet === "dark") {
        setThemeState(themeToSet);
        setAutoMode(false);
        setCookie(cookieKey, themeToSet, 365);
        document.documentElement.setAttribute("data-theme", themeToSet);
      } else {
        if (themeToSet === "auto") {
          setCookie(cookieKey, themeToSet, -1);
          const themeFromOS = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", themeFromOS);
          setAutoMode(true);
          setThemeState(themeFromOS);
        }
      }
    };
    $[4] = cookieKey;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const setTheme = t3;
  let t4;
  if ($[6] !== autoMode || $[7] !== children || $[8] !== setTheme || $[9] !== theme) {
    t4 = _jsx(Context, {
      value: {
        autoMode,
        setTheme,
        theme
      },
      children
    });
    $[6] = autoMode;
    $[7] = children;
    $[8] = setTheme;
    $[9] = theme;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
};
export const useTheme = () => use(Context);
//# sourceMappingURL=index.js.map